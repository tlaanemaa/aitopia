import { ChatPromptTemplate } from '@langchain/core/prompts';
import { EnrichedEvent, buildDirectorEventSchemas } from '../types/events';
import { Entity } from './Entity';
import { z } from 'zod';

const SYSTEM_PROMPT = `
You are the director of a play.
You are responsible for guiding the story so that it is engaging and interesting.
You can introduce new characters, change the setting, or even change the rules of the play.
The characters in the play have a mind of their own, but you can influence them by guiding the story.
`;

const TASK_PROMPT = `
This is the current scene description:
{scene}

This is the current state of the play:
{state}

What do you want to do next? Keep it engaging and interesting!
`;

const promptTemplate = ChatPromptTemplate.fromMessages([
  ["system", SYSTEM_PROMPT.trim()],
  ["user", TASK_PROMPT.trim()],
]);

/**
 * Director class - Can produce both character and world events
 */
export class Director extends Entity {
  public readonly name = 'Director';
  protected memorySize = 100;

  /**
   * Builds the response format for the director
   * We add a new field to all character events to specify the target character name.
   * Then we union the character events with the world events.
   */
  private buildResponseFormat() {
    const currentCharacters = this.entityRegistry.getCharacterNames();
    const directorEventSchemas = buildDirectorEventSchemas(currentCharacters, this.assetRegistry.getAvatars());
    return z.array(directorEventSchemas).describe('Array of events describing what you want to do next to influence the story.');
  }

  /**
 * Take a turn
 */
  public async takeTurn(): Promise<EnrichedEvent[]> {
    const prompt = await promptTemplate.invoke({
      state: this.memory.getMemories(),
      scene: this.memory.scene,
    });
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

  /**
   * Handle events happening in the world
   */
  public handleEvent(event: EnrichedEvent): void {
    if ("sourceId" in event) {
      const subject = this.entityRegistry.getEntity(event.sourceId);
      if (!subject) return;
      switch (event.type) {
        case 'action':
          this.memory.add(`${subject.name} performed action: ${event.action}`);
          break;
        case 'speech':
          this.memory.add(`${subject.name} said: ${event.content}`);
          break;
        case 'emotion':
          this.memory.add(`${subject.name} felt: ${event.emotion}`);
          break;
        case 'movement':
          this.memory.add(`${subject.name} moved to ${event.position}`);
          break;
        case 'thought':
          this.memory.add(`${subject.name} thought: ${event.content}`);
          break;
      }
    } else {
      switch (event.type) {
        case 'scene_change':
          this.memory.add(`The scene changed to ${event.newSceneDescription}`);
          this.memory.setScene(event.newSceneDescription);
          break;
        case 'character_enter':
          this.memory.add(`${event.name} entered the scene`);
          break;
        case 'character_exit':
          const character = this.entityRegistry.getEntity(event.characterId);
          if (!character) return;
          this.memory.add(`${character.name} exited the scene`);
          break;
        case 'generic':
          this.memory.add(`${event.description}`);
          break;
      }
    }
  }

  public getLog(): string {
    return this.memory.getMemories();
  }
} 