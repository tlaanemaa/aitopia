/**
 * Theater Core
 * Domain model for an interactive theatrical storytelling system
 * 
 * This module exposes only the minimal interface needed for integration.
 * Internal implementation details are hidden to simplify the conceptual model.
 */

import { Play } from './models/Play';

// Main entry point
export { Play };

// Types
export type { EnrichedEvent, CharacterEnterEvent } from './types/events';
export type { Position } from './types/events';
export type { AiConfig } from './models/Ai';
export type PlayState = ReturnType<typeof Play.prototype.getState>;
export type CharacterState = PlayState["characters"][number];
