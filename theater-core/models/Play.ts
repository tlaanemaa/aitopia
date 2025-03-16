/**
 * Play - The main entry point for the theatrical storytelling system
 */
import { v4 as uuidv4 } from 'uuid';
import { TheatricalWorld } from './TheatricalWorld';
import { TheatricalOrchestrator, TheatricalExperienceListener } from '../services/TheatricalOrchestrator';
import { CharacterArchetype, Emotion, Position, NarrativePhase } from '../types/common';
import { LLMConfig } from '../services/LLMService';
import { Scene } from './Scene';
import { Character } from './Character';
import { Prop } from './Prop';
import { Playwright } from './Playwright';
import { WorldEvent } from '../types/events';
import { CharacterAction } from '../types/actions';
import { EntityRegistry } from './EntityRegistry';

/**
 * Configuration for a character in a play
 */
export interface PlayCharacterConfig {
  name: string;
  archetype?: CharacterArchetype;
  traits?: string[];
  backstory?: string;
  appearance?: string;
  goal?: string;
  initialEmotion?: Emotion;
  initialPosition?: Position;
  avatarUrl?: string;
}

/**
 * Configuration for a scene in a play
 */
export interface PlaySceneConfig {
  name: string;
  description: string;
  mood?: string;
  time?: string;
  width?: number;
  height?: number;
  backgroundImageUrl?: string;
}

/**
 * Configuration for a prop in a play
 */
export interface PlayPropConfig {
  type: string;
  name?: string;
  description: string;
  position: Position;
  size?: { width: number; height: number };
  movable?: boolean;
  interactable?: boolean;
  states?: string[];
  initialState?: string;
  imageUrl?: string;
}

/**
 * Configuration for a play
 */
export interface PlayConfig {
  title: string;
  genre?: string;
  theme?: string;
  scene: PlaySceneConfig;
  initialCharacters?: PlayCharacterConfig[];
  initialProps?: PlayPropConfig[];
  llm: LLMConfig;
  autoAdvance?: boolean;
  turnDelay?: number;
  maxConsecutiveTurns?: number;
}

/**
 * Listener for play events - equivalent to TheatricalExperienceListener but with simpler interface
 */
export interface PlayListener {
  onNarration?(text: string): void;
  onCharacterTurn?(characterId: string, characterName: string): void;
  onCharacterAction?(character: { id: string; name: string }, action: CharacterAction): void;
  onEvent?(event: WorldEvent): void;
  onError?(error: Error): void;
  onRequireUserInput?(): void;
}

/**
 * The main class for a theatrical play
 */
export class Play {
  private readonly id: string;
  private readonly world: TheatricalWorld;
  private readonly orchestrator: TheatricalOrchestrator;
  private readonly title: string;
  private readonly listenerMap: Map<PlayListener, TheatricalExperienceListener> = new Map();
  
  /**
   * Create a new play
   */
  constructor(config: PlayConfig) {
    this.id = uuidv4();
    this.title = config.title;
    
    // Create a registry for entity management
    const registry = new EntityRegistry();
    
    // Create the scene
    const scene = new Scene({
      name: config.scene.name,
      description: config.scene.description,
      mood: config.scene.mood || 'neutral',
      time: config.scene.time || 'day',
      width: config.scene.width || 100,
      height: config.scene.height || 100,
      obstacles: [],
      entrancePoints: [{ x: 0, y: 0 }],
      backgroundImageUrl: config.scene.backgroundImageUrl
    });
    
    // Create the playwright
    const playwright = new Playwright({
      name: 'Playwright',
      storyTitle: config.title,
      storyGenre: config.genre || 'Drama',
      storyTheme: config.theme || '',
      initialPhase: NarrativePhase.EXPOSITION
    });
    
    // Create the world
    this.world = new TheatricalWorld({
      registry,
      initialScene: scene,
      playwright
    });
    
    // Add characters
    if (config.initialCharacters) {
      config.initialCharacters.forEach(charConfig => {
        const character = new Character(
          {
            name: charConfig.name,
            traits: charConfig.traits || [],
            archetype: charConfig.archetype,
            backstory: charConfig.backstory || '',
            appearance: charConfig.appearance || '',
            goal: charConfig.goal || '',
            initialEmotion: charConfig.initialEmotion || Emotion.NEUTRAL,
            initialPosition: charConfig.initialPosition || { x: 50, y: 50 },
            avatarUrl: charConfig.avatarUrl
          },
          registry
        );
        
        this.world.addCharacter(character);
      });
    }
    
    // Add props
    if (config.initialProps) {
      config.initialProps.forEach(propConfig => {
        const prop = new Prop({
          type: propConfig.type,
          name: propConfig.name || propConfig.type,
          description: propConfig.description,
          initialPosition: propConfig.position,
          size: propConfig.size || { width: 1, height: 1 },
          movable: propConfig.movable,
          interactable: propConfig.interactable,
          states: propConfig.states || [],
          initialState: propConfig.initialState,
          imageUrl: propConfig.imageUrl
        });
        
        this.world.addProp(prop);
      });
    }
    
    // Create the orchestrator
    this.orchestrator = new TheatricalOrchestrator(this.world, {
      llmConfig: config.llm,
      autoAdvance: config.autoAdvance !== undefined ? config.autoAdvance : true,
      turnDelay: config.turnDelay || 1000,
      maxConsecutiveTurns: config.maxConsecutiveTurns || 5
    });
  }
  
  /**
   * Add a listener for play events
   */
  addListener(listener: PlayListener): void {
    const adaptedListener: TheatricalExperienceListener = {
      onNarration: listener.onNarration || (() => {}),
      onCharacterTurn: listener.onCharacterTurn || (() => {}),
      onEvents: (events) => {
        if (listener.onEvent) {
          events.forEach(event => listener.onEvent!(event));
        }
      },
      onRequireUserInput: listener.onRequireUserInput || (() => {}),
      onError: listener.onError || (() => {})
    };
    
    // Store the mapping so we can remove it later
    this.listenerMap.set(listener, adaptedListener);
    
    this.orchestrator.addListener(adaptedListener);
  }
  
  /**
   * Remove a listener
   */
  removeListener(listener: PlayListener): void {
    const adaptedListener = this.listenerMap.get(listener);
    if (adaptedListener) {
      this.orchestrator.removeListener(adaptedListener);
      this.listenerMap.delete(listener);
    }
  }
  
  /**
   * Start the play
   */
  async start(): Promise<void> {
    return this.orchestrator.start();
  }
  
  /**
   * Process user input
   */
  async processUserInput(input: string): Promise<void> {
    await this.orchestrator.processUserInput(input);
  }
  
  /**
   * Get the play's title
   */
  getTitle(): string {
    return this.title;
  }
  
  /**
   * Get the play's ID
   */
  getId(): string {
    return this.id;
  }
  
  /**
   * Get the current scene
   */
  getCurrentScene(): Scene {
    return this.world.getCurrentScene();
  }
  
  /**
   * Get all characters in the play
   */
  getCharacters(): Character[] {
    return this.world.getCharacters();
  }
  
  /**
   * Get all props in the play
   */
  getProps(): Prop[] {
    return this.world.getProps();
  }
} 