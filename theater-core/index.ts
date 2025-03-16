/**
 * Theater Core
 * Domain model for an interactive theatrical storytelling system
 * 
 * This module exposes only the minimal interface needed for integration.
 * Internal implementation details are hidden to simplify the conceptual model.
 */

// Main entry point - The Play class and related types
export { Play } from './models/Play';
export type {
  PlayConfig,
  PlayCharacterConfig,
  PlaySceneConfig,
  PlayPropConfig,
  PlayListener
} from './models/Play';

// Essential types for user configuration
export type { LLMConfig } from './services/LLMService';
export type { Position, Emotion, CharacterArchetype } from './types/common';
export type { WorldEvent } from './types/events';
export type { CharacterAction } from './types/actions';

// Also export Director (formerly Playwright)
export { Director } from './models/Director'; 