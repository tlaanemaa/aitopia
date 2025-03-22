/**
 * LLM facing event types for the theater-core domain
 */
import { z } from 'zod';

// ================ Core Types ================
/**
 * Position in 2D space
 */
export const PositionSchema = z.object({
  x: z.number().describe('Horizontal position in the scene'),
  y: z.number().describe('Vertical position in the scene')
});

/**
 * Direction in 2D space
 */
export const DirectionSchema = z.enum([
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
export const TraitSchema = z.enum([
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

/**
 * Base event type
 */
export const BaseEventSchema = z.object({
  type: z.string().describe('Type of the event'),
});

// ================ Movement System ================
/**
 * Types of movement a character can perform
 */
export const MovementTypeSchema = z.enum([
  'walk',      // Normal walking speed
  'run',       // Fast movement
  'jump',      // Jump to a position
  'dash',      // Quick burst of speed
]).describe('Different types of movement a character can perform');

/**
 * Movement event data
 */
export const MovementEventSchema = BaseEventSchema.extend({
  type: z.literal('movement'),
  movementType: MovementTypeSchema.describe('The type of movement being performed'),
  direction: DirectionSchema.describe('The direction the character is moving')
}).describe('Event to describe a character movement');

// ================ Character Actions ================
/**
 * Action event data
 */
export const ActionEventSchema = BaseEventSchema.extend({
  type: z.literal('action'),
  action: z.string()
    .describe('Detailed past tense description of the action being performed, including the direction and target when relevant.')
}).describe('Event to describe a character action');

/**
 * Speech event data
 */
export const SpeechEventSchema = BaseEventSchema.extend({
  type: z.literal('speech'),
  content: z.string().describe('The actual words being spoken'),
  targetName: z.string().optional().describe('Name of the character being spoken to')
}).describe('Event to describe a character speech');

/**
 * Emotion event data
 */
export const EmotionEventSchema = BaseEventSchema.extend({
  type: z.literal('emotion'),
  emotion: z.string().describe('The emotion being expressed (e.g., "happy", "sad", "angry")'),
}).describe('Event to describe a character emotion');

/**
 * Thought event data
 */
export const ThoughtEventSchema = BaseEventSchema.extend({
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
]).describe('Union of all possible character event types');

// ================ World Events ================
/**
 * Scene change event data
 */
export const SceneChangeEventSchema = BaseEventSchema.extend({
  type: z.literal('scene_change'),
  newSceneDescription: z.string().describe('Description of the new scene')
}).describe('Event to describe a scene change');

/**
 * Character enter event data
 * TODO: This needs more character data to actually set the character up properly.
 */
export const CharacterEnterEventSchema = BaseEventSchema.extend({
  type: z.literal('character_enter'),
  name: z.string().describe('Name of the character entering the scene'),
  position: PositionSchema.describe('Position where the character enters'),
  backstory: z.string().optional().describe('Backstory of the character entering the scene'),
  traits: TraitSchema.array().describe('Traits of the character entering the scene'),
  description: z.string().optional().describe('Optional description of how the character enters')
}).describe('Event to describe a character entering the scene');

/**
 * Character exit event data
 */
export const CharacterExitEventSchema = BaseEventSchema.extend({
  type: z.literal('character_exit'),
  characterId: z.string().describe('ID of the character exiting the scene'),
  description: z.string().optional().describe('Optional description of how the character exits')
}).describe('Event to describe a character exiting the scene');

/**
 * Generic world event data
 */
export const GenericWorldEventSchema = BaseEventSchema.extend({
  type: z.literal('generic'),
  description: z.string().describe('Description of the world event')
}).describe('Event to describe a generic world event');

/**
 * World event data as a union of all possible event types
 */
export const WorldEventSchema = z.union([
  SceneChangeEventSchema,
  CharacterEnterEventSchema,
  CharacterExitEventSchema,
  GenericWorldEventSchema
]).describe('Union of all possible world event types');

// ================ Type Exports ================
export type Position = z.infer<typeof PositionSchema>;
export type Direction = z.infer<typeof DirectionSchema>;
export type MovementType = z.infer<typeof MovementTypeSchema>;
export type Trait = z.infer<typeof TraitSchema>;
export type BaseEvent = z.infer<typeof BaseEventSchema>;
export type CharacterEvent = z.infer<typeof CharacterEventSchema>;
export type WorldEvent = z.infer<typeof WorldEventSchema>;
export type CharacterEnterEvent = z.infer<typeof CharacterEnterEventSchema>;
export type CharacterExitEvent = z.infer<typeof CharacterExitEventSchema>;
export type GenericWorldEvent = z.infer<typeof GenericWorldEventSchema>;
export type AnyEvent = CharacterEvent | WorldEvent;

// ================ Internally enriched event types ================
export type EnrichedCharacterEvent = CharacterEvent & {
  sourceId: string;
  position: Position;
};

export type EnrichedEvent = EnrichedCharacterEvent | WorldEvent;

