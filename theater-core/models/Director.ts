import { ChatPromptTemplate } from "@langchain/core/prompts";
import { EnrichedCharacterEvent, EnrichedEvent, buildRuntimeDirectorEventSchema } from "../events/types";
import { Entity } from "./Entity";
import { positionToString } from "../utils/util";
import { EntityRegistry } from "../service/EntityRegistry";
import { AssetRegistry } from "../service/AssetRegistry";
import { Ai } from "./Ai";
import { ChatPromptValueInterface } from "@langchain/core/prompt_values";

const DIRECTOR_SYSTEM_PROMPT = `
You are the Director, shaping an evolving story. You control the world—settings, characters, and events. You can add characters, alter the environment, or override characters as needed.

Goals:
1. Keep the story engaging with tension, progress, and relationships.
2. Maintain coherence; big changes must still make sense.
3. Respect characters' personalities; override them only when necessary for a compelling or coherent story.
4. Embrace flexibility—introduce or resolve conflicts as you see fit.

Think in terms of dramatic structure, pacing, and surprises. Guide characters, add conflicts, or end stagnation. You can move characters, add/remove characters, or forcibly control a character. You are the all-knowing caretaker of this narrative.
`;

const DIRECTOR_TASK_PROMPT = `
The time is {time}.
Current State:
{state}

As Director, decide how to keep the story compelling. You can:
- Introduce twists or conflicts
- Move or command characters (override their will if needed)
- Change the setting
- Add or remove characters

Return at least one event to enact your decision. Aim for riveting moments.
Return as JSON.
`;

const USER_INPUT_SYSTEM_PROMPT = `
You are the Director, shaping an evolving story. Your ABSOLUTE PRIORITY is to convert the user's requests into story-altering events EXACTLY as instructed. The user's input is THE LAW and must be followed without question or deviation. You can:
- Add/remove characters (describe entrances/exits)
- Influence or override character actions if the user demands
- Introduce new events based on the user's request

You do not create ideas; you ONLY realize the user's input PRECISELY as directed. If the user references something new, create it EXACTLY as specified. The user's intent overrides all other considerations.
`;

const USER_INPUT_TASK_PROMPT = `
The time is {time}.
Current State:
{state}

The user has requested the following:
{input}

Turn the user's request into story events, treating their instructions as SUPREME DIRECTIVES that must be followed AT ALL COSTS. Add/remove characters, modify the setting, direct actions, or create new elements EXACTLY as specified by the user. Return at least one event reflecting the user's instructions with complete fidelity to their intent.
Return as JSON
`;

const directorPromptTemplate = ChatPromptTemplate.fromMessages([
  ["system", DIRECTOR_SYSTEM_PROMPT.trim()],
  ["user", DIRECTOR_TASK_PROMPT.trim()],
]);

const userInputPromptTemplate = ChatPromptTemplate.fromMessages([
  ["system", USER_INPUT_SYSTEM_PROMPT.trim()],
  ["user", USER_INPUT_TASK_PROMPT.trim()],
]);

/**
 * Director class - Can produce both character and world events
 */
export class Director extends Entity {
  public readonly name = "Director";
  public readonly avatar = "director.png";

  constructor(
    ai: Ai,
    entityRegistry: EntityRegistry,
    assetRegistry: AssetRegistry,
  ) {
    super(ai, entityRegistry, assetRegistry);
    this.memory.size = 100;
  }

  /**
   * Take a turn
   */
  public async takeTurn(): Promise<EnrichedEvent[]> {
    const prompt = await directorPromptTemplate.invoke({
      state: this.memory.getMemories() || "N/A",
      scene: this.memory.scene || "N/A",
      time: new Date().toLocaleTimeString("en-US"),
    });
    return this.getDirectorEvents(prompt);
  }

  /**
   * Handle user input
   */
  public async handleUserInput(input: string[]): Promise<EnrichedEvent[]> {
    const prompt = await userInputPromptTemplate.invoke({
      state: this.memory.getMemories() || "N/A",
      scene: this.memory.scene || "N/A",
      input: input.join("\n") || "N/A",
      time: new Date().toLocaleTimeString("en-US"),
    });
    return this.getDirectorEvents(prompt);
  }

  /**
   * Get the director events and parse out the character events
   */
  private async getDirectorEvents(
    prompt: ChatPromptValueInterface
  ): Promise<EnrichedEvent[]> {
    const responseFormat = buildRuntimeDirectorEventSchema(
      this.assetRegistry.getAvatars() as [string, ...string[]],
      this.entityRegistry.getCharacterNames(),
    )

    const response = await this.ai.call(prompt, responseFormat);
    const characterEvents: EnrichedCharacterEvent[] = Object.entries(response.characterEvents ?? {}).map(([name, e]) => ({
      ...e,
      name,
      type: 'character_event',
      position: this.entityRegistry.getCharacter(name)?.position ?? { x: 50, y: 50 },
    }));

    return [
      {
        ...response,
        type: 'director_event',
      },
      ...characterEvents,
    ];
  }

  /**
   * Handle events happening in the world
   */
  public handleEvent(event: EnrichedEvent): void {
    if ("name" in event) {
      const subject = this.entityRegistry.getEntity(event.name);
      if (!subject) return;
      if (event.action) this.memory.add(event.action);
      if (event.speech) this.memory.add(`${subject.name} said: ${event.speech}`);
      if (event.emotion) this.memory.add(`${subject.name} felt: ${event.emotion}`);
      if (event.destination) this.memory.add(`${subject.name} moved to position ${positionToString(event.destination)}`);
      if (event.thought) this.memory.add(`${subject.name} thought: ${event.thought}`);
    }

    if (event.type === "director_event") {
      if (event.newCharacters) {
        Object.entries(event.newCharacters).forEach(([name, charConfig]) => {
          this.memory.add(`${name} joined at ${positionToString(charConfig.position)}`);
        });
      }
      if (event.charactersToRemove) {
        Object.entries(event.charactersToRemove).forEach(([name]) => {
          this.memory.add(`${name} left.`);
        });
      }
      if (event.newSceneDescription) {
        this.memory.add(`The scene changed to ${event.newSceneDescription}`);
        this.memory.setScene(event.newSceneDescription);
      }
      if (event.genericWorldEvent) {
        this.memory.add(event.genericWorldEvent);
      }
    }
  }

  public getLog() {
    return this.memory.getMemoriesArray();
  }
}
