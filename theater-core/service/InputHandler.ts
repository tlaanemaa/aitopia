import { ChatPromptTemplate } from "@langchain/core/prompts";
import { buildDirectorEventSchemas, EnrichedEvent } from "../types/events";
import { Ai } from "../models/Ai";
import { EntityRegistry } from "./EntityRegistry";
import { z } from "zod";
import { AssetRegistry } from "./AssetRegistry";

const SYSTEM_PROMPT = `
Your task is to take the user's input and convert it into a list of events that will change the story.
`;

const TASK_PROMPT = `
This is the user input:
{input}

Please convert the user input into a list of events that will change the story.
`;

const promptTemplate = ChatPromptTemplate.fromMessages([
    ["system", SYSTEM_PROMPT.trim()],
    ["user", TASK_PROMPT.trim()],
]);

export class InputHandler {
    private readonly ai = new Ai();

    constructor(
        private readonly entityRegistry: EntityRegistry,
        private readonly assetRegistry: AssetRegistry
    ) { }

    /**
   * Builds the response format for the director
   * We add a new field to all character events to specify the target character name.
   * Then we union the character events with the world events.
   */
    private buildResponseFormat() {
        const currentCharacters = this.entityRegistry.getCharacterNames();
        const directorEventSchemas = buildDirectorEventSchemas(currentCharacters, this.assetRegistry.getAvatars());
        return z.array(directorEventSchemas).describe('Array of events describing changes to the story.');
    }

    public async handleInput(input: string[]): Promise<EnrichedEvent[]> {
        const prompt = await promptTemplate.invoke({ input: input.map(i => `- ${i}`).join('\n') });
        const response = await this.ai.call(prompt, this.buildResponseFormat());
        // Map over the response and replace the names with ids and positions
        const enrichedEvents = response.map(event => {
            if ("subjectCharacterName" in event) {
                const character = this.entityRegistry.getCharactersByName(event.subjectCharacterName)[0];
                return {
                    ...event,
                    sourceId: character.id,
                    position: character.position
                }
            } else {
                return event;
            }
        });
        return enrichedEvents;
    }
}