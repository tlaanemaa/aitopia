/**
 * StoryManager - Manages the overall story progression
 */
import { v4 as uuidv4 } from 'uuid';
import { WorldService } from './WorldService';
import { Character } from '../models/Character';
import { WorldEvent } from '../types/events';
import { CharacterAction } from '../types/actions';
import { NarrativePhase, PlotThread } from '../types/common';
import { getCurrentTime } from '../utils/time';
import { EntityRegistry } from '../models/EntityRegistry';
import { Emotion } from '../types/common';

/**
 * StoryManager configuration options
 */
export interface StoryManagerConfig {
  maxTurnsPerScene: number;
  maxTurnsPerPhase: number;
  maxUserInputsPerTurn: number;
  useTurnRotation: boolean;
  narrativeComplexity: 'simple' | 'standard' | 'complex';
  includeProps: boolean;
  turnRate: number;
  plotThreadsForResolution: number;
  turnsBeforeUser: number;
}

/**
 * StoryManager class - Manages the story progression
 */
export class StoryManager {
  readonly id: string;
  private world: WorldService;
  private registry: EntityRegistry;
  private userInput: string[];
  private turnCount: number;
  private sceneChangeCount: number;
  private activeCharacterId?: string;
  private plotThreads: Map<string, PlotThread & { id: string; title: string }>;
  private config: StoryManagerConfig;
  
  /**
   * Create a new story manager
   */
  constructor(world: WorldService, config: Partial<StoryManagerConfig> = {}) {
    this.id = uuidv4();
    this.world = world;
    this.registry = world.getRegistry();
    this.userInput = [];
    this.turnCount = 0;
    this.sceneChangeCount = 0;
    this.plotThreads = new Map();
    
    // Set default configuration
    this.config = {
      maxTurnsPerScene: 20,
      maxTurnsPerPhase: 50,
      maxUserInputsPerTurn: 1,
      useTurnRotation: true,
      narrativeComplexity: 'standard',
      includeProps: true,
      turnRate: 1,
      plotThreadsForResolution: 3,
      turnsBeforeUser: 5,
      ...config
    };
  }
  
  /**
   * Get the active character ID
   */
  getActiveCharacterId(): string | undefined {
    return this.activeCharacterId;
  }
  
  /**
   * Set the active character ID
   */
  setActiveCharacterId(characterId: string): void {
    const character = this.world.getCharacter(characterId);
    if (!character) {
      throw new Error(`Character with ID ${characterId} not found`);
    }
    
    this.activeCharacterId = characterId;
  }
  
  /**
   * Process user input and add it to the queue
   */
  processUserInput(input: string): void {
    this.userInput.push(input);
    this.world.logUserInput(input);
  }
  
  /**
   * Clear user input queue
   */
  clearUserInput(): void {
    this.userInput = [];
  }
  
  /**
   * Get user input
   */
  getUserInput(): string[] {
    return [...this.userInput];
  }
  
  /**
   * Get the turn count
   */
  getTurnCount(): number {
    return this.turnCount;
  }
  
  /**
   * Increment the turn count
   */
  incrementTurnCount(): void {
    this.turnCount++;
  }
  
  /**
   * Determine focus character for the current turn
   */
  determineFocusCharacter(): string | undefined {
    // If active character is already set, use it
    if (this.activeCharacterId) {
      return this.activeCharacterId;
    }
    
    // Get the next character from the director's rotation
    const nextCharacter = this.world.getNextCharacter();
    
    if (nextCharacter) {
      this.activeCharacterId = nextCharacter.id;
      return nextCharacter.id;
    }
    
    return undefined;
  }
  
  /**
   * Add a new plot thread
   */
  addPlotThread(title: string, description: string, characters: string[], goal: string): string {
    // Create a new plot thread
    const threadId = uuidv4();
    
    // Get all involved characters to validate
    const involvedCharacters = characters.map(id => this.world.getCharacter(id)).filter(Boolean);
    
    // Create the plot thread
    const plotThread: PlotThread & { id: string; title: string } = {
      id: threadId,
      title,
      description,
      characterIds: involvedCharacters.map(char => char!.id),
      goal,
      status: 'active',
      progress: 0,
      createdAt: getCurrentTime()
    };
    
    // Add to plot threads map
    this.plotThreads.set(threadId, plotThread);
    
    // Update the director's knowledge of plot threads
    const director = this.world.getDirector();
    director.addPlotThread(plotThread);
    
    return threadId;
  }
  
  /**
   * Resolve a plot thread
   */
  resolvePlotThread(threadId: string, resolution: string): boolean {
    const plotThread = this.plotThreads.get(threadId);
    
    if (!plotThread) {
      return false;
    }
    
    // Update the plot thread
    plotThread.status = 'resolved';
    plotThread.resolution = resolution;
    plotThread.resolvedAt = getCurrentTime();
    
    // Update the director's knowledge
    const director = this.world.getDirector();
    director.resolvePlotThread(threadId, resolution);
    
    return true;
  }
  
  /**
   * Process director actions
   */
  processDirectorActions(actions: any[]): {
    events: WorldEvent[];
    narrativeDescription: string;
  } {
    // Let the director process the actions
    const result = this.world.processPlaywrightAction({
      actionId: uuidv4(),
      timestamp: getCurrentTime(),
      ...actions[0] // Currently only processing the first action
    });
    
    return {
      events: result.worldEvents,
      narrativeDescription: result.worldEvents.length > 0 
        ? result.worldEvents[0].description 
        : "The story continues..."
    };
  }
  
  /**
   * Generate context for the LLM
   */
  generateLLMContext(userInput?: string): {
    world: string;
    activeCharacter: string;
    narrativePhase: string;
    turnCount: number;
  } {
    const director = this.world.getDirector();
    const scene = this.world.getCurrentScene();
    
    // Build world description
    const worldDescription = [
      `Current Scene: ${scene.name} - ${scene.description}`,
      `Time: ${scene.time}, Mood: ${scene.mood}`,
      `Characters in scene: ${this.world.getCharacters().map(c => c.name).join(', ')}`,
      `Props in scene: ${this.world.getProps().map(p => p.type).join(', ')}`,
      `Current Narrative Phase: ${director.getCurrentPhase()}`,
      `Plot Threads: ${Array.from(this.plotThreads.values())
        .filter(thread => thread.status === 'active')
        .map(thread => `${thread.title} (${thread.progress}% complete)`)
        .join(', ')}`
    ].join('\n');
    
    // Build active character description
    let activeCharacterDescription = 'No active character.';
    
    if (this.activeCharacterId) {
      const character = this.world.getCharacter(this.activeCharacterId);
      
      if (character) {
        activeCharacterDescription = [
          `Name: ${character.name}`,
          `Traits: ${character.traits.join(', ')}`,
          `Current emotion: ${character.currentEmotion}`,
          `Position: (${character.position.x}, ${character.position.y})`,
          `Backstory: ${character.backstory || 'Unknown'}`
        ].join('\n');
      }
    }
    
    return {
      world: worldDescription,
      activeCharacter: activeCharacterDescription,
      narrativePhase: director.getCurrentPhase(),
      turnCount: this.turnCount
    };
  }
} 