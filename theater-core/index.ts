/**
 * Theater Core
 * Domain model for an interactive theatrical storytelling system
 */

// Models
export * from './models/Character';
export * from './models/Perception';
export * from './models/Scene';
export * from './models/Prop';
export * from './models/Playwright';
export * from './models/TheatricalWorld';
export * from './models/StoryOrchestrator';
export * from './models/EntityRegistry';

// Types
export * from './types/common';
export * from './types/events';
export * from './types/actions';

// Utils
export * from './utils/spatial';
export * from './utils/time';

// Re-export services (to be added later)
// export * from './services/LLMService'; 