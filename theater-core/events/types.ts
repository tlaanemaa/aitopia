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

// ================ Character Events ================

/**
 * Character event data
 */
export const CharacterEventSchema = z.object({
  destination: PositionSchema.optional().describe('The destination the character is moving to'),
  action: z.string()
    .optional()
    .describe("A detailed narration of the action in third person. Always include the character's name, along with the direction and target when relevant."),
  speech: z.string().optional().describe('The actual words being spoken'),
  emotion: EmotionSchema.optional().describe('The emotion being expressed'),
  thought: z.string().optional().describe('The thought content')
}).describe('All possible character event types');

export type CharacterEvent = z.infer<typeof CharacterEventSchema>;
export type EnrichedCharacterEvent = CharacterEvent & {
  type: 'character_event';
  name: string; // We add name programmatically to all character produced events
  position: Position; // We add position programmatically to all character produced events
};

// ================ Director Events ================

/**
 * Character enter event data
 */
const CharacterEnterEventSchema = z.object({
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
const CharacterExitEventSchema = z.object({
  name: z.string().describe('Name of the character leaving the scene'),
  description: z.string().optional().describe('Optional description of how the character leaves')
}).describe('Use this if you want to remove a character from the world');

/**
 * Director event data
 */
const DirectorEventSchema = z.object({
  newSceneDescription: z.string().optional().describe('Description of the new scene'),
  genericWorldEvent: z.string().optional().describe('A generic world event, anything that does not fit into the other categories'),
  newCharacters: z.record(
    z.string().describe('Name of the character entering the scene'),
    CharacterEnterEventSchema
  ).optional().describe('New characters to enter the scene'),
  charactersToRemove: z.record(
    z.string().describe('Name of the character leaving the scene'),
    CharacterExitEventSchema
  ).optional().describe('Characters to remove from the scene'),
  characterEvents: z.record(
    z.string().describe('Name of the character performing the action'),
    CharacterEventSchema
  ).optional().describe('Events to emit to characters')
}).describe('All possible director event types');

export type DirectorEvent = z.infer<typeof DirectorEventSchema>;
export type EnrichedDirectorEvent = Omit<DirectorEvent, 'characterEvents'> & {
  type: 'director_event';
};

/**
 * Builds a runtime version of the director event schema with the given avatars
 */
export function buildRuntimeDirectorEventSchema(
  avatars: [string, ...string[]],
  characterNames: string[],
): z.ZodType<DirectorEvent> {
  // Bake the known character avatars into the schema
  const CharacterEnterWithAvatar = CharacterEnterEventSchema.extend({
    avatar: z.enum(avatars).describe('Avatar of the character entering the scene')
  });

  // Only allow exits if there are characters in the scene
  const CharacterExitRecord = characterNames.length > 0
    ? z.record(
      z.enum(characterNames as [string, ...string[]]).describe('Name of the character leaving the scene'),
      CharacterExitEventSchema
    )
    : z.never();

  // Only allow events if there are characters in the scene
  const TargetedCharacterEvents = characterNames.length > 0
    ? z.record(
      z.enum(characterNames as [string, ...string[]]).describe('Name of the character performing the action'),
      CharacterEventSchema
    )
    : z.never();

  return DirectorEventSchema.extend({
    newCharacters: z.record(
      z.string().describe('Name of the character entering the scene'),
      CharacterEnterWithAvatar
    ).optional().describe('New characters to enter the scene'),
    charactersToRemove: CharacterExitRecord.optional().describe('Characters to remove from the scene'),
    characterEvents: TargetedCharacterEvents.optional().describe('Events to emit to characters')
  })
}

// ================ Event Types ================
export type Event = CharacterEvent | DirectorEvent;
export type EnrichedEvent = EnrichedCharacterEvent | EnrichedDirectorEvent;