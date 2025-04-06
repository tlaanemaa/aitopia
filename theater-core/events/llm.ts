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
        say: SpeechSchema.optional().describe('What you are saying'),
        think: ThoughtSchema.optional().describe('What you are thinking about'),
        performAction: ActionSchema.optional().describe('Third person narration of what you did.'),
        feelEmotion: EmotionSchema.optional().describe('What you are feeling'),
        moveTo: MovementDestinationSchema.optional().describe('Where you are moving to'),
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

    if (event.say) {
        events.push({
            type: 'speech',
            name,
            position,
            data: event.say,
        });
    }

    if (event.think) {
        events.push({
            type: 'thought',
            name,
            position,
            data: event.think,
        });
    }

    if (event.performAction) {
        events.push({
            type: 'action',
            name,
            position,
            data: event.performAction,
        });
    }

    if (event.feelEmotion) {
        events.push({
            type: 'emotion',
            name,
            position,
            data: event.feelEmotion,
        });
    }

    if (event.moveTo) {
        events.push({
            type: 'movement',
            name,
            position,
            data: event.moveTo,
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
        avatar: z.enum(avatars).describe('Avatar image of the character entering the play')
    });

    const CharacterExitSchemaWithNames = CharacterRemoveSchema.extend({
        name: z.enum(characterNames as [string, ...string[]]).describe('Name of the character leaving the play')
    });

    const CharacterEventSchemaWithNames = characterEventSchema().extend({
        name: z.enum(characterNames as [string, ...string[]]).describe('Name of the character')
    });

    return z.object({
        sceneChange: SceneDescriptionSchema.optional().describe('A very concise description of the scene you want to change to'),
        genericEvent: GenericWorldEventDescriptionSchema.optional().describe('A very concise description of what you want to do'),
        newCharacters: z.array(CharacterEnterSchemaWithAvatars).optional().describe('New characters to add into the play'),
        charactersToRemove: z.array(CharacterExitSchemaWithNames).optional().describe('Characters to remove from the play'),
        characterEvents: z.array(CharacterEventSchemaWithNames).optional().describe('Events for each character'),
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
        event.characterEvents.forEach(characterEvent => {
            const [character] = entityRegistry.getCharactersByName(characterEvent.name);
            if (!character) return;
            events.push(
                ...transformCharacterEvent(characterEvent.name, character.position, characterEvent)
            )
        });
    }

    return events;
}