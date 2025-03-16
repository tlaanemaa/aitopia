/**
 * Action types for the theater-core domain
 */
import { Emotion, Position } from './common';

/**
 * Base action interface
 */
export interface Action {
  actionId: string;
  timestamp: number;
}

/**
 * Character action interface
 */
export interface CharacterAction extends Action {
  characterId: string;
  speech?: string;       // What the character says out loud
  thought?: string;      // What the character thinks privately
  emotion?: Emotion;     // The character's emotional state
  movement?: Position;   // Where the character moves to
  interactionTarget?: string; // ID of character or object being interacted with
  interactionType?: string;   // Type of interaction
}

/**
 * Playwright action interface
 */
export interface PlaywrightAction extends Action {
  narration?: string;   // Narration to the audience
  sceneChange?: {
    newSceneId: string;
    description: string;
  };
  newProps?: {
    propType: string;
    position: Position;
    description: string;
  }[];
  newCharacters?: {
    name: string;
    traits: string[];
    position: Position;
    initialEmotion: Emotion;
    description: string;
  }[];
  suggestedNextCharacterId?: string; // Which character should act next
}

/**
 * Response from LLM for character actions
 */
export interface CharacterActionResponse {
  speech?: string;
  thought?: string;
  action?: string;
  emotion?: string;
  movement?: {
    x: number;
    y: number;
  };
}

/**
 * Response from LLM for playwright actions
 */
export interface PlaywrightActionResponse {
  narration?: string;
  sceneChange?: string;
  newProps?: string;
  newCharacters?: string;
  nextFocus?: string;
} 