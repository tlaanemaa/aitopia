/**
 * TheatricalOrchestrator - Coordinates LLM interactions with the domain model
 */
import { TheatricalWorld } from "../models/TheatricalWorld";
import { StoryOrchestrator } from "../models/StoryOrchestrator";
import { LLMService, LLMConfig } from "./LLMService";
import { WorldEvent } from "../types/events";
import { CharacterAction } from "../types/actions";

/**
 * Result of a turn in the theatrical experience
 */
export interface TurnResult {
  events: WorldEvent[];
  narrativeDescription: string;
  characterId?: string;
  characterName?: string;
  characterAction?: CharacterAction;
  suggestedResponse?: string;
  shouldAdvance: boolean;
  requiresUserInput: boolean;
}

/**
 * Interface for subscribers to theatrical experience events
 */
export interface TheatricalExperienceListener {
  onNarration(description: string): void;
  onEvents(events: WorldEvent[]): void;
  onCharacterTurn(characterId: string, characterName: string): void;
  onRequireUserInput(): void;
  onError(error: Error): void;
}

/**
 * Configuration for the theatrical orchestrator
 */
export interface TheatricalOrchestratorConfig {
  llmConfig: LLMConfig;
  autoAdvance: boolean;
  turnDelay: number; // milliseconds between turns
  maxConsecutiveTurns: number;
}

/**
 * Theatrical Orchestrator Service
 * Coordinates interactions between the LLM and the domain model
 */
export class TheatricalOrchestrator {
  private world: TheatricalWorld;
  private orchestrator: StoryOrchestrator;
  private llmService: LLMService;
  private listeners: TheatricalExperienceListener[] = [];
  private config: TheatricalOrchestratorConfig;
  private isProcessingTurn = false;
  private consecutiveTurns = 0;
  private lastUserInput?: string;
  
  /**
   * Create a new theatrical orchestrator
   */
  constructor(
    world: TheatricalWorld, 
    config: TheatricalOrchestratorConfig
  ) {
    this.world = world;
    this.orchestrator = new StoryOrchestrator(world);
    this.llmService = new LLMService(config.llmConfig);
    this.config = config;
  }
  
  /**
   * Add a listener for theatrical experience events
   */
  addListener(listener: TheatricalExperienceListener): void {
    this.listeners.push(listener);
  }
  
  /**
   * Remove a listener
   */
  removeListener(listener: TheatricalExperienceListener): void {
    const index = this.listeners.indexOf(listener);
    if (index !== -1) {
      this.listeners.splice(index, 1);
    }
  }
  
  /**
   * Start the theatrical experience
   */
  async start(): Promise<void> {
    try {
      // Generate initial director actions to set the scene
      const directorResponse = await this.llmService.generateDirectorActions(this.orchestrator);
      
      // Notify listeners of the narration
      this.notifyNarration(directorResponse.narrativeDescription);
      
      // Process the actions
      const results = this.orchestrator.processDirectorActions(directorResponse.actions);
      
      // Notify listeners of the events
      this.notifyEvents(results.events);
      
      // If there's a next character, advance to them
      if (directorResponse.nextCharacterId) {
        await this.processCharacterTurn(directorResponse.nextCharacterId);
      } else {
        // Otherwise, request user input
        this.notifyRequireUserInput();
      }
    } catch (error) {
      this.notifyError(error instanceof Error ? error : new Error(String(error)));
    }
  }
  
  /**
   * Process user input
   */
  async processUserInput(input: string): Promise<TurnResult> {
    // Store the input for context
    this.lastUserInput = input;
    this.orchestrator.addUserInput(input);
    
    try {
      // Process the user input to determine the next step
      const result = await this.processTurn(input);
      
      // Reset consecutive turns counter since user provided input
      this.consecutiveTurns = 0;
      
      return result;
    } catch (error) {
      this.notifyError(error instanceof Error ? error : new Error(String(error)));
      
      // Return a default result on error
      return {
        events: [],
        narrativeDescription: "Something went wrong with processing your input.",
        shouldAdvance: false,
        requiresUserInput: true
      };
    }
  }
  
  /**
   * Process the next turn in the theatrical experience
   */
  private async processTurn(userInput?: string): Promise<TurnResult> {
    if (this.isProcessingTurn) {
      return {
        events: [],
        narrativeDescription: "Already processing a turn...",
        shouldAdvance: false,
        requiresUserInput: false
      };
    }
    
    this.isProcessingTurn = true;
    this.consecutiveTurns++;
    
    try {
      // Get the orchestrator result for this turn
      const orchestratorResult = this.orchestrator.processTurn();
      
      // Check if we need to process playwright actions
      if (!orchestratorResult.activeCharacter || this.consecutiveTurns % 3 === 0) {
        // Get director actions from LLM
        const directorResponse = await this.llmService.generateDirectorActions(
          this.orchestrator,
          userInput
        );
        
        // Notify listeners of the narration
        this.notifyNarration(directorResponse.narrativeDescription);
        
        // Process each action
        const allEvents: WorldEvent[] = [];
        for (const action of directorResponse.actions) {
          const result = this.world.getDirector().processAction(action);
          allEvents.push(...result.worldEvents);
        }
        
        // Notify listeners of events
        if (allEvents.length > 0) {
          this.notifyEvents(allEvents);
        }
        
        // If we have a specified next character, prepare for their turn
        if (directorResponse.nextCharacterId) {
          const character = this.world.getCharacter(directorResponse.nextCharacterId);
          if (character) {
            // Schedule the character's turn after a delay
            setTimeout(() => {
              this.prepareCharacterTurn(directorResponse.nextCharacterId!);
            }, this.config.turnDelay);
            
            return {
              events: allEvents,
              narrativeDescription: directorResponse.narrativeDescription,
              characterId: directorResponse.nextCharacterId,
              characterName: character.name,
              shouldAdvance: true,
              requiresUserInput: false
            };
          }
        }
        
        // If no character specified or character not found, require user input
        return {
          events: allEvents,
          narrativeDescription: directorResponse.narrativeDescription,
          shouldAdvance: false,
          requiresUserInput: true
        };
      } else {
        // Process the active character's turn
        return await this.processCharacterTurn(
          orchestratorResult.activeCharacter.id,
          userInput
        );
      }
    } catch (error) {
      this.notifyError(error instanceof Error ? error : new Error(String(error)));
      
      return {
        events: [],
        narrativeDescription: "An error occurred while processing the turn.",
        shouldAdvance: false,
        requiresUserInput: true
      };
    } finally {
      this.isProcessingTurn = false;
    }
  }
  
  /**
   * Process a character's turn
   */
  private async processCharacterTurn(
    characterId: string,
    userInput?: string
  ): Promise<TurnResult> {
    const character = this.world.getCharacter(characterId);
    
    if (!character) {
      throw new Error(`Character with ID ${characterId} not found`);
    }
    
    // Notify listeners that it's this character's turn
    this.notifyCharacterTurn(characterId, character.name);
    
    // Get action from LLM for this character
    const characterResponse = await this.llmService.generateCharacterAction(
      this.world,
      characterId,
      userInput
    );
    
    // Process the action
    const events = this.world.processCharacterAction(characterId, characterResponse.action);
    
    // Notify listeners of events
    this.notifyEvents(events);
    
    // Determine if we should advance to the next turn automatically
    const shouldAdvance = this.config.autoAdvance && 
      this.consecutiveTurns < this.config.maxConsecutiveTurns;
    
    // Determine if we need user input
    const requiresUserInput = !shouldAdvance;
    
    // If we should advance, schedule the next turn
    if (shouldAdvance) {
      setTimeout(() => {
        this.processTurn();
      }, this.config.turnDelay);
    } else if (requiresUserInput) {
      this.notifyRequireUserInput();
    }
    
    return {
      events,
      narrativeDescription: characterResponse.narrativeDescription,
      characterId,
      characterName: character.name,
      characterAction: characterResponse.action,
      suggestedResponse: characterResponse.suggestedResponse,
      shouldAdvance,
      requiresUserInput
    };
  }
  
  /**
   * Prepare for a character's turn
   */
  private async prepareCharacterTurn(characterId: string): Promise<void> {
    const character = this.world.getCharacter(characterId);
    
    if (!character) {
      throw new Error(`Character with ID ${characterId} not found`);
    }
    
    // Notify listeners that it's this character's turn
    this.notifyCharacterTurn(characterId, character.name);
    
    // Process the character's turn after a delay
    setTimeout(async () => {
      try {
        await this.processCharacterTurn(characterId);
      } catch (error) {
        this.notifyError(error instanceof Error ? error : new Error(String(error)));
      }
    }, this.config.turnDelay);
  }
  
  /**
   * Notify listeners of narration
   */
  private notifyNarration(description: string): void {
    for (const listener of this.listeners) {
      try {
        listener.onNarration(description);
      } catch (error) {
        console.error("Error in narrative listener:", error);
      }
    }
  }
  
  /**
   * Notify listeners of events
   */
  private notifyEvents(events: WorldEvent[]): void {
    for (const listener of this.listeners) {
      try {
        listener.onEvents(events);
      } catch (error) {
        console.error("Error in events listener:", error);
      }
    }
  }
  
  /**
   * Notify listeners of a character turn
   */
  private notifyCharacterTurn(characterId: string, characterName: string): void {
    for (const listener of this.listeners) {
      try {
        listener.onCharacterTurn(characterId, characterName);
      } catch (error) {
        console.error("Error in character turn listener:", error);
      }
    }
  }
  
  /**
   * Notify listeners that user input is required
   */
  private notifyRequireUserInput(): void {
    for (const listener of this.listeners) {
      try {
        listener.onRequireUserInput();
      } catch (error) {
        console.error("Error in require user input listener:", error);
      }
    }
  }
  
  /**
   * Notify listeners of an error
   */
  private notifyError(error: Error): void {
    for (const listener of this.listeners) {
      try {
        listener.onError(error);
      } catch (listenerError) {
        console.error("Error in error listener:", listenerError);
      }
    }
  }
} 