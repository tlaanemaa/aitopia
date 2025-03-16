/**
 * Theater Core
 * Domain model for an interactive theatrical storytelling system
 * 
 * This module exposes only the minimal interface needed for integration.
 * Internal implementation details are hidden to simplify the conceptual model.
 */

// Main entry point - The ExperienceFactory class and related types
export { ExperienceFactory } from './services/ExperienceFactory';

export type {
  ExperienceConfig,
  CharacterConfig,
  SceneConfig,
  PropConfig
} from './services/ExperienceFactory';

// Essential services
export { WorldService } from './services/WorldService';
export { StoryManager } from './services/StoryManager';
export { Orchestrator } from './services/Orchestrator';

// Essential types for user configuration
export type { LLMConfig } from './services/LLMService';
export type { Position, Emotion, CharacterArchetype } from './types/common';
export type { WorldEvent } from './types/events';
export type { CharacterAction } from './types/actions';
export type { ExperienceListener } from './services/Orchestrator';

// Core models
export { Director } from './models/Director';
export { Character } from './models/Character';
export { Scene } from './models/Scene';
export { Prop } from './models/Prop';
export { EntityRegistry } from './models/EntityRegistry'; 