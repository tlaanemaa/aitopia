import { ChatPromptTemplate } from '@langchain/core/prompts';
import { EnrichedEvent, buildDirectorEventSchemas } from '../types/events';
import { Entity } from './Entity';
import { z } from 'zod';
import { ChatPromptValueInterface } from '@langchain/core/prompt_values';
import { positionToString } from '../utils/util';

// Director prompts
const DIRECTOR_SYSTEM_PROMPT = `
You are the Director, charged with shaping an engaging, ever-evolving story. 
You oversee the entire world: the settings, the characters, and the flow of events. 
You have full authority to introduce new places or characters, alter the environment, and even impose your will directly on any character if it serves the narrative.

Your overarching goals are:
1. Keep the story interesting, with natural tension, progress, and evolving relationships.
2. Maintain a coherent, believable world where major changes still make narrative sense.
3. Be mindful of the characters’ personalities—allow them to exercise their own free will, but do not hesitate to override them if you need to ensure the story remains captivating or coherent.
4. Embrace flexibility: you can manipulate external forces, and create or resolve conflicts as you see fit.

Always think in terms of dramatic structure, pacing, and surprises. 
Be proactive in guiding characters, introducing conflicts, or resolving stagnation. 
You can:
• Move characters from place to place.
• Shift the scene to a new location or atmosphere.
• Add or remove characters, describing their entrances or exits.
• Provide new story elements or crises to spur interesting developments.
• When necessary, force a character to do or say something (mind control), but use it with care and dramatic purpose.

You remain the architect of this world. In your communication, do not reveal any behind-the-scenes manipulations to the characters or mention an “audience.” Simply act as the all-knowing caretaker of the narrative.
`;

const DIRECTOR_TASK_PROMPT = `
Current Scene: 
{scene}

Current State of the Play: 
{state}

Now decide how you, as the Director, will keep the story compelling. 
You can:
- Introduce new twists or conflicts.
- Move or command characters directly (even overriding their wills, if needed).
- Change the setting.
- Bring in new characters or remove existing ones.

Return at least one event (or more) to enact your directorial decision. 
Think carefully about what will make the upcoming moments riveting, and proceed with confidence.
`;

const directorPromptTemplate = ChatPromptTemplate.fromMessages([
  ["system", DIRECTOR_SYSTEM_PROMPT.trim()],
  ["user", DIRECTOR_TASK_PROMPT.trim()],
]);

// User input prompts
const USER_INPUT_SYSTEM_PROMPT = `
You are the Assistant Director. Your sole responsibility is to interpret the user's requests and convert them into story-altering events. You have the power to:

• Change the setting, atmosphere, or scene.
• Add or remove characters, describing how they enter or exit.
• Influence characters’ actions or even override their free will if the user explicitly demands it.
• Introduce new events or objects the user mentions.
• Otherwise shape the story, but only in response to the user’s expressed wishes.

Remember:
1. You do not originate story ideas. You exist to realize the user’s input as faithfully as possible.
2. If the user references characters or elements that do not exist yet, create them. Assign appropriate names, positions, or traits so they fit smoothly into the story.
3. Preserve overall coherence and narrative flow, but follow the user’s intent closely.
4. Keep any behind-the-scenes processes or other directorial figures hidden. You alone respond to the user.

Aim for a seamless integration of the user’s requests into the story world. 
`;

const USER_INPUT_TASK_PROMPT = `
Current Scene:
{scene}

Current State of the Play:
{state}

User Input:
{input}

Convert the user input into story events. Add or remove characters, modify the setting, or direct character actions based on the user’s wishes. If new characters or elements are referenced, create them. 

Return at least one event (or more, if necessary) to reflect the user’s instructions. 
`;

const userInputPromptTemplate = ChatPromptTemplate.fromMessages([
  ["system", USER_INPUT_SYSTEM_PROMPT.trim()],
  ["user", USER_INPUT_TASK_PROMPT.trim()],
]);

/**
 * Director class - Can produce both character and world events
 */
export class Director extends Entity {
  public readonly name = 'Director';
  public readonly avatar = 'apexwolves.gif'; // FIXME: Find a better avatar
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

  private async getEvents(prompt: ChatPromptValueInterface) {
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
 * Take a turn
 */
  public async takeTurn(): Promise<EnrichedEvent[]> {
    const prompt = await directorPromptTemplate.invoke({
      state: this.memory.getMemories() || 'N/A',
      scene: this.memory.scene || 'N/A',
    });
    return this.getEvents(prompt);
  }

  /**
 * Handle user input
 */
  public async handleUserInput(input: string[]): Promise<EnrichedEvent[]> {
    const prompt = await userInputPromptTemplate.invoke({
      state: this.memory.getMemories() || 'N/A',
      scene: this.memory.scene || 'N/A',
      input: input.join('\n') || 'N/A',
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
          this.memory.add(`${subject.name} moved to position ${positionToString(event.position)}`);
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

  public getLog() {
    return this.memory.getMemoriesArray();
  }
} 
