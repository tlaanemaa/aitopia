import { ChatPromptTemplate } from "@langchain/core/prompts";
import { EnrichedEvent, buildDirectorEventSchemas } from "../events/types";
import { Entity } from "./Entity";
import { z } from "zod";
import { ChatPromptValueInterface } from "@langchain/core/prompt_values";
import { positionToString } from "../utils/util";
import { EntityRegistry } from "../service/EntityRegistry";
import { AssetRegistry } from "../service/AssetRegistry";
import { Ai } from "./Ai";

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
   * Builds the response format for the director
   * We add a new field to all character events to specify the target character name.
   * Then we union the character events with the world events.
   */
  private buildResponseFormat() {
    const currentCharacters = this.entityRegistry.getCharacterNames();
    const directorEventSchemas = buildDirectorEventSchemas(
      currentCharacters,
      this.assetRegistry.getAvatars()
    );
    return z
      .array(directorEventSchemas)
      .describe(
        "Array of events describing what you want to do next to influence the story."
      );
  }

  private async getEvents(prompt: ChatPromptValueInterface) {
    const response = await this.ai.call(prompt, this.buildResponseFormat());
    // Map over the response and replace the names with ids and positions
    const enrichedEvents = response.map((event) => {
      if ("subjectCharacterName" in event) {
        const character = this.entityRegistry.getCharactersByName(
          event.subjectCharacterName
        )[0];
        return {
          ...event,
          sourceId: character.id,
          position: character.position,
        };
      } else {
        return event;
      }
    });
    return enrichedEvents;
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
    return this.getEvents(prompt);
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
    return this.getEvents(prompt);
  }

  /**
   * Handle events happening in the world
   */
  public handleEvent(event: EnrichedEvent): void {
    if ("sourceId" in event) {
      const subject = this.entityRegistry.getEntity(event.sourceId);
      if (!subject) return;
      switch (event.type) {
        case "action":
          this.memory.add(event.action);
          break;
        case "speech":
          this.memory.add(`${subject.name} said: ${event.content}`);
          break;
        case "emotion":
          this.memory.add(`${subject.name} felt: ${event.emotion}`);
          break;
        case "movement":
          this.memory.add(
            `${subject.name} moved to position ${positionToString(
              event.position
            )}`
          );
          break;
        case "thought":
          this.memory.add(`${subject.name} thought: ${event.content}`);
          break;
      }
    } else {
      switch (event.type) {
        case "scene_change":
          this.memory.add(`The scene changed to ${event.newSceneDescription}`);
          this.memory.setScene(event.newSceneDescription);
          break;
        case "character_enter":
          this.memory.add(`${event.name} entered the scene at ${positionToString(event.position)}`);
          break;
        case "character_exit":
          const character = this.entityRegistry.getEntity(event.characterId);
          if (!character) return;
          this.memory.add(`${character.name} exited the scene`);
          break;
        case "generic":
          this.memory.add(`${event.description}`);
          break;
      }
    }
  }

  public getLog() {
    return this.memory.getMemoriesArray();
  }
}
