/**
 * Common type definitions for the theater-core domain
 */

/**
 * Represents a 2D position on the stage
 */
export interface Position {
  x: number;
  y: number;
}

/**
 * Available emotion states for characters
 */
export enum Emotion {
  HAPPY = 'happy',
  SAD = 'sad',
  ANGRY = 'angry',
  AFRAID = 'afraid',
  SURPRISED = 'surprised',
  DISGUSTED = 'disgusted',
  CURIOUS = 'curious',
  CONFUSED = 'confused',
  EXCITED = 'excited',
  WORRIED = 'worried',
  AMUSED = 'amused',
  DETERMINED = 'determined',
  PROUD = 'proud',
  ASHAMED = 'ashamed',
  CALM = 'calm',
  NEUTRAL = 'neutral',
  THOUGHTFUL = 'thoughtful',
  CONTENT = 'content',
  REFLECTIVE = 'reflective',
  SHOCKED = 'shocked'
}

/**
 * Available character archetypes
 */
export enum CharacterArchetype {
  HERO = 'hero',
  TRICKSTER = 'trickster',
  SAGE = 'sage',
  EXPLORER = 'explorer',
  CAREGIVER = 'caregiver',
  CREATOR = 'creator',
  REBEL = 'rebel',
  INNOCENT = 'innocent',
  RULER = 'ruler',
  JESTER = 'jester',
}

/**
 * Story/narrative phases
 */
export enum NarrativePhase {
  EXPOSITION = 'exposition',
  RISING_ACTION = 'rising_action',
  CLIMAX = 'climax',
  FALLING_ACTION = 'falling_action',
  RESOLUTION = 'resolution',
}

/**
 * Types of relationships between characters
 */
export enum RelationshipType {
  FRIEND = 'friend',
  ENEMY = 'enemy',
  ROMANTIC = 'romantic',
  FAMILY = 'family',
  RIVAL = 'rival',
  MENTOR = 'mentor',
  ACQUAINTANCE = 'acquaintance',
  STRANGER = 'stranger',
}

/**
 * A character's perception of another character
 */
export interface CharacterPerception {
  characterId: string;
  characterName: string;
  lastSeen: number;          // Timestamp
  lastKnownPosition?: Position;
  knownTraits: string[];
  relationshipType: RelationshipType;
  relationshipIntensity: number; // 0-100
  lastInteraction?: string;
}

/**
 * A character's perception of an object
 */
export interface ObjectPerception {
  objectId: string;
  objectType: string;
  lastSeen: number;
  lastKnownState: string;
  lastKnownPosition: Position;
}

/**
 * A thought by a character
 */
export interface Thought {
  content: string;
  timestamp: number;
  emotion: Emotion;
}

/**
 * Spoken dialogue
 */
export interface Speech {
  speakerId: string;
  speakerName: string;
  content: string;
  timestamp: number;
  volume: number; // 0-1, affects how far it can be heard
}

/**
 * An event observed by a character
 */
export interface ObservedEvent {
  description: string;
  timestamp: number;
  significance: number; // 0-10, how important this is to the character
  location?: Position;
  involvedCharacterIds: string[];
  involvedObjectIds: string[];
}

/**
 * A plot thread in the story
 */
export interface PlotThread {
  id: string;
  title: string;
  description: string;
  characterIds: string[];
  goal: string;
  status: 'active' | 'resolved';
  progress: number;
  createdAt: number;
  resolution?: string;
  resolvedAt?: number;
}

/**
 * Obstacles in the scene that can block movement or sight
 */
export interface Obstacle {
  position: Position;
  size: { width: number; height: number };
  description: string;
  blocksSight: boolean;
  blocksMovement: boolean;
}

/**
 * User's input/direction to influence the story
 */
export interface UserDirection {
  content: string;
  timestamp: number;
  targetCharacterIds?: string[]; // If directed at specific characters
} 