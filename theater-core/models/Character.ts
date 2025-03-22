import {
    EnrichedCharacterEvent,
    EnrichedEvent,
    Position,
    Trait,
    WorldEvent
} from '../types/events';
import { isInRange } from '../utils/util';
import { EntityRegistry } from '../service/EntityRegistry';
import { Perception } from './Perception';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { Entity } from './Entity';
import { z } from 'zod';
import { CharacterEventSchema } from '../types/events';
import { Ai } from './Ai';

const SYSTEM_PROMPT = `
You are a character named {name}.
Always respond as {name} and describe your actions in the first person.
Your backstory is:
{backstory}
`;

const TASK_PROMPT = `
This is what you know about the world:
{memories}

Your are currently at {position}, feeling {emotion}.
The current time is {time}.
What do you want to do next?
`;

const promptTemplate = ChatPromptTemplate.fromMessages([
    ["system", SYSTEM_PROMPT.trim()],
    ["user", TASK_PROMPT.trim()],
]);

const responseFormat = z.array(CharacterEventSchema).describe('Array of events describing what you want to do next');

/**
 * Character class - Can only produce character events
 */
export class Character extends Entity {
    private perception: Perception;
    private readonly ai = new Ai();

    constructor(
        entityRegistry: EntityRegistry,
        public readonly name: string,
        public position: Position = { x: 50, y: 50 },
        public traits: Trait[] = [],
        public emotion: string = 'neutral',
        public backstory?: string
    ) {
        super(entityRegistry);
        this.perception = new Perception(traits);
    }

    /**
     * Take a turn
     */
    public async takeTurn(): Promise<EnrichedCharacterEvent[]> {
        const prompt = await promptTemplate.invoke({
            name: this.name,
            backstory: this.backstory,
            memories: this.getMemories(),
            position: this.position,
            emotion: this.emotion,
            time: new Date().toTimeString()
        });
        const response = await this.ai.call(prompt, responseFormat);
        const enrichedEvents = response.map(event => ({
            ...event,
            sourceId: this.id,
            position: this.position
        }));
        return enrichedEvents;
    }

    /**
     * Handle events propagated to this character
     */
    handleEvent(event: EnrichedEvent): void {
        switch (event.type) {
            case 'action':
                this.handleAction(event);
                break;
            case 'speech':
                this.handleSpeech(event);
                break;
            case 'emotion':
                this.handleEmotion(event);
                break;
            case 'movement':
                this.handleMovement(event);
                break;
            case 'thought':
                this.handleThought(event);
                break;
            case 'scene_change':
                this.handleSceneChange(event);
                break;
            case 'character_enter':
                this.handleCharacterEnter(event);
                break;
            case 'character_exit':
                this.handleCharacterExit(event);
                break;
            case 'generic':
                this.handleGeneric(event);
                break;
        }
    }

    private handleAction(event: Extract<EnrichedCharacterEvent, { type: 'action' }>): void {
        const source = this.entityRegistry.getEntity(event.sourceId)
        if (!source) return;
        if (source.id === this.id) {
            this.addMemory(`I ${event.action.toLowerCase()}`);
        } else if (isInRange(event.position, this.position, this.perception.radius.sight)) {
            this.addMemory(`${source.name} ${event.action.toLowerCase()}`);
        }
    }

    private handleSpeech(event: Extract<EnrichedCharacterEvent, { type: 'speech' }>): void {
        const source = this.entityRegistry.getEntity(event.sourceId)
        if (!source) return;
        if (source.id === this.id) {
            this.addMemory(`I said: "${event.content}" ${event.targetName ? `to ${event.targetName}` : ''}`);
        } else if (isInRange(event.position, this.position, this.perception.radius.hearing)) {
            this.addMemory(`${source.name} said: "${event.content}" ${event.targetName ? `to ${event.targetName}` : ''}`);
        }
    }

    private handleEmotion(event: Extract<EnrichedCharacterEvent, { type: 'emotion' }>): void {
        const source = this.entityRegistry.getEntity(event.sourceId)
        if (!source) return;
        this.emotion = event.emotion;
        if (source.id === this.id) {
            this.addMemory(`I am feeling ${event.emotion}`);
        } else if (isInRange(event.position, this.position, this.perception.radius.emotion)) {
            this.addMemory(`${source.name} is feeling ${event.emotion}`);
        }
    }

    private handleMovement(event: Extract<EnrichedCharacterEvent, { type: 'movement' }>): void {
        const source = this.entityRegistry.getEntity(event.sourceId)
        if (!source) return;
        this.position = event.position;
        if (source.id === this.id) {
            this.addMemory(`I moved to position (${event.position.x}, ${event.position.y})`);
        } else if (isInRange(event.position, this.position, this.perception.radius.sight)) {
            this.addMemory(`${source.name} moved to position (${event.position.x}, ${event.position.y})`);
        }
    }

    private handleThought(event: Extract<EnrichedCharacterEvent, { type: 'thought' }>): void {
        const source = this.entityRegistry.getEntity(event.sourceId)
        if (!source) return;
        if (source.id === this.id) {
            this.addMemory(`I thought: "${event.content}"`);
        }
    }

    private handleSceneChange(event: Extract<WorldEvent, { type: 'scene_change' }>): void {
        this.addMemory(`Suddenly, the scene has changed to: ${event.newSceneDescription}`);
    }

    private handleCharacterEnter(event: Extract<WorldEvent, { type: 'character_enter' }>): void {
        this.addMemory(`${event.name} has appeared`);
    }

    private handleCharacterExit(event: Extract<WorldEvent, { type: 'character_exit' }>): void {
        const source = this.entityRegistry.getEntity(event.characterId)!
        this.addMemory(`${source.name} has left`);
    }

    private handleGeneric(event: Extract<WorldEvent, { type: 'generic' }>): void {
        this.addMemory(`${event.description}`);
    }
}