/**
 * Character - Represents a character in the theatrical world
 */
import { v4 as uuidv4 } from 'uuid';
import { 
  Position, 
  Emotion, 
  CharacterArchetype,
  Thought,
  Speech
} from '../types/common';
import { Perception, PerceptionConfig } from './Perception';
import { CharacterAction } from '../types/actions';
import { getCurrentTime } from '../utils/time';
import { EntityRegistry } from './EntityRegistry';

/**
 * Character metadata
 */
export interface CharacterData {
  id?: string;              // Unique identifier
  name: string;             // Character name
  traits: string[];         // Personality traits
  archetype?: CharacterArchetype; // Character archetype
  backstory?: string;       // Brief backstory
  appearance?: string;      // Visual description
  avatarUrl?: string;       // Avatar image URL
  goal?: string;            // Primary goal/motivation
  initialEmotion?: Emotion; // Starting emotional state
  initialPosition?: Position; // Starting position on stage
}

/**
 * Character class - Represents a character in the theatrical world
 */
export class Character {
  // Identity
  readonly id: string;
  name: string;
  traits: string[];
  archetype?: CharacterArchetype;
  backstory: string;
  appearance: string;
  avatarUrl: string;
  goal: string;
  
  // State
  position: Position;
  currentEmotion: Emotion;
  isOnStage: boolean;
  lastActionTimestamp: number;
  
  // Subjective perception of the world
  readonly perception: Perception;
  
  /**
   * Create a new character
   */
  constructor(data: CharacterData, registry: EntityRegistry) {
    // Set identity properties
    this.id = data.id || uuidv4();
    this.name = data.name;
    this.traits = [...data.traits];
    this.archetype = data.archetype;
    this.backstory = data.backstory || '';
    this.appearance = data.appearance || '';
    this.avatarUrl = data.avatarUrl || '';
    this.goal = data.goal || '';
    
    // Set initial state
    this.position = data.initialPosition || { x: 50, y: 50 };
    this.currentEmotion = data.initialEmotion || Emotion.NEUTRAL;
    this.isOnStage = true;
    this.lastActionTimestamp = getCurrentTime();
    
    // Create perception system
    const perceptionConfig: PerceptionConfig = {
      // Characters with different traits could have different perception capabilities
      // e.g., a character with "observant" trait might have better sight
      sightRange: this.hasTraitLike('observant') ? 70 : 50,
      hearingRange: this.hasTraitLike('attentive') ? 50 : 30,
      memoryCapacity: this.hasTraitLike('forgetful') ? 30 : 50,
      memoryDuration: this.hasTraitLike('forgetful') ? 15 * 60 * 1000 : 30 * 60 * 1000,
      attentionThreshold: this.hasTraitLike('distractible') ? 3 : 1
    };
    
    this.perception = new Perception(registry, perceptionConfig, this.position);
  }
  
  /**
   * Check if the character has a trait similar to the given one
   */
  hasTraitLike(traitToCheck: string): boolean {
    const traitLower = traitToCheck.toLowerCase();
    return this.traits.some(trait => 
      trait.toLowerCase().includes(traitLower) ||
      traitLower.includes(trait.toLowerCase())
    );
  }
  
  /**
   * Update the character's position
   */
  move(newPosition: Position): void {
    this.position = { ...newPosition };
    this.perception.updatePosition(newPosition);
    this.lastActionTimestamp = getCurrentTime();
  }
  
  /**
   * Update the character's emotional state
   */
  setEmotion(emotion: Emotion): void {
    this.currentEmotion = emotion;
    this.lastActionTimestamp = getCurrentTime();
  }
  
  /**
   * Record a thought by this character
   */
  think(content: string, emotion: Emotion = this.currentEmotion): void {
    const thought: Thought = {
      content,
      timestamp: getCurrentTime(),
      emotion
    };
    
    this.perception.addThought(thought);
    this.lastActionTimestamp = getCurrentTime();
  }
  
  /**
   * Generate speech by this character (others may or may not hear it)
   */
  speak(content: string, volume: number = 1.0): Speech {
    const speech: Speech = {
      speakerId: this.id,
      speakerName: this.name,
      content,
      timestamp: getCurrentTime(),
      volume
    };
    
    this.lastActionTimestamp = getCurrentTime();
    return speech;
  }
  
  /**
   * Enter the stage
   */
  enterStage(position: Position): void {
    this.position = { ...position };
    this.perception.updatePosition(position);
    this.isOnStage = true;
    this.lastActionTimestamp = getCurrentTime();
  }
  
  /**
   * Exit the stage
   */
  exitStage(): void {
    this.isOnStage = false;
    this.lastActionTimestamp = getCurrentTime();
  }
  
  /**
   * Check if this character perceives another character
   */
  canPerceive(otherCharacter: Character): boolean {
    // Characters can't perceive themselves this way
    if (otherCharacter.id === this.id) return false;
    
    // Characters can only perceive others who are on stage
    if (!otherCharacter.isOnStage) return false;
    
    // Use the perception system to determine visibility
    return this.distanceTo(otherCharacter) <= this.perception.getSightRange();
  }
  
  /**
   * Check if this character can hear another character
   */
  canHear(otherCharacter: Character, volume: number = 1.0): boolean {
    // Characters can't hear themselves this way
    if (otherCharacter.id === this.id) return false;
    
    // Characters can only hear others who are on stage
    if (!otherCharacter.isOnStage) return false;
    
    // Use the perception system to determine audibility
    return this.distanceTo(otherCharacter) <= this.perception.getHearingRange() * volume;
  }
  
  /**
   * Calculate distance to another character
   */
  distanceTo(otherCharacter: Character): number {
    const dx = this.position.x - otherCharacter.position.x;
    const dy = this.position.y - otherCharacter.position.y;
    return Math.sqrt(dx * dx + dy * dy);
  }
  
  /**
   * Process a character action from the LLM
   */
  processAction(action: CharacterAction): void {
    // Update position if movement is specified
    if (action.movement) {
      this.move(action.movement);
    }
    
    // Update emotion if specified
    if (action.emotion) {
      this.setEmotion(action.emotion);
    }
    
    // Record thought if specified
    if (action.thought) {
      this.think(action.thought, action.emotion);
    }
    
    // Update action timestamp
    this.lastActionTimestamp = getCurrentTime();
  }
  
  /**
   * Generate a summary of this character for the LLM
   */
  generateSummaryForLLM(): string {
    const traitsList = this.traits.join(', ');
    const archetypeText = this.archetype ? ` (${this.archetype})` : '';
    const goalText = this.goal ? ` Their goal is ${this.goal}.` : '';
    const backstoryText = this.backstory ? ` ${this.backstory}` : '';
    
    return `${this.name}${archetypeText}: ${traitsList}.${goalText}${backstoryText} Currently feeling ${this.currentEmotion}.`;
  }
  
  /**
   * Generate character context for LLM prompt
   */
  generateContextForLLM(): {
    identity: string;
    perceptions: {
      recentObservations: string[];
      knownCharacters: string[];
      recentDialogue: string[];
      recentThoughts: string[];
    }
  } {
    const identity = `
      NAME: ${this.name}
      TRAITS: ${this.traits.join(', ')}
      ${this.archetype ? `ARCHETYPE: ${this.archetype}` : ''}
      ${this.goal ? `GOAL: ${this.goal}` : ''}
      CURRENT EMOTION: ${this.currentEmotion}
      ${this.backstory ? `BACKSTORY: ${this.backstory}` : ''}
    `.trim();
    
    return {
      identity,
      perceptions: this.perception.formatForLLM()
    };
  }
} 