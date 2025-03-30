/**
 * LLM facing event types for the theater-core domain
 */
import { z } from 'zod';

// ================ Core Types ================
/**
 * Position in 2D space
 */
const PositionSchema = z.object({
  x: z
    .number()
    .describe('Horizontal position in the world. Between 0 and 100, where 0 is the left edge and 100 is the right edge.'),
  y: z
    .number()
    .describe('Vertical position in the world. Between 0 and 100, where 0 is the top edge and 100 is the bottom edge.')
});

export type Position = z.infer<typeof PositionSchema>;

/**
 * Emotions
 */
const EmotionSchema = z.enum(['neutral', 'happy', 'sad', 'angry']).describe('The emotion being expressed');
export type Emotion = z.infer<typeof EmotionSchema>;

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

/**
 * Movement event data
 */
const MovementEventSchema = BaseEventSchema.extend({
  type: z.enum(['movement']),
  destination: PositionSchema.describe('The destination the character is moving to')
}).describe('Use this to if you want to move');

// ================ Character Actions ================
/**
 * Action event data
 */
const ActionEventSchema = BaseEventSchema.extend({
  type: z.enum(['action']),
  action: z.string()
    .describe('Detailed past tense description of the action being performed, including the direction and target when relevant.')
}).describe('Use this if you want to describe an action');

/**
 * Speech event data
 */
const SpeechEventSchema = BaseEventSchema.extend({
  type: z.enum(['speech']),
  content: z.string().describe('The actual words being spoken'),
  targetName: z.string().optional().describe('Name of the character being spoken to')
}).describe('Use this if you want to say something');

/**
 * Emotion event data
 */
const EmotionEventSchema = BaseEventSchema.extend({
  type: z.enum(['emotion']),
  emotion: EmotionSchema.describe('The emotion being expressed'),
}).describe('Use this if you want to express an emotion');

/**
 * Thought event data
 */
const ThoughtEventSchema = BaseEventSchema.extend({
  type: z.enum(['thought']),
  content: z.string().describe('The thought content')
}).describe('Use this if you want to think');

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
  type: z.enum(['scene_change']),
  newSceneDescription: z.string().describe('Concise description of the new scene')
}).describe("Use this if you want to change the scene, don't do it too often.");

/**
 * Character enter event data
 */
const CharacterEnterEventSchema = BaseEventSchema.extend({
  type: z.enum(['character_enter']),
  name: z.string().describe('Name of the character entering the scene'),
  avatar: z.string().describe('Avatar of the character entering the scene'),
  position: PositionSchema.describe('Position where the character enters'),
  traits: TraitSchema.array().describe('Traits of the character entering the scene'),
  emotion: EmotionSchema.describe('Emotion of the character entering the scene'),
  backstory: z.string().optional().describe('Backstory of the character entering the scene'),
  description: z.string().optional().describe('Optional description of how the character enters')
}).describe('Use this if you want to add a new character to the world');

export type CharacterEnterEvent = z.infer<typeof CharacterEnterEventSchema>;

/**
 * Character exit event data
 */
const CharacterExitEventSchema = BaseEventSchema.extend({
  type: z.enum(['character_exit']),
  characterId: z.string().describe('ID of the character leaving the scene'),
  description: z.string().optional().describe('Optional description of how the character leaves')
}).describe('Use this if you want to remove a character from the world');

/**
 * Generic world event data
 */
const GenericWorldEventSchema = BaseEventSchema.extend({
  type: z.enum(['generic']),
  description: z.string().describe('Description of the world event')
}).describe('Use this if you want to describe a generic world event');

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
    // SceneChangeEventSchema, // The AI is abusing this
    CharacterEnterEventSchema.extend({ avatar: z.enum(avatars).describe('Avatar of the character entering the scene') }),
    // CharacterExitEventSchema, // FIXME: Only allow exit when there characters
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
  return z.union([
    ...characterEvents.options,
    ...worldEvents.options,
  ]);
}

// ================ Enriched Events ================
/**
 * Enriched event type
 */
export type EnrichedEvent = EnrichedCharacterEvent | WorldEvent;
