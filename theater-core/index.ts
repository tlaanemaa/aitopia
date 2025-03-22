/**
 * Theater Core
 * Domain model for an interactive theatrical storytelling system
 * 
 * This module exposes only the minimal interface needed for integration.
 * Internal implementation details are hidden to simplify the conceptual model.
 */

// Main entry point
export { Play } from './models/Play';
export type { PlayConfig, CharacterConfig } from './models/Play';

// Core models (exposed for type information)
export { Director } from './models/Director';
export { Character } from './models/Character';
export { Entity } from './models/Entity';

// Core types
export type { Position, Emotion } from './types/common';
export type {
    Event,
    CharacterEvent,
    WorldEvent,
    CharacterEventType,
    WorldEventType
} from './types/events';

// Utilities
export { calculateDistance, isInRange } from './utils/spatial'; 