/**
 * WorldService - Coordinates all the elements in the world
 */
import { v4 as uuidv4 } from 'uuid';
import { Character } from '../models/Character';
import { Scene } from '../models/Scene';
import { Prop } from '../models/Prop';
import { Director } from '../models/Director';
import { CharacterAction, PlaywrightAction } from '../types/actions';
import { WorldEvent } from '../types/events';
import { calculateDistance } from '../utils/spatial';
import { getCurrentTime } from '../utils/time';
import { EntityRegistry } from '../models/EntityRegistry';

/**
 * WorldService initialization options
 */
export interface WorldServiceOptions {
  registry?: EntityRegistry;
  initialScene?: Scene;
  initialCharacters?: Character[];
  initialProps?: Prop[];
  director?: Director;
}

/**
 * WorldService class - Coordinates the world state and interactions
 */
export class WorldService {
  // Core components
  readonly id: string;
  readonly registry: EntityRegistry;
  private currentSceneId: string;
  private director: Director;
  
  // History
  private worldTime: number;
  private eventLog: WorldEvent[];
  private userInputHistory: { content: string; timestamp: number }[];
  
  // Configuration
  private config: {
    maxEventLogSize: number;
    maxUserInputHistorySize: number;
    baseSightRange: number;
    baseHearingRange: number;
    characterRadius: number;
  };
  
  /**
   * Create a new world service
   */
  constructor(options: WorldServiceOptions = {}) {
    // Set up registry
    this.id = uuidv4();
    this.registry = options.registry || new EntityRegistry();
    
    // Initialize other state
    this.worldTime = getCurrentTime();
    this.eventLog = [];
    this.userInputHistory = [];
    
    // Set configuration
    this.config = {
      maxEventLogSize: 1000,
      maxUserInputHistorySize: 50,
      baseSightRange: 50,
      baseHearingRange: 30,
      characterRadius: 1
    };
    
    // Create initial scene if not provided
    const initialScene = options.initialScene || this.createDefaultScene();
    this.registry.registerScene(initialScene);
    this.currentSceneId = initialScene.id;
    
    // Set up director
    this.director = options.director || new Director();
    
    // Add any initial characters
    if (options.initialCharacters) {
      for (const character of options.initialCharacters) {
        this.addCharacter(character);
      }
    }
    
    // Add any initial props
    if (options.initialProps) {
      for (const prop of options.initialProps) {
        this.addProp(prop);
      }
    }
  }

  // Continue with the rest of the methods...
  
  /**
   * Create a default scene
   */
  private createDefaultScene(): Scene {
    return new Scene({
      name: 'Default Scene',
      description: 'An empty stage with dim lighting.',
      mood: 'neutral',
      time: 'evening',
      width: 100,
      height: 100
    });
  }

  /**
   * Get the entity registry
   */
  getRegistry(): EntityRegistry {
    return this.registry;
  }

  /**
   * Get the current scene
   */
  getCurrentScene(): Scene {
    const scene = this.registry.getScene(this.currentSceneId);
    if (!scene) {
      throw new Error(`Scene with ID ${this.currentSceneId} not found`);
    }
    return scene;
  }

  /**
   * Get all characters
   */
  getCharacters(): Character[] {
    return this.registry.getAllCharacters();
  }

  /**
   * Get a specific character by ID
   */
  getCharacter(characterId: string): Character | undefined {
    return this.registry.getCharacter(characterId);
  }

  /**
   * Get all props
   */
  getProps(): Prop[] {
    return this.registry.getAllProps();
  }

  /**
   * Get a specific prop by ID
   */
  getProp(propId: string): Prop | undefined {
    return this.registry.getProp(propId);
  }

  /**
   * Get the director
   */
  getDirector(): Director {
    return this.director;
  }

  /**
   * Add a character to the world
   */
  addCharacter(character: Character): void {
    // Register with the entity registry
    this.registry.registerCharacter(character);
    
    // Add to director's character rotation
    this.director.characterRotation.push(character.id);
    
    // Log entrance event
    const event: WorldEvent = {
      id: uuidv4(),
      type: 'entrance',
      description: `${character.name} enters the scene.`,
      timestamp: getCurrentTime(),
      location: character.position,
      isGlobal: true,
      involvedCharacterIds: [character.id],
      involvedObjectIds: []
    };
    
    this.logEvent(event);
    this.propagateEvent(event);
  }

  /**
   * Remove a character from the world
   */
  removeCharacter(characterId: string): void {
    const character = this.registry.getCharacter(characterId);
    if (!character) return;
    
    // Log exit event
    const event: WorldEvent = {
      id: uuidv4(),
      type: 'exit',
      description: `${character.name} exits the scene.`,
      timestamp: getCurrentTime(),
      location: character.position,
      isGlobal: true,
      involvedCharacterIds: [character.id],
      involvedObjectIds: []
    };
    
    this.logEvent(event);
    this.propagateEvent(event);
    
    // Remove from director's character rotation
    this.director.removeCharacterFromRotation(characterId);
    
    // Remove from registry
    this.registry.unregisterCharacter(characterId);
  }

  /**
   * Add a prop to the world
   */
  addProp(prop: Prop): void {
    // Register with the entity registry
    this.registry.registerProp(prop);
    
    // Log prop addition event
    const event: WorldEvent = {
      id: uuidv4(),
      type: 'prop_add',
      description: `A ${prop.type} appears in the scene.`,
      timestamp: getCurrentTime(),
      location: prop.position,
      isGlobal: true,
      involvedCharacterIds: [],
      involvedObjectIds: [prop.id]
    };
    
    this.logEvent(event);
    this.propagateEvent(event);
  }

  /**
   * Process an action from a character
   */
  processCharacterAction(characterId: string, action: CharacterAction): WorldEvent[] {
    const character = this.registry.getCharacter(characterId);
    if (!character) {
      throw new Error(`Character with ID ${characterId} not found`);
    }
    
    const events: WorldEvent[] = [];
    
    // Process speech
    if (action.speech) {
      const speechEvent: WorldEvent = {
        id: uuidv4(),
        type: 'speech',
        description: `${character.name} says: "${action.speech}"`,
        timestamp: getCurrentTime(),
        location: character.position,
        isGlobal: false, // Speech can only be heard within range
        involvedCharacterIds: [character.id],
        involvedObjectIds: []
      };
      
      events.push(speechEvent);
    }
    
    // Process thought
    if (action.thought) {
      // Thoughts are internal and don't generate world events
      // But we could log them for debugging or narrative purposes
    }
    
    // Process emotion change
    if (action.emotion && action.emotion !== character.currentEmotion) {
      character.currentEmotion = action.emotion;
      
      const emotionEvent: WorldEvent = {
        id: uuidv4(),
        type: 'emotional',
        description: `${character.name} appears ${action.emotion.toLowerCase()}.`,
        timestamp: getCurrentTime(),
        location: character.position,
        isGlobal: false, // Emotions can only be seen within range
        involvedCharacterIds: [character.id],
        involvedObjectIds: []
      };
      
      events.push(emotionEvent);
    }
    
    // Process movement
    if (action.movement) {
      const previousPosition = { ...character.position };
      const targetPosition = action.movement;
      
      // Check if the movement is valid
      const scene = this.getCurrentScene();
      if (scene.isPositionValid(targetPosition, this.config.characterRadius)) {
        // Update the character's position
        character.position = targetPosition;
        
        const movementEvent: WorldEvent = {
          id: uuidv4(),
          type: 'movement',
          description: `${character.name} moves across the scene.`,
          timestamp: getCurrentTime(),
          location: targetPosition,
          isGlobal: false, // Movement can only be seen within range
          involvedCharacterIds: [character.id],
          involvedObjectIds: []
        };
        
        events.push(movementEvent);
      }
    }
    
    // Process interaction with objects or characters
    if (action.interactionTarget && action.interactionType) {
      // Check if the target is a character
      const targetCharacter = this.registry.getCharacter(action.interactionTarget);
      if (targetCharacter) {
        const interactionEvent: WorldEvent = {
          id: uuidv4(),
          type: 'interaction',
          description: `${character.name} ${action.interactionType} ${targetCharacter.name}.`,
          timestamp: getCurrentTime(),
          location: character.position,
          isGlobal: false, // Interactions can only be seen within range
          involvedCharacterIds: [character.id, targetCharacter.id],
          involvedObjectIds: []
        };
        
        events.push(interactionEvent);
      } 
      
      // Check if the target is a prop
      const targetProp = this.registry.getProp(action.interactionTarget);
      if (targetProp) {
        const interactionEvent: WorldEvent = {
          id: uuidv4(),
          type: 'interaction',
          description: `${character.name} ${action.interactionType} the ${targetProp.type}.`,
          timestamp: getCurrentTime(),
          location: character.position,
          isGlobal: false, // Interactions can only be seen within range
          involvedCharacterIds: [character.id],
          involvedObjectIds: [targetProp.id]
        };
        
        events.push(interactionEvent);
      }
    }
    
    // Log and propagate all the events
    for (const event of events) {
      this.logEvent(event);
      this.propagateEvent(event);
    }
    
    return events;
  }

  /**
   * Process an action from the director
   */
  processPlaywrightAction(action: PlaywrightAction): {
    worldEvents: WorldEvent[];
    newCharacters: Character[];
    newProps: Prop[];
    newScene?: Scene;
    nextCharacterId?: string;
  } {
    // Let the director process the action
    const result = this.director.processAction(action);
    
    // Process each new character
    result.newCharacters.forEach(character => {
      this.addCharacter(character);
    });
    
    // Process each new prop
    result.newProps.forEach(prop => {
      this.addProp(prop);
    });
    
    // Process new scene if provided
    if (result.newScene) {
      this.registry.registerScene(result.newScene);
      this.currentSceneId = result.newScene.id;
      
      // Log and propagate all events
      result.worldEvents.forEach(event => {
        this.logEvent(event);
        this.propagateEvent(event);
      });
    }
    
    return result;
  }

  /**
   * Log a user input
   */
  logUserInput(input: string): void {
    const userInput = {
      content: input,
      timestamp: getCurrentTime()
    };
    
    this.userInputHistory.push(userInput);
    
    // Trim history if needed
    if (this.userInputHistory.length > this.config.maxUserInputHistorySize) {
      this.userInputHistory = this.userInputHistory.slice(
        this.userInputHistory.length - this.config.maxUserInputHistorySize
      );
    }
  }

  /**
   * Log an event
   */
  private logEvent(event: WorldEvent): void {
    this.eventLog.push(event);
    
    // Trim event log if needed
    if (this.eventLog.length > this.config.maxEventLogSize) {
      this.eventLog = this.eventLog.slice(
        this.eventLog.length - this.config.maxEventLogSize
      );
    }
  }

  /**
   * Propagate an event to all characters
   */
  private propagateEvent(event: WorldEvent): void {
    const characters = this.registry.getAllCharacters();
    
    for (const character of characters) {
      // Skip if the character is not on stage
      if (!character.isOnStage) continue;
      
      // Global events are perceived by everyone
      if (event.isGlobal) {
        character.perception.perceiveEvent(event);
        continue;
      }
      
      // For non-global events, check if the character can perceive it
      const distance = calculateDistance(character.position, event.location);
      
      // Different event types have different perception ranges
      let perceptionRange = 0;
      
      if (event.type === 'speech') {
        perceptionRange = this.config.baseHearingRange;
      } else if (event.type === 'movement' || event.type === 'emotional' || event.type === 'interaction') {
        perceptionRange = this.config.baseSightRange;
      }
      
      // Check if character can perceive the event
      if (distance <= perceptionRange) {
        // Check for line of sight for visual events
        if (event.type === 'movement' || event.type === 'emotional' || event.type === 'interaction') {
          const scene = this.getCurrentScene();
          const hasLineOfSight = !scene.obstacles.some(obstacle => 
            obstacle.blocksSight && scene.isLineOfSightBlocked(
              character.position, 
              event.location, 
              obstacle
            )
          );
          
          if (hasLineOfSight) {
            character.perception.perceiveEvent(event);
          }
        } else {
          // Audio events don't require line of sight
          character.perception.perceiveEvent(event);
        }
      }
    }
  }

  /**
   * Get a character's next turn context for the LLM
   */
  generateLLMContext(characterId: string, userInput?: string): {
    scene: string;
    characters: string;
    props: string;
    recentEvents: string[];
    focusCharacter?: string;
  } {
    const character = this.registry.getCharacter(characterId);
    if (!character) {
      throw new Error(`Character with ID ${characterId} not found`);
    }
    
    const scene = this.getCurrentScene();
    const characterContext = character.generateContextForLLM();
    
    // Extract the relevant information from the character context
    const knownCharacters = characterContext.perceptions.knownCharacters.join('\n');
    const recentObservations = characterContext.perceptions.recentObservations;
    
    return {
      scene: `${scene.name}: ${scene.description} (${scene.mood}, ${scene.time})`,
      characters: knownCharacters,
      props: "No props known", // This would need to be implemented in the Character class
      recentEvents: recentObservations,
      focusCharacter: characterContext.identity
    };
  }

  /**
   * Get the next character in the turn rotation
   */
  getNextCharacter(): Character | undefined {
    const nextCharacterId = this.director.getNextCharacterId();
    
    if (!nextCharacterId) {
      return undefined;
    }
    
    return this.registry.getCharacter(nextCharacterId);
  }
} 