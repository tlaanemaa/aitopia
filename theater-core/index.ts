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
export type { PlayEvent, CharacterCreate } from './events/types';
export type { Position } from './events/types';
export type { AiConfig } from './models/Ai';
export type PlayState = ReturnType<typeof Play.prototype.getState>;
export type CharacterState = PlayState["characters"][number];
