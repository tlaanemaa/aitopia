/**
 * Orchestrator - Coordinates LLM interactions with the domain model
 */
import { WorldService } from "./WorldService";
import { StoryManager } from "./StoryManager";
import { LLMService, LLMConfig } from "./LLMService";
import { WorldEvent } from "../types/events";
import { CharacterAction } from "../types/actions";

/**
 * Result of a turn in the experience
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
 * Interface for subscribers to experience events
 */
export interface ExperienceListener {
  /**
   * Called when narration is provided
   */
  onNarration?(description: string): void;
  
  /**
   * Called for each event that occurs
   */
  onEvent?(event: WorldEvent): void;
  
  /**
   * Called when a character's turn begins
   */
  onCharacterTurn?(characterId: string, characterName: string): void;
  
  /**
   * Called when a character performs an action
   */
  onCharacterAction?(character: { id: string; name: string }, action: CharacterAction): void;
  
  /**
   * Called when user input is required
   */
  onRequireUserInput?(): void;
  
  /**
   * Called when an error occurs
   */
  onError?(error: Error): void;
}

/**
 * Configuration for the orchestrator
 */
export interface OrchestratorConfig {
  llmConfig: LLMConfig;
  autoAdvance: boolean;
  turnDelay: number; // milliseconds between turns
  maxConsecutiveTurns: number;
}

/**
 * Orchestrator Service
 * Coordinates interactions between the LLM and the domain model
 */
export class Orchestrator {
  private world: WorldService;
  private storyManager: StoryManager;
  private llmService: LLMService;
  private listeners: ExperienceListener[] = [];
  private config: OrchestratorConfig;
  private isProcessingTurn = false;
  private consecutiveTurns = 0;
  private lastUserInput?: string;
  
  /**
   * Create a new orchestrator
   */
  constructor(
    world: WorldService, 
    config: OrchestratorConfig
  ) {
    this.world = world;
    this.storyManager = new StoryManager(world);
    this.llmService = new LLMService(config.llmConfig);
    this.config = config;
  }
  
  /**
   * Add a listener for experience events
   */
  addListener(listener: ExperienceListener): void {
    this.listeners.push(listener);
  }
  
  /**
   * Remove a listener
   */
  removeListener(listener: ExperienceListener): void {
    const index = this.listeners.indexOf(listener);
    if (index !== -1) {
      this.listeners.splice(index, 1);
    }
  }
  
  /**
   * Notify listeners of narration
   */
  private notifyNarration(description: string): void {
    for (const listener of this.listeners) {
      if (listener.onNarration) {
        listener.onNarration(description);
      }
    }
  }
  
  /**
   * Notify listeners of events
   */
  private notifyEvents(events: WorldEvent[]): void {
    for (const event of events) {
      for (const listener of this.listeners) {
        if (listener.onEvent) {
          listener.onEvent(event);
        }
      }
    }
  }
  
  /**
   * Notify listeners of character turn
   */
  private notifyCharacterTurn(characterId: string, characterName: string): void {
    for (const listener of this.listeners) {
      if (listener.onCharacterTurn) {
        listener.onCharacterTurn(characterId, characterName);
      }
    }
  }
  
  /**
   * Notify listeners of character action
   */
  private notifyCharacterAction(character: { id: string; name: string }, action: CharacterAction): void {
    for (const listener of this.listeners) {
      if (listener.onCharacterAction) {
        listener.onCharacterAction(character, action);
      }
    }
  }
  
  /**
   * Notify listeners of need for user input
   */
  private notifyRequireUserInput(): void {
    for (const listener of this.listeners) {
      if (listener.onRequireUserInput) {
        listener.onRequireUserInput();
      }
    }
  }
  
  /**
   * Notify listeners of error
   */
  private notifyError(error: Error): void {
    for (const listener of this.listeners) {
      if (listener.onError) {
        listener.onError(error);
      }
    }
  }
  
  /**
   * Start the experience
   */
  async start(): Promise<void> {
    // Process the first turn
    return this.processTurn();
  }
  
  /**
   * Process user input
   */
  async processUserInput(input: string): Promise<void> {
    if (this.isProcessingTurn) {
      throw new Error('Cannot process user input while processing a turn');
    }
    
    this.lastUserInput = input;
    this.storyManager.processUserInput(input);
    
    return this.processTurn();
  }
  
  /**
   * Process a turn in the experience
   */
  private async processTurn(): Promise<void> {
    // Prevent multiple concurrent turns
    if (this.isProcessingTurn) {
      return;
    }
    
    this.isProcessingTurn = true;
    
    try {
      // Determine whether to advance with character or director actions
      // Every X turns, let the director take an action to advance the story
      const shouldUseDirector = this.consecutiveTurns >= this.config.maxConsecutiveTurns;
      
      let result: TurnResult;
      
      if (shouldUseDirector) {
        // Reset consecutive turns counter
        this.consecutiveTurns = 0;
        
        // Process director turn
        result = await this.processDirectorTurn();
      } else {
        // Get the focus character
        const characterId = this.storyManager.determineFocusCharacter();
        
        if (!characterId) {
          throw new Error('No character available for the turn');
        }
        
        // Process character turn
        result = await this.processCharacterTurn(characterId, this.lastUserInput);
        
        // Clear the last user input after it's processed
        this.lastUserInput = undefined;
        
        // Increment consecutive turns counter
        this.consecutiveTurns++;
      }
      
      // Increment the turn count in the story manager
      this.storyManager.incrementTurnCount();
      
      // Notify of narration
      if (result.narrativeDescription) {
        this.notifyNarration(result.narrativeDescription);
      }
      
      // Process the result
      if (result.requiresUserInput) {
        this.notifyRequireUserInput();
      }
    } catch (error) {
      this.notifyError(error instanceof Error ? error : new Error(String(error)));
    } finally {
      this.isProcessingTurn = false;
    }
  }
  
  /**
   * Process a director turn
   */
  private async processDirectorTurn(): Promise<TurnResult> {
    try {
      // Generate director actions
      const result = await this.llmService.generateDirectorActions(
        this.storyManager,
        this.lastUserInput
      );
      
      // Process the actions
      const processedResult = this.storyManager.processDirectorActions(result.actions);
      
      // Notify listeners of the events
      this.notifyEvents(processedResult.events);
      
      // If a next character is specified, set it as active
      if (result.nextCharacterId) {
        this.storyManager.setActiveCharacterId(result.nextCharacterId);
      }
      
      // If auto-advance is enabled, schedule the next turn
      if (this.config.autoAdvance) {
        setTimeout(() => {
          this.processTurn();
        }, this.config.turnDelay);
        
        return {
          events: processedResult.events,
          narrativeDescription: result.narrativeDescription,
          shouldAdvance: true,
          requiresUserInput: false
        };
      }
      
      // Otherwise, require user input
      return {
        events: processedResult.events,
        narrativeDescription: result.narrativeDescription,
        shouldAdvance: false,
        requiresUserInput: true
      };
    } catch (error) {
      this.notifyError(error instanceof Error ? error : new Error(String(error)));
      
      return {
        events: [],
        narrativeDescription: "An error occurred during the director's turn.",
        shouldAdvance: false,
        requiresUserInput: true
      };
    }
  }
  
  /**
   * Process a character's turn
   */
  private async processCharacterTurn(
    characterId: string, 
    userInput?: string
  ): Promise<TurnResult> {
    try {
      // Get the character
      const character = this.world.getCharacter(characterId);
      
      if (!character) {
        throw new Error(`Character with ID ${characterId} not found`);
      }
      
      // Notify listeners
      this.notifyCharacterTurn(characterId, character.name);
      
      // Generate the character's action
      const result = await this.llmService.generateCharacterAction(this.world, characterId, userInput);
      
      // Process the action
      const events = this.world.processCharacterAction(characterId, result.action);
      
      // Notify listeners of the events
      this.notifyEvents(events);
      
      // Also notify about the character action specifically
      this.notifyCharacterAction({ id: characterId, name: character.name }, result.action);
      
      // If auto-advance is enabled, schedule the next turn
      if (this.config.autoAdvance && this.consecutiveTurns < this.config.maxConsecutiveTurns) {
        setTimeout(() => {
          this.processTurn();
        }, this.config.turnDelay);
        
        return {
          events,
          narrativeDescription: result.narrativeDescription,
          characterId,
          characterName: character.name,
          characterAction: result.action,
          suggestedResponse: result.suggestedResponse,
          shouldAdvance: true,
          requiresUserInput: false
        };
      }
      
      // Otherwise, require user input
      return {
        events,
        narrativeDescription: result.narrativeDescription,
        characterId,
        characterName: character.name,
        characterAction: result.action,
        suggestedResponse: result.suggestedResponse,
        shouldAdvance: false,
        requiresUserInput: true
      };
    } catch (error) {
      this.notifyError(error instanceof Error ? error : new Error(String(error)));
      
      return {
        events: [],
        narrativeDescription: "An error occurred during the character's turn.",
        shouldAdvance: false,
        requiresUserInput: true
      };
    }
  }
} 