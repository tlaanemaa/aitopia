import {
    EnrichedCharacterEvent,
    EnrichedEvent,
    Position,
    Trait,
    WorldEvent
} from '../types/events';
import { isInRange, positionToString } from '../utils/util';
import { EntityRegistry } from '../service/EntityRegistry';
import { Perception } from './Perception';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { Entity } from './Entity';
import { z } from 'zod';
import { CharacterEventSchema } from '../types/events';
import { Ai } from './Ai';
import { AssetRegistry } from '../service/AssetRegistry';

const SYSTEM_PROMPT = `
You are {name}, a real person with your own history, motivations, and feelings. 
See the world entirely through your own eyes. Always speak in the first person and describe your actions as if you are truly living in this moment.

**Current Scene**
{scene}

**Your Background**
{backstory}

Stay fully immersed in your role. Do not mention or acknowledge anything beyond your character’s knowledge—no outside systems, no “play,” and no audiences. You should think and act with complete independence, guided by your own personality, memories, and desires.

The world around you can change, and time can pass. Other people may speak or act. You respond naturally, always staying true to who you are. Be vivid, be authentic, and be proactive in shaping your own path. 
`;

const TASK_PROMPT = `
Your recollection of recent events and observations:
{memories}

You are at position {position} in the scene, and you currently feel {emotion}. 
The time is {time}.

From your own perspective, decide what you want to do or say next. 
Choose whichever actions and expressions feel most natural and true to you. 
Return at least one event in the format that captures your intention—for instance:
- speech (type: "speech")
- an action you perform (type: "action")
- an emotional display (type: "emotion")
- a movement you take (type: "movement")
- a private thought (type: "thought")

Remain entirely in-character: speak in the first person, trust your own memories, and keep your personality and goals in mind. 
Do not mention anything outside your lived reality. 
Simply respond as {name}, showing what you decide to do or say next.
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

    constructor(
        ai: Ai,
        entityRegistry: EntityRegistry,
        assetRegistry: AssetRegistry,
        public readonly name: string,
        public avatar: string,
        public position: Position = { x: 50, y: 50 },
        public traits: Trait[] = [],
        public emotion: string = 'neutral',
        public backstory?: string,
    ) {
        super(ai, entityRegistry, assetRegistry);
        this.perception = new Perception(traits);
    }

    /**
     * Take a turn
     */
    public async takeTurn(): Promise<EnrichedCharacterEvent[]> {
        const prompt = await promptTemplate.invoke({
            name: this.name,
            backstory: this.backstory || 'N/A',
            scene: this.memory.scene || 'N/A',
            memories: this.memory.getMemories() || 'N/A',
            position: positionToString(this.position),
            emotion: this.emotion || 'N/A',
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
            this.memory.add(`I ${event.action.toLowerCase()}`);
        } else if (isInRange(event.position, this.position, this.perception.radius.sight)) {
            this.memory.add(`${source.name} ${event.action.toLowerCase()}`);
        }
    }

    private handleSpeech(event: Extract<EnrichedCharacterEvent, { type: 'speech' }>): void {
        const source = this.entityRegistry.getEntity(event.sourceId)
        if (!source) return;
        if (source.id === this.id) {
            this.memory.add(`I said: "${event.content}" ${event.targetName ? `to ${event.targetName}` : ''}`);
        } else if (isInRange(event.position, this.position, this.perception.radius.hearing)) {
            this.memory.add(`${source.name} said: "${event.content}" ${event.targetName ? `to ${event.targetName}` : ''}`);
        }
    }

    private handleEmotion(event: Extract<EnrichedCharacterEvent, { type: 'emotion' }>): void {
        const source = this.entityRegistry.getEntity(event.sourceId)
        if (!source) return;
        this.emotion = event.emotion;
        if (source.id === this.id) {
            this.memory.add(`I am feeling ${event.emotion}`);
        } else if (isInRange(event.position, this.position, this.perception.radius.emotion)) {
            this.memory.add(`${source.name} is feeling ${event.emotion}`);
        }
    }

    private handleMovement(event: Extract<EnrichedCharacterEvent, { type: 'movement' }>): void {
        const source = this.entityRegistry.getEntity(event.sourceId)
        if (!source) return;
        this.position = event.position;
        if (source.id === this.id) {
            this.memory.add(`I moved to position ${positionToString(event.position)}`);
        } else if (isInRange(event.position, this.position, this.perception.radius.sight)) {
            this.memory.add(`${source.name} moved to position ${positionToString(event.position)}`);
        }
    }

    private handleThought(event: Extract<EnrichedCharacterEvent, { type: 'thought' }>): void {
        const source = this.entityRegistry.getEntity(event.sourceId)
        if (!source) return;
        if (source.id === this.id) {
            this.memory.add(`I thought: "${event.content}"`);
        }
    }

    private handleSceneChange(event: Extract<WorldEvent, { type: 'scene_change' }>): void {
        this.memory.add(`Suddenly, the scene has changed to: ${event.newSceneDescription}`);
        this.memory.setScene(event.newSceneDescription);
    }

    private handleCharacterEnter(event: Extract<WorldEvent, { type: 'character_enter' }>): void {
        this.memory.add(`${event.name} has appeared`);
    }

    private handleCharacterExit(event: Extract<WorldEvent, { type: 'character_exit' }>): void {
        const source = this.entityRegistry.getEntity(event.characterId)
        if (!source) return;
        this.memory.add(`${source.name} has left`);
    }

    private handleGeneric(event: Extract<WorldEvent, { type: 'generic' }>): void {
        this.memory.add(`${event.description}`);
    }
}
