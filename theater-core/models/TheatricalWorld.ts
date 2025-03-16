/**
 * TheatricalWorld - Coordinates all the theatrical elements
 */
import { v4 as uuidv4 } from 'uuid';
import { Character } from './Character';
import { Scene } from './Scene';
import { Prop } from './Prop';
import { Director } from './Director';
import { CharacterAction, PlaywrightAction } from '../types/actions';
import { WorldEvent } from '../types/events';
import { calculateDistance } from '../utils/spatial';
import { getCurrentTime } from '../utils/time';
import { EntityRegistry } from './EntityRegistry';

/**
 * TheatricalWorld initialization options
 */
export interface TheatricalWorldOptions {
  registry?: EntityRegistry;
  initialScene?: Scene;
  initialCharacters?: Character[];
  initialProps?: Prop[];
  director?: Director;
}

/**
 * TheatricalWorld class - Coordinates the theatrical experience
 */
export class TheatricalWorld {
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
   * Create a new theatrical world
   */
  constructor(options: TheatricalWorldOptions = {}) {
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
  
  /**
   * Create a default scene
   */
  private createDefaultScene(): Scene {
    return new Scene({
      name: 'Default Scene',
      description: 'A simple empty stage.'
    });
  }
  
  /**
   * Add a character to the world
   */
  addCharacter(character: Character): void {
    // Register character in the registry
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
  removeCharacter(characterId: string): boolean {
    const character = this.registry.getCharacter(characterId);
    
    if (!character) {
      return false;
    }
    
    // Log exit event
    const event: WorldEvent = {
      id: uuidv4(),
      type: 'exit',
      description: `${character.name} exits the scene.`,
      timestamp: getCurrentTime(),
      location: character.position,
      isGlobal: true,
      involvedCharacterIds: [characterId],
      involvedObjectIds: []
    };
    
    this.logEvent(event);
    this.propagateEvent(event);
    
    // Remove from director's character rotation
    this.director.removeCharacterFromRotation(characterId);
    
    // Remove from registry
    this.registry.unregisterCharacter(characterId);
    
    return true;
  }
  
  /**
   * Add a prop to the world
   */
  addProp(prop: Prop): void {
    // Register prop in the registry
    this.registry.registerProp(prop);
    
    // Log prop addition event
    const event: WorldEvent = {
      id: uuidv4(),
      type: 'prop_introduction',
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
   * Remove a prop from the world
   */
  removeProp(propId: string): boolean {
    const prop = this.registry.getProp(propId);
    
    if (!prop) {
      return false;
    }
    
    // Log prop removal event
    const event: WorldEvent = {
      id: uuidv4(),
      type: 'prop_removal',
      description: `The ${prop.type} disappears from the scene.`,
      timestamp: getCurrentTime(),
      location: prop.position,
      isGlobal: true,
      involvedCharacterIds: [],
      involvedObjectIds: [propId]
    };
    
    this.logEvent(event);
    this.propagateEvent(event);
    
    // Remove from registry
    this.registry.unregisterProp(propId);
    
    return true;
  }
  
  /**
   * Change the current scene
   */
  changeScene(newScene: Scene): void {
    // Store the old scene for reference
    const oldScene = this.getScene();
    
    // Register the new scene
    this.registry.registerScene(newScene);
    
    // Update the current scene ID
    this.currentSceneId = newScene.id;
    
    // Create scene change event
    const event: WorldEvent = {
      id: uuidv4(),
      type: 'scene_change',
      description: `The scene changes from ${oldScene.name} to ${newScene.name}.`,
      timestamp: getCurrentTime(),
      location: { x: 50, y: 50 }, // Center of scene
      isGlobal: true,
      involvedCharacterIds: [],
      involvedObjectIds: []
    };
    
    // Log and propagate the event
    this.logEvent(event);
    this.propagateEvent(event);
    
    // Reposition characters if needed
    this.registry.getAllCharacters().forEach(character => {
      // If character's position is invalid in new scene, move them to a valid position
      if (!newScene.isPositionValid(character.position, this.config.characterRadius)) {
        const newPosition = newScene.getEntrancePosition();
        character.move(newPosition);
      }
    });
    
    // Reposition props if needed
    this.registry.getAllProps().forEach(prop => {
      // If prop's position is invalid in new scene, move it to a valid position
      if (!newScene.isPositionValid(prop.position)) {
        const newPosition = newScene.getRandomPosition();
        prop.move(newPosition);
      }
    });
  }
  
  /**
   * Process a character action
   */
  processCharacterAction(characterId: string, action: CharacterAction): WorldEvent[] {
    const character = this.registry.getCharacter(characterId);
    
    if (!character) {
      throw new Error(`Character ${characterId} not found`);
    }
    
    const events: WorldEvent[] = [];
    
    // Process movement
    if (action.movement) {
      // Ensure the position is valid in the scene
      const safePosition = this.getScene().findSafePosition(action.movement, this.config.characterRadius);
      
      // Create movement event
      const movementEvent: WorldEvent = {
        id: uuidv4(),
        type: 'movement',
        description: `${character.name} moves from (${character.position.x.toFixed(1)},${character.position.y.toFixed(1)}) to (${safePosition.x.toFixed(1)},${safePosition.y.toFixed(1)}).`,
        timestamp: getCurrentTime(),
        location: safePosition,
        isGlobal: false,
        involvedCharacterIds: [characterId],
        involvedObjectIds: []
      };
      
      // Move the character
      character.move(safePosition);
      
      // Log and add event
      this.logEvent(movementEvent);
      events.push(movementEvent);
    }
    
    // Process emotion change
    if (action.emotion) {
      // Create emotion event
      const emotionEvent: WorldEvent = {
        id: uuidv4(),
        type: 'emotional',
        description: `${character.name} feels ${action.emotion}.`,
        timestamp: getCurrentTime(),
        location: character.position,
        isGlobal: false,
        involvedCharacterIds: [characterId],
        involvedObjectIds: []
      };
      
      // Update character emotion
      character.setEmotion(action.emotion);
      
      // Log and add event
      this.logEvent(emotionEvent);
      events.push(emotionEvent);
    }
    
    // Process speech
    if (action.speech) {
      // Create speech event
      const speechEvent: WorldEvent = {
        id: uuidv4(),
        type: 'speech',
        description: `${character.name} says: "${action.speech}"`,
        timestamp: getCurrentTime(),
        location: character.position,
        isGlobal: false,
        involvedCharacterIds: [characterId],
        involvedObjectIds: []
      };
      
      // Generate speech
      character.speak(action.speech);
      
      // Log and add event
      this.logEvent(speechEvent);
      events.push(speechEvent);
    }
    
    // Process thought
    if (action.thought) {
      // Thoughts are only known to the character themselves
      character.think(action.thought, action.emotion);
    }
    
    // Process interaction
    if (action.interactionTarget && action.interactionType) {
      // Check if target is a character
      const targetCharacter = this.registry.getCharacter(action.interactionTarget);
      
      if (targetCharacter) {
        // Create character interaction event
        const interactionEvent: WorldEvent = {
          id: uuidv4(),
          type: 'interaction',
          description: `${character.name} ${action.interactionType} ${targetCharacter.name}.`,
          timestamp: getCurrentTime(),
          location: character.position,
          isGlobal: false,
          involvedCharacterIds: [characterId, action.interactionTarget],
          involvedObjectIds: []
        };
        
        // Log and add event
        this.logEvent(interactionEvent);
        events.push(interactionEvent);
      } else {
        // Check if target is a prop
        const targetProp = this.registry.getProp(action.interactionTarget);
        
        if (targetProp) {
          // Create prop interaction event
          const interactionEvent: WorldEvent = {
            id: uuidv4(),
            type: 'interaction',
            description: `${character.name} ${action.interactionType} the ${targetProp.type}.`,
            timestamp: getCurrentTime(),
            location: character.position,
            isGlobal: false,
            involvedCharacterIds: [characterId],
            involvedObjectIds: [action.interactionTarget]
          };
          
          // Log and add event
          this.logEvent(interactionEvent);
          events.push(interactionEvent);
        }
      }
    }
    
    // Propagate events to all characters
    events.forEach(event => this.propagateEvent(event));
    
    return events;
  }
  
  /**
   * Process a playwright action
   */
  processPlaywrightAction(action: PlaywrightAction): {
    events: WorldEvent[];
    newCharacters: Character[];
    newProps: Prop[];
    nextCharacterId?: string;
  } {
    // Let the playwright process the action
    const result = this.director.processAction(action);
    
    // Update the world with results
    
    // Handle new characters
    result.newCharacters.forEach(character => {
      this.addCharacter(character);
    });
    
    // Handle new props
    result.newProps.forEach(prop => {
      this.addProp(prop);
    });
    
    // Handle scene change
    if (result.newScene) {
      this.changeScene(result.newScene);
    }
    
    // Log events
    result.worldEvents.forEach(event => {
      this.logEvent(event);
      this.propagateEvent(event);
    });
    
    return {
      events: result.worldEvents,
      newCharacters: result.newCharacters,
      newProps: result.newProps,
      nextCharacterId: result.nextCharacterId
    };
  }
  
  /**
   * Log a user input
   */
  logUserInput(content: string): void {
    const input = {
      content,
      timestamp: getCurrentTime()
    };
    
    this.userInputHistory.push(input);
    
    // Trim history if it gets too large
    if (this.userInputHistory.length > this.config.maxUserInputHistorySize) {
      this.userInputHistory.shift();
    }
  }
  
  /**
   * Log a world event
   */
  private logEvent(event: WorldEvent): void {
    this.eventLog.push(event);
    
    // Trim event log if it gets too large
    if (this.eventLog.length > this.config.maxEventLogSize) {
      this.eventLog.shift();
    }
  }
  
  /**
   * Propagate an event to all characters who can perceive it
   */
  private propagateEvent(event: WorldEvent): void {
    this.registry.getAllCharacters().forEach(character => {
      // Skip if character is involved in the event (they already know about it)
      if (event.involvedCharacterIds.includes(character.id)) {
        return;
      }
      
      // Let the character's perception system handle the event
      character.perception.perceiveEvent(event);
    });
  }
  
  /**
   * Get all characters in the world
   */
  getCharacters(): Character[] {
    return this.registry.getAllCharacters();
  }
  
  /**
   * Get a specific character
   */
  getCharacter(characterId: string): Character | undefined {
    return this.registry.getCharacter(characterId);
  }
  
  /**
   * Get all props in the world
   */
  getProps(): Prop[] {
    return this.registry.getAllProps();
  }
  
  /**
   * Get a specific prop
   */
  getProp(propId: string): Prop | undefined {
    return this.registry.getProp(propId);
  }
  
  /**
   * Get the current scene
   */
  getScene(): Scene {
    const scene = this.registry.getScene(this.currentSceneId);
    if (!scene) {
      throw new Error(`Current scene with ID ${this.currentSceneId} not found in registry`);
    }
    return scene;
  }
  
  /**
   * Alias for getScene() to maintain backward compatibility
   */
  getCurrentScene(): Scene {
    return this.getScene();
  }
  
  /**
   * Get the director
   */
  getDirector(): Director {
    return this.director;
  }
  
  /**
   * Get the entity registry
   */
  getRegistry(): EntityRegistry {
    return this.registry;
  }
  
  /**
   * Get recent events
   */
  getRecentEvents(count: number = 10): WorldEvent[] {
    return this.eventLog
      .slice(-count)
      .sort((a, b) => a.timestamp - b.timestamp);
  }
  
  /**
   * Get recent user inputs
   */
  getRecentUserInputs(count: number = 5): { content: string; timestamp: number }[] {
    return this.userInputHistory
      .slice(-count)
      .sort((a, b) => a.timestamp - b.timestamp);
  }
  
  /**
   * Check if a character can perceive another character
   */
  canCharacterPerceiveCharacter(observerId: string, targetId: string): boolean {
    const observer = this.registry.getCharacter(observerId);
    const target = this.registry.getCharacter(targetId);
    
    if (!observer || !target) {
      return false;
    }
    
    return observer.canPerceive(target);
  }
  
  /**
   * Check if a character can hear another character
   */
  canCharacterHearCharacter(listenerId: string, speakerId: string, volume: number = 1.0): boolean {
    const listener = this.registry.getCharacter(listenerId);
    const speaker = this.registry.getCharacter(speakerId);
    
    if (!listener || !speaker) {
      return false;
    }
    
    return listener.canHear(speaker, volume);
  }
  
  /**
   * Get the characters that are visible to a specific character
   */
  getVisibleCharactersFor(characterId: string): Character[] {
    const character = this.registry.getCharacter(characterId);
    
    if (!character) {
      return [];
    }
    
    return this.registry.getAllCharacters()
      .filter(other => character.canPerceive(other));
  }
  
  /**
   * Get the props that are visible to a specific character
   */
  getVisiblePropsFor(characterId: string): Prop[] {
    const character = this.registry.getCharacter(characterId);
    
    if (!character) {
      return [];
    }
    
    return this.registry.getAllProps()
      .filter(prop => {
        const distance = calculateDistance(character.position, prop.position);
        return distance <= character.perception.getSightRange();
      });
  }
  
  /**
   * Get the next character in the rotation
   */
  getNextCharacter(): Character | undefined {
    const nextCharacterId = this.director.getNextCharacterId();
    
    if (!nextCharacterId) {
      return undefined;
    }
    
    return this.registry.getCharacter(nextCharacterId);
  }
  
  /**
   * Generate a context object for the LLM prompt
   */
  generateLLMContext(characterId?: string, userInput?: string): {
    scene: string;
    characters: string[];
    focusCharacter?: string;
    recentEvents: string[];
    userInput?: string;
  } {
    // Generate scene description
    const sceneDescription = this.getScene().generateDescriptionForLLM();
    
    // Generate character summaries
    const characterSummaries = this.getCharacters().map(c => 
      c.generateSummaryForLLM()
    );
    
    // Generate focus character context if provided
    let focusCharacterContext: string | undefined = undefined;
    
    if (characterId) {
      const character = this.registry.getCharacter(characterId);
      
      if (character) {
        const context = character.generateContextForLLM();
        focusCharacterContext = `
          ${context.identity}
          
          OBSERVATIONS:
          ${context.perceptions.recentObservations.join('\n')}
          
          KNOWN CHARACTERS:
          ${context.perceptions.knownCharacters.join('\n')}
          
          HEARD DIALOGUE:
          ${context.perceptions.recentDialogue.join('\n')}
          
          THOUGHTS:
          ${context.perceptions.recentThoughts.join('\n')}
        `.trim();
      }
    }
    
    // Get recent events
    const recentEvents = this.getRecentEvents(10).map(e => 
      `[${new Date(e.timestamp).toLocaleTimeString()}] ${e.description}`
    );
    
    return {
      scene: sceneDescription,
      characters: characterSummaries,
      focusCharacter: focusCharacterContext,
      recentEvents,
      userInput
    };
  }
} 