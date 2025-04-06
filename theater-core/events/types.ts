/**
 * Core types and schemas for the theater-core domain
 */
import { z } from 'zod';

// ================ Core Types ================

const PositionSchema = z.object({
  x: z
    .number()
    .describe('Horizontal position in the world. Between 0 and 100, where 0 is the left edge and 100 is the right edge.'),
  y: z
    .number()
    .describe('Vertical position in the world. Between 0 and 100, where 0 is the top edge and 100 is the bottom edge.')
});

const TraitSchema = z.enum(['perceptive', 'oblivious', 'empath', 'stoic', 'aware', 'unaware'])
  .describe('Traits of a character');

export const MovementDestinationSchema = PositionSchema
  .describe('The destination the character is moving to')

export const ActionSchema = z.string()
  .describe("A detailed narration of the action in third person. Always include the character's name, along with the direction and target when relevant.")

export const SpeechSchema = z.string()
  .describe('The actual words being spoken')

export const EmotionSchema = z.enum(['neutral', 'happy', 'sad', 'angry'])
  .describe('The emotion being expressed');

export const ThoughtSchema = z.string()
  .describe('The thought content')

export const SceneDescriptionSchema = z.string()
  .describe('A concise description of the new scene')

export const GenericWorldEventDescriptionSchema = z.string()
  .describe('A concise description of the world event')

export const CharacterCreateSchema = z.object({
  name: z.string().describe('Name of the character entering the scene'),
  avatar: z.string().describe('Avatar of the character entering the scene'),
  position: PositionSchema.describe('Position where the character enters'),
  traits: TraitSchema.array().describe('Traits of the character entering the scene'),
  emotion: EmotionSchema.describe('Emotion of the character entering the scene'),
  backstory: z.string().optional().describe('Backstory of the character entering the scene'),
}).describe('Use this to create a new character');

export const CharacterRemoveSchema = z.object({
  name: z.string().describe('Name of the character leaving the scene'),
}).describe('Use this to remove a character from the scene');

/**
 * Base event type
 */
const BaseEventSchema = z.object({
  type: z.string().describe('Type of the event'),
});

// ================ Character Events ================

const BaseCharacterEventSchema = BaseEventSchema.extend({
  name: z.string().describe('Name of the character performing the action'),
  position: PositionSchema.describe('Position at the time of the event')
})

const MovementEventSchema = BaseCharacterEventSchema.extend({
  type: z.literal('movement'),
  data: MovementDestinationSchema
}).describe('Use this to if you want to move');

const ActionEventSchema = BaseCharacterEventSchema.extend({
  type: z.literal('action'),
  data: ActionSchema
}).describe('Use this if you want to describe an action');

const SpeechEventSchema = BaseCharacterEventSchema.extend({
  type: z.literal('speech'),
  data: SpeechSchema,
});

const EmotionEventSchema = BaseCharacterEventSchema.extend({
  type: z.literal('emotion'),
  data: EmotionSchema,
});

const ThoughtEventSchema = BaseCharacterEventSchema.extend({
  type: z.literal('thought'),
  data: ThoughtSchema
});

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

// ================ Director Events ================
/**
 * Scene change event data
 */
const SceneChangeEventSchema = BaseEventSchema.extend({
  type: z.literal('scene_change'),
  data: SceneDescriptionSchema
}).describe("Use this if you want to change the scene, don't do it too often.");

/**
 * Generic world event data
 */
const GenericWorldEventSchema = BaseEventSchema.extend({
  type: z.literal('generic'),
  data: GenericWorldEventDescriptionSchema
}).describe('Use this if you want to describe a generic world event');

/**
 * Character enter event data
 */
const CharacterEnterEventSchema = BaseEventSchema.extend({
  type: z.literal('character_enter'),
  data: CharacterCreateSchema
}).describe('Use this if you want to add a new character to the world');

/**
 * Character exit event data
 */
const CharacterExitEventSchema = BaseEventSchema.extend({
  type: z.literal('character_exit'),
  data: CharacterRemoveSchema
}).describe('Use this if you want to remove a character from the world');

/**
 * World event data as a union of all possible event types
 */
export const DirectorEventSchema = z.union([
  SceneChangeEventSchema,
  GenericWorldEventSchema,
  CharacterEnterEventSchema,
  CharacterExitEventSchema,
  CharacterEventSchema
]).describe('Union of all possible world event types')

// ================ Types ================

export type Position = z.infer<typeof PositionSchema>;
export type Trait = z.infer<typeof TraitSchema>;
export type Emotion = z.infer<typeof EmotionSchema>;
export type CharacterCreate = z.infer<typeof CharacterCreateSchema>;
export type CharacterRemove = z.infer<typeof CharacterRemoveSchema>;
export type CharacterEvent = z.infer<typeof CharacterEventSchema>;
export type DirectorEvent = z.infer<typeof DirectorEventSchema>;
export type PlayEvent = CharacterEvent | DirectorEvent;
