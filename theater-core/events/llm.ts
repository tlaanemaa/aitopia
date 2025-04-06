import { z } from "zod";
import {
    ThoughtSchema,
    ActionSchema,
    EmotionSchema,
    MovementDestinationSchema,
    SceneDescriptionSchema,
    SpeechSchema,
    CharacterCreateSchema,
    GenericWorldEventDescriptionSchema,
    CharacterRemoveSchema,
    CharacterEvent,
    Position,
    DirectorEvent,
} from "./types";
import type { EntityRegistry } from "../service/EntityRegistry";

/**
 * LLM facing event schema for a character
 */
export function characterEventSchema() {
    return z.object({
        speech: SpeechSchema.optional().describe('What you want to say'),
        thought: ThoughtSchema.optional().describe('What you are thinking about'),
        action: ActionSchema.optional().describe('What you want to do'),
        emotion: EmotionSchema.optional().describe('What you are feeling'),
        movement: MovementDestinationSchema.optional().describe('Where you want to move to'),
    });
}

/**
 * Transform a character event from LLM to an enriched events
 */
export function transformCharacterEvent(
    name: string,
    position: Position,
    event: z.infer<ReturnType<typeof characterEventSchema>>
): CharacterEvent[] {
    const events: CharacterEvent[] = [];

    if (event.speech) {
        events.push({
            type: 'speech',
            name,
            position,
            data: event.speech,
        });
    }

    if (event.thought) {
        events.push({
            type: 'thought',
            name,
            position,
            data: event.thought,
        });
    }

    if (event.action) {
        events.push({
            type: 'action',
            name,
            position,
            data: event.action,
        });
    }

    if (event.emotion) {
        events.push({
            type: 'emotion',
            name,
            position,
            data: event.emotion,
        });
    }

    if (event.movement) {
        events.push({
            type: 'movement',
            name,
            position,
            data: event.movement,
        });
    }

    return events;
}

/**
 * LLM facing event schema for the director
 */
export function directorEventSchema(
    avatars: [string, ...string[]],
    characterNames: string[]
) {
    return characterNames.length === 0
        ? directorEventSchemaWithoutNames(avatars)
        : directorEventSchemaWithNames(avatars, characterNames as [string, ...string[]]);
}

function directorEventSchemaWithNames(
    avatars: [string, ...string[]],
    characterNames: [string, ...string[]]
) {
    const CharacterEnterSchemaWithAvatars = CharacterCreateSchema.extend({
        avatar: z.enum(avatars).describe('Avatar of the character entering the scene')
    });

    const CharacterExitSchemaWithNames = CharacterRemoveSchema.extend({
        name: z.enum(characterNames as [string, ...string[]]).describe('Name of the character leaving the scene')
    });

    const CharacterEventSchemaWithNames = z.record(
        z.enum(characterNames as [string, ...string[]]), characterEventSchema()
    );

    return z.object({
        sceneChange: SceneDescriptionSchema.optional().describe('What you want to change the scene to'),
        genericEvent: GenericWorldEventDescriptionSchema.optional().describe('What you want to do'),
        newCharacters: z.array(CharacterEnterSchemaWithAvatars).optional().describe('New characters to add into the play'),
        charactersToRemove: z.array(CharacterExitSchemaWithNames).optional().describe('Characters to remove from the play'),
        characterEvents: CharacterEventSchemaWithNames.optional().describe('Events for each character'),
    });
}

function directorEventSchemaWithoutNames(
    avatars: [string, ...string[]],
) {
    const CharacterEnterSchemaWithAvatars = CharacterCreateSchema.extend({
        avatar: z.enum(avatars).describe('Avatar of the character entering the scene')
    });

    return z.object({
        sceneChange: SceneDescriptionSchema.optional().describe('What you want to change the scene to'),
        genericEvent: GenericWorldEventDescriptionSchema.optional().describe('What you want to do'),
        newCharacters: z.array(CharacterEnterSchemaWithAvatars).optional().describe('New characters to add into the play'),
    });
}

/**
 * Transform a director event from LLM to enriched events
 */
export function transformDirectorEvent(
    event: z.infer<ReturnType<typeof directorEventSchemaWithNames>>,
    entityRegistry: EntityRegistry
): DirectorEvent[] {
    const events: DirectorEvent[] = [];

    if (event.sceneChange) {
        events.push({
            type: 'scene_change',
            data: event.sceneChange,
        });
    }

    if (event.genericEvent) {
        events.push({
            type: 'generic',
            data: event.genericEvent,
        });
    }

    if (event.newCharacters) {
        event.newCharacters.forEach(character => {
            events.push({
                type: 'character_enter',
                data: character,
            });
        });
    }

    if (event.charactersToRemove) {
        event.charactersToRemove.forEach(character => {
            events.push({
                type: 'character_exit',
                data: character,
            });
        });
    }

    if (event.characterEvents) {
        Object.entries(event.characterEvents).forEach(([name, characterEvent]) => {
            const [character] = entityRegistry.getCharactersByName(name);
            if (!character) return;
            events.push(
                ...transformCharacterEvent(name, character.position, characterEvent)
            )
        });
    }

    return events;
}