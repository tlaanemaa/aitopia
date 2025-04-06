import {
    Emotion,
    EnrichedCharacterEvent,
    EnrichedEvent,
    Position,
    Trait,
    CharacterEventSchema,
} from '../events/types';
import { isInRange, positionToString } from '../utils/util';
import { EntityRegistry } from '../service/EntityRegistry';
import { Perception } from './Perception';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { Entity } from './Entity';
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
From your perspective, decide your next move or words. Choose any event type that feels right.
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
    public async takeTurn(): Promise<EnrichedCharacterEvent[]> {
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

        const response = await this.ai.call(prompt, CharacterEventSchema);

        // TODO: Do this in the handler
        this.turnsSinceMovement = response.destination ? 0 : this.turnsSinceMovement + 1;
        this.turnsSinceSpeech = response.speech ? 0 : this.turnsSinceSpeech + 1;
        return [
            {
                ...response,
                type: 'character_event',
                name: this.name,
                position: this.position,
            },
        ];
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
    handleEvent(event: EnrichedEvent): void {
        if ("name" in event) {
            const subject = this.entityRegistry.getEntity(event.name);
            if (!subject) return;

            if (event.action) {
                if (subject.id === this.id || isInRange(event.position, this.position, this.perception.radius.sight)) {
                    this.memory.add(event.action);
                }
            }

            if (event.speech) {
                if (subject.id === this.id) {
                    this.lastSpeech = event.speech;
                    this.memory.add(`I said: "${event.speech}"`);
                } else if (isInRange(event.position, this.position, this.perception.radius.hearing)) {
                    this.memory.add(`${subject.name} said: "${event.speech}"`);
                }
            }

            if (event.emotion) {
                if (subject.id === this.id) {
                    this.emotion = event.emotion;
                    this.memory.add(`I feel ${event.emotion}`);
                } else if (isInRange(event.position, this.position, this.perception.radius.emotion)) {
                    this.memory.add(`${subject.name} is feeling ${event.emotion}`);
                }
            }

            if (event.destination) {
                if (subject.id === this.id) {
                    this.position = event.destination;
                    this.memory.add(`I moved to ${positionToString(event.destination)}`);
                } else if (isInRange(event.position, this.position, this.perception.radius.sight)) {
                    this.memory.add(`${subject.name} moved to position ${positionToString(event.destination)}`);
                }
            }

            if (event.thought) {
                if (subject.id === this.id) {
                    this.lastThought = event.thought;
                    this.memory.add(`I'm thinking: "${event.thought}"`);
                }
            }
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
                this.memory.add(`Suddenly, the scene has changed to: ${event.newSceneDescription}`);
                this.memory.setScene(event.newSceneDescription);
            }

            if (event.genericWorldEvent) {
                this.memory.add(event.genericWorldEvent);
            }
        }
    }
}
