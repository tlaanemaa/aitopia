/**
 * Event types for the theater-core domain
 */
import { Position } from './common';

/**
 * Base event interface
 */
export interface WorldEvent {
  id: string;
  type: string;  // Type of event (movement, speech, entrance, exit, etc.)
  description: string;
  timestamp: number;
  location: Position;
  isGlobal: boolean;  // Whether all characters can observe it regardless of position
  involvedCharacterIds: string[];
  involvedObjectIds: string[];
}

/**
 * Movement event when a character changes position
 */
export interface MovementEvent extends WorldEvent {
  type: 'movement';
  characterId: string;
  fromPosition: Position;
  toPosition: Position;
}

/**
 * Speech event when a character speaks
 */
export interface SpeechEvent extends WorldEvent {
  type: 'speech';
  characterId: string;
  content: string;
  volume: number; // 0-1, affects how far it can be heard
}

/**
 * Entrance event when a new character enters the scene
 */
export interface EntranceEvent extends WorldEvent {
  type: 'entrance';
  characterId: string;
  entrancePosition: Position;
}

/**
 * Exit event when a character leaves the scene
 */
export interface ExitEvent extends WorldEvent {
  type: 'exit';
  characterId: string;
  exitPosition: Position;
}

/**
 * Interaction event when a character interacts with an object
 */
export interface InteractionEvent extends WorldEvent {
  type: 'interaction';
  characterId: string;
  objectId: string;
  interactionType: string; // e.g., "pick_up", "sit_on", "open", etc.
}

/**
 * Scene change event
 */
export interface SceneChangeEvent extends WorldEvent {
  type: 'scene_change';
  previousSceneId?: string;
  newSceneId: string;
  transitionDescription: string;
}

/**
 * Emotional reaction event
 */
export interface EmotionalEvent extends WorldEvent {
  type: 'emotional';
  characterId: string;
  emotion: string;
  intensity: number; // 0-10
  trigger?: string;
}

/**
 * Event when a relationship changes between characters
 */
export interface RelationshipEvent extends WorldEvent {
  type: 'relationship';
  characterId1: string;
  characterId2: string;
  relationshipChange: 'improved' | 'worsened' | 'established' | 'broken';
  intensity: number; // 0-10
} 