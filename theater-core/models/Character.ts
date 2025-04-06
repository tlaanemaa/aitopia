import {
    Emotion,
    Position,
    Trait,
    PlayEvent
} from '../events/types';
import { isInRange, positionToString } from '../utils/util';
import { EntityRegistry } from '../service/EntityRegistry';
import { Perception } from './Perception';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { Entity } from './Entity';
import { characterEventSchema, transformCharacterEvent } from '../events/llm';
import { Ai } from './Ai';
import { AssetRegistry } from '../service/AssetRegistry';

const CHARACTER_SYSTEM_PROMPT = `
You are {name}, a real person with your own history, motivations, and feelings. See the world through your own eyes. Always speak in the first person and live in the present.

**Background**
{backstory}

Stay immersed in your role, guided by your personality, memories, and desires.
The world can change around you; time can pass; others may speak or act. Respond naturally and consistently. Be vivid, genuine, and take initiative.
`;

const CHARACTER_TASK_PROMPT = `
Recent events and observations:
{memories}

You are at {position} and feel {emotion}. The time is {time}.
{nudges}
From your perspective, decide your next move or words. Keep it interesting!
Return as JSON.
`;

const promptTemplate = ChatPromptTemplate.fromMessages([
    ["system", CHARACTER_SYSTEM_PROMPT.trim()],
    ["user", CHARACTER_TASK_PROMPT.trim()],
]);

/**
 * Character class - Can only produce character events
 */
export class Character extends Entity {
    private perception: Perception;
    private turnsSinceMovement: number = 0;
    private turnsSinceSpeech: number = 0;
    public lastThought: string = '';
    public lastSpeech: string = '';

    constructor(
        ai: Ai,
        entityRegistry: EntityRegistry,
        assetRegistry: AssetRegistry,
        public readonly name: string,
        public avatar: string,
        public position: Position = { x: 50, y: 50 },
        public traits: Trait[] = [],
        public emotion: Emotion = 'neutral',
        public backstory?: string,
    ) {
        super(ai, entityRegistry, assetRegistry);
        this.perception = new Perception(traits);
        this.memory.size = 30;
    }

    /**
     * Take a turn
     */
    public async takeTurn(): Promise<PlayEvent[]> {
        const prompt = await promptTemplate.invoke({
            name: this.name,
            backstory: this.backstory || 'N/A',
            scene: this.memory.scene || 'N/A',
            memories: this.memory.getMemories() || 'N/A',
            position: positionToString(this.position),
            emotion: this.emotion || 'N/A',
            time: new Date().toLocaleTimeString("en-US"),
            nudges: this.getNudges()
        });
        const response = await this.ai.call(prompt, characterEventSchema());
        const events = transformCharacterEvent(this.name, this.position, response);

        const containsMovement = events.some(event => event.type === 'movement');
        this.turnsSinceMovement = containsMovement ? 0 : this.turnsSinceMovement + 1;
        const containsSpeech = events.some(event => event.type === 'speech');
        this.turnsSinceSpeech = containsSpeech ? 0 : this.turnsSinceSpeech + 1;

        return events;
    }

    /**
     * Get nudges for the character
     */
    private getNudges(): string {
        const nudges = [];
        if (this.turnsSinceMovement > 2) {
            nudges.push(`You feel an irresistible urge to move away from ${positionToString(this.position)}!`);
        }
        if (this.turnsSinceSpeech > 2) {
            nudges.push(`You feel an irresistible urge to speak!`);
        }
        return nudges.join('\n').trim();
    }

    /**
     * Handle events propagated to this character
     */
    handleEvent(event: PlayEvent): void {
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

    private handleAction(event: Extract<PlayEvent, { type: 'action' }>): void {
        const source = this.entityRegistry.getEntity(event.name)
        if (!source) return;
        if (source.id === this.id || isInRange(event.position, this.position, this.perception.radius.sight)) {
            this.memory.add(event.data);
        }
    }

    private handleSpeech(event: Extract<PlayEvent, { type: 'speech' }>): void {
        const source = this.entityRegistry.getEntity(event.name)
        if (!source) return;
        if (source.id === this.id) {
            this.lastSpeech = event.data;
            this.memory.add(`I said: "${event.data}"`);
        } else if (isInRange(event.position, this.position, this.perception.radius.hearing)) {
            this.memory.add(`${source.name} said: "${event.data}"`);
        }
    }

    private handleEmotion(event: Extract<PlayEvent, { type: 'emotion' }>): void {
        const source = this.entityRegistry.getEntity(event.name)
        if (!source) return;
        this.emotion = event.data;
        if (source.id === this.id) {
            this.memory.add(`I am feeling ${event.data}`);
        } else if (isInRange(event.position, this.position, this.perception.radius.emotion)) {
            this.memory.add(`${source.name} is feeling ${event.data}`);
        }
    }

    private handleMovement(event: Extract<PlayEvent, { type: 'movement' }>): void {
        const source = this.entityRegistry.getEntity(event.name)
        if (!source) return;
        if (source.id === this.id) {
            this.position = event.data;
            this.memory.add(`I moved to position ${positionToString(event.data)}`);
        } else if (isInRange(event.position, this.position, this.perception.radius.sight)) {
            this.memory.add(`${source.name} moved to position ${positionToString(event.data)}`);
        }
    }

    private handleThought(event: Extract<PlayEvent, { type: 'thought' }>): void {
        const source = this.entityRegistry.getEntity(event.name)
        if (!source) return;
        if (source.id === this.id) {
            this.lastThought = event.data;
            this.memory.add(`I thought: "${event.data}"`);
        }
    }

    private handleSceneChange(event: Extract<PlayEvent, { type: 'scene_change' }>): void {
        this.memory.add(`Suddenly, the scene has changed to: ${event.data}`);
        this.memory.setScene(event.data);
    }

    private handleCharacterEnter(event: Extract<PlayEvent, { type: 'character_enter' }>): void {
        this.memory.add(`${event.data.name} has joined at ${positionToString(event.data.position)}`);
    }

    private handleCharacterExit(event: Extract<PlayEvent, { type: 'character_exit' }>): void {
        this.memory.add(`${event.data.name} has left`);
    }

    private handleGeneric(event: Extract<PlayEvent, { type: 'generic' }>): void {
        this.memory.add(`${event.data}`);
    }
}
