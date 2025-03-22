/**
 * Theater Core
 * Domain model for an interactive theatrical storytelling system
 * 
 * This module exposes only the minimal interface needed for integration.
 * Internal implementation details are hidden to simplify the conceptual model.
 */

// Main entry point
export { Play } from './models/Play';
export type { EnrichedEvent, CharacterEnterEvent } from './types/events';
export type { Position } from './types/events';
export type { AiConfig } from './types/common';