/**
 * LLM facing event types for the theater-core domain
 */
import { z } from 'zod';

// ================ Core Types ================
/**
 * Position in 2D space
 */
const PositionSchema = z.object({
  x: z.number().describe('Horizontal position in the scene'),
  y: z.number().describe('Vertical position in the scene')
});

export type Position = z.infer<typeof PositionSchema>;

/**
 * Direction in 2D space
 */
const DirectionSchema = z.enum([
  'north',
  'south',
  'east',
  'west',
  'northeast',
  'northwest',
  'southeast',
  'southwest'
]).describe('Cardinal and intercardinal directions in the scene');

/**
 * Character traits
 */
const TraitSchema = z.enum([
  // Perception traits
  'perceptive',      // Better at noticing things (increases sight and hearing)
  'oblivious',       // Poor at noticing things (decreases sight and hearing)

  // Emotional traits
  'empath',          // Better at sensing emotions (increases emotion)
  'stoic',           // Poor at sensing emotions (decreases emotion)

  // Combined traits
  'aware',           // Good at all perception (increases all)
  'unaware'          // Poor at all perception (decreases all)
]).describe('Traits of a character');

export type Trait = z.infer<typeof TraitSchema>;

/**
 * Base event type
 */
const BaseEventSchema = z.object({
  type: z.string().describe('Type of the event'),
});

// ================ Movement System ================
/**
 * Types of movement a character can perform
 */
const MovementTypeSchema = z.enum([
  'walk',      // Normal walking speed
  'run',       // Fast movement
  'jump',      // Jump to a position
  'dash',      // Quick burst of speed
]).describe('Different types of movement a character can perform');

/**
 * Movement event data
 */
const MovementEventSchema = BaseEventSchema.extend({
  type: z.literal('movement'),
  movementType: MovementTypeSchema.describe('The type of movement being performed'),
  direction: DirectionSchema.describe('The direction the character is moving')
}).describe('Event to describe a character movement');

// ================ Character Actions ================
/**
 * Action event data
 */
const ActionEventSchema = BaseEventSchema.extend({
  type: z.literal('action'),
  action: z.string()
    .describe('Detailed past tense description of the action being performed, including the direction and target when relevant.')
}).describe('Event to describe a character action');

/**
 * Speech event data
 */
const SpeechEventSchema = BaseEventSchema.extend({
  type: z.literal('speech'),
  content: z.string().describe('The actual words being spoken'),
  targetName: z.string().optional().describe('Name of the character being spoken to')
}).describe('Event to describe a character speech');

/**
 * Emotion event data
 */
const EmotionEventSchema = BaseEventSchema.extend({
  type: z.literal('emotion'),
  emotion: z.string().describe('The emotion being expressed (e.g., "happy", "sad", "angry")'),
}).describe('Event to describe a character emotion');

/**
 * Thought event data
 */
const ThoughtEventSchema = BaseEventSchema.extend({
  type: z.literal('thought'),
  content: z.string().describe('The thought content')
}).describe('Event to describe a character thought');

/**
 * Character event data as a union of all possible event types
 */
export const CharacterEventSchema = z.union([
  ActionEventSchema,
  SpeechEventSchema,
  EmotionEventSchema,
  MovementEventSchema,
  ThoughtEventSchema
]).describe('All possible character event types');

export type CharacterEvent = z.infer<typeof CharacterEventSchema>;
export type EnrichedCharacterEvent = CharacterEvent & {
  sourceId: string; // We add sourceId programmatically to all character produced events
  position: Position; // We add position programmatically to all character produced events
};

/**
 * Builds a union of all possible events that can be emitted to target a specific character
 * These will be emitted from someone else, but be treated as if they were emitted by the character
 */
function buildRuntimeCharacterEventSchemas(characterNames: [string, ...string[]]) {
  return z.union([
    ActionEventSchema.extend({ subjectCharacterName: z.enum(characterNames).describe('Name of the character performing the action') }),
    SpeechEventSchema.extend({ subjectCharacterName: z.enum(characterNames).describe('Name of the character speaking') }),
    EmotionEventSchema.extend({ subjectCharacterName: z.enum(characterNames).describe('Name of the character feeling the emotion') }),
    MovementEventSchema.extend({ subjectCharacterName: z.enum(characterNames).describe('Name of the character moving') }),
    ThoughtEventSchema.extend({ subjectCharacterName: z.enum(characterNames).describe('Name of the character thinking') })
  ]).describe('All possible targeted character event types');
}

// ================ World Events ================
/**
 * Scene change event data
 */
const SceneChangeEventSchema = BaseEventSchema.extend({
  type: z.literal('scene_change'),
  newSceneDescription: z.string().describe('Concise description of the new scene')
}).describe('Event to describe a scene change');

/**
 * Character enter event data
 */
const CharacterEnterEventSchema = BaseEventSchema.extend({
  type: z.literal('character_enter'),
  name: z.string().describe('Name of the character entering the scene'),
  avatar: z.string().describe('Avatar of the character entering the scene'),
  position: PositionSchema.describe('Position where the character enters'),
  traits: TraitSchema.array().describe('Traits of the character entering the scene'),
  emotion: z.string().describe('Emotion of the character entering the scene'),
  backstory: z.string().optional().describe('Backstory of the character entering the scene'),
  description: z.string().optional().describe('Optional description of how the character enters')
}).describe('Event to describe a character entering the scene');

export type CharacterEnterEvent = z.infer<typeof CharacterEnterEventSchema>;

/**
 * Character exit event data
 */
const CharacterExitEventSchema = BaseEventSchema.extend({
  type: z.literal('character_exit'),
  characterId: z.string().describe('ID of the character exiting the scene'),
  description: z.string().optional().describe('Optional description of how the character exits')
}).describe('Event to describe a character exiting the scene');

/**
 * Generic world event data
 */
const GenericWorldEventSchema = BaseEventSchema.extend({
  type: z.literal('generic'),
  description: z.string().describe('Description of the world event')
}).describe('Event to describe a generic world event');

/**
 * World event data as a union of all possible event types
 */
const WorldEventSchema = z.union([
  SceneChangeEventSchema,
  CharacterEnterEventSchema,
  CharacterExitEventSchema,
  GenericWorldEventSchema
]).describe('Union of all possible world event types')
export type WorldEvent = z.infer<typeof WorldEventSchema>;

/**
 * Builds a runtime version of the world event schema with the given avatars
 */
function buildRuntimeWorldEventSchema(avatars: [string, ...string[]]) {
  return z.union([
    SceneChangeEventSchema,
    CharacterEnterEventSchema.extend({ avatar: z.enum(avatars).describe('Avatar of the character entering the scene') }),
    CharacterExitEventSchema,
    GenericWorldEventSchema
  ])
}

// ================ Director Events ================
/**
 * Builds a union of all possible director event types with the runtime information
 */
export function buildDirectorEventSchemas(characterNames: string[], avatars: string[]) {
  const worldEvents = avatars.length > 0
    ? buildRuntimeWorldEventSchema(avatars as [string, ...string[]])
    : WorldEventSchema;

  if (characterNames.length < 1) return worldEvents;
  const characterEvents = buildRuntimeCharacterEventSchemas(characterNames as [string, ...string[]])
  return z.union([characterEvents, worldEvents])
}

// ================ Enriched Events ================
/**
 * Enriched event type
 */
export type EnrichedEvent = EnrichedCharacterEvent | WorldEvent;

