import {
    EnrichedCharacterEvent,
    EnrichedEvent,
    Position,
    Trait
} from '../types/events';
import { isInRange } from '../utils/spatial';
import { entityRegistry } from '../service/EntityRegistry';
import { Entity } from './Entity';
import { Perception } from './Perception';

interface MemoryItem {
    timestamp: Date;
    content: string;
}

/**
 * Character class - Can only produce character events
 */
export class Character extends Entity {
    private perception: Perception;
    private memory: MemoryItem[] = [];

    constructor(
        public readonly name: string,
        public position: Position = { x: 50, y: 50 },
        public emotion: string = 'neutral',
        public traits: Trait[] = []
    ) {
        super();
        this.perception = new Perception(traits);
    }

    /**
     * Take a turn
     */
    public async takeTurn(): Promise<EnrichedCharacterEvent[]> {
        return [];
    }

    private addMemory(content: string): void {
        this.memory.push({ timestamp: new Date(), content });
        this.memory = this.memory.slice(-20); // Keep last 20 memories
    }

    /**
     * Handle events propagated to this character
     */
    handleEvent(event: EnrichedEvent): void {
        const source = entityRegistry.getEntity(event.sourceId)
        if (!source) return;

        switch (event.type) {
            case 'action':
                this.handleAction(event, source);
                break;
            case 'speech':
                this.handleSpeech(event, source);
                break;
            case 'emotion':
                this.handleEmotion(event, source);
                break;
            case 'movement':
                this.handleMovement(event, source);
                break;
            case 'thought':
                this.handleThought(event, source);
                break;
            case 'scene_change':
                this.handleSceneChange(event);
                break;
            case 'character_enter':
                this.handleCharacterEnter(event, source);
                break;
            case 'character_exit':
                this.handleCharacterExit(event, source);
                break;
            case 'generic':
                this.handleGeneric(event, source);
                break;
        }
    }

    private handleAction(event: Extract<EnrichedEvent, { type: 'action' }>, source: Entity): void {
        if (source.id === this.id) {
            this.addMemory(`I ${event.action.toLowerCase()}`);
        } else if (isInRange(event.position, this.position, this.perception.radius.sight)) {
            this.addMemory(`${source.name} ${event.action.toLowerCase()}`);
        }
    }

    private handleSpeech(event: Extract<EnrichedEvent, { type: 'speech' }>, source: Entity): void {
        if (source.id === this.id) {
            this.addMemory(`I said: "${event.content}" ${event.targetName ? `to ${event.targetName}` : ''}`);
        } else if (isInRange(event.position, this.position, this.perception.radius.hearing)) {
            this.addMemory(`${source.name} said: "${event.content}" ${event.targetName ? `to ${event.targetName}` : ''}`);
        }
    }

    private handleEmotion(event: Extract<EnrichedEvent, { type: 'emotion' }>, source: Entity): void {
        this.emotion = event.emotion;
        if (source.id === this.id) {
            this.addMemory(`I am feeling ${event.emotion}`);
        } else if (isInRange(event.position, this.position, this.perception.radius.emotion)) {
            this.addMemory(`${source.name} is feeling ${event.emotion}`);
        }
    }

    private handleMovement(event: Extract<EnrichedEvent, { type: 'movement' }>, source: Entity): void {
        this.position = event.position;
        if (source.id === this.id) {
            this.addMemory(`I moved to position (${event.position.x}, ${event.position.y})`);
        } else if (isInRange(event.position, this.position, this.perception.radius.sight)) {
            this.addMemory(`${source.name} moved to position (${event.position.x}, ${event.position.y})`);
        }
    }

    private handleThought(event: Extract<EnrichedEvent, { type: 'thought' }>, source: Entity): void {
        if (source.id === this.id) {
            this.addMemory(`I thought: "${event.content}"`);
        }
    }

    private handleSceneChange(event: Extract<EnrichedEvent, { type: 'scene_change' }>): void {
        this.addMemory(`Suddenly, the scene changed to: ${event.newSceneDescription}`);
    }

    private handleCharacterEnter(event: Extract<EnrichedEvent, { type: 'character_enter' }>, source: Entity): void {
        this.addMemory(`${source.name} has appeared`);
    }

    private handleCharacterExit(event: Extract<EnrichedEvent, { type: 'character_exit' }>, source: Entity): void {
        this.addMemory(`${source.name} has left`);
    }

    private handleGeneric(event: Extract<EnrichedEvent, { type: 'generic' }>, source: Entity): void {
        if (source.id === this.id) {
            this.addMemory(`${event.description}`);
        } else {
            this.addMemory(`${source.name}: ${event.description}`);
        }
    }
}