import { Director } from './Director';
import { Character } from './Character';
import { EnrichedEvent, CharacterEnterEvent } from '../types/events';
import { EntityRegistry } from '../service/EntityRegistry';
import { Entity } from './Entity';
import { InputHandler } from '../service/InputHandler';
import { AssetRegistry } from '../service/AssetRegistry';
import { Ai, AiConfig } from './Ai';

/**
 * Main class representing a theatrical play
 */
export class Play {
  public readonly ai: Ai;
  private director: Director;
  private turnOrder: Entity[] = [];
  private currentTurnIndex: number = 0;
  private readonly entityRegistry = new EntityRegistry();
  private readonly assetRegistry = new AssetRegistry();
  private readonly inputHandler: InputHandler;
  private currentEvents: EnrichedEvent[] = [];
  private currentScene: string = '';

  /**
   * Constructor for the Play class
   * 
   * @param aiConfig - Configuration for the AI
   * @param avatars - List of avatars to be used in the play
   * @param seedEvents - List of seed events to be used in the play
   */
  constructor(aiConfig: AiConfig, avatars: string[], seedEvents: EnrichedEvent[]) {
    this.ai = new Ai(aiConfig);
    this.inputHandler = new InputHandler(this.ai, this.entityRegistry, this.assetRegistry);
    this.assetRegistry.setAvatars(avatars);
    this.director = new Director(this.ai, this.entityRegistry, this.assetRegistry);
    this.entityRegistry.register(this.director);
    this.turnOrder = [this.director];
    this.currentEvents = seedEvents;
    this.handleEvents();
  }

  private addCharacter(charConfig: CharacterEnterEvent): void {
    const character = new Character(
      this.ai,
      this.entityRegistry,
      this.assetRegistry,
      charConfig.name,
      charConfig.avatar,
      charConfig.position,
      charConfig.traits,
      charConfig.emotion,
      charConfig.backstory,
    );
    this.entityRegistry.register(character);
    this.turnOrder.push(character);
  }

  private removeCharacter(characterId: string): void {
    this.entityRegistry.deregister(characterId);
    this.turnOrder = this.turnOrder.filter(e => e.id !== characterId);
  }

  private handleEvents(): void {
    // Handle character additions. This is done first to ensure that characters are available during propagation.
    this.currentEvents
      .filter(event => event.type === 'character_enter')
      .forEach(event => this.addCharacter(event));

    // Handle scene changes
    this.currentEvents
      .filter(event => event.type === 'scene_change')
      .forEach(event => this.currentScene = event.newSceneDescription);

    // Propagate events to all characters
    this.currentEvents.forEach(event => {
      this.entityRegistry.getEntities().forEach(e => e.handleEvent(event));
    });

    // Handle character removals. This is done last to ensure that characters are available during propagation.
    this.currentEvents
      .filter(event => event.type === 'character_exit')
      .forEach(event => this.removeCharacter(event.characterId));
  }

  /**
   * Play the next turn automatically
   */
  public async nextTurn(): Promise<EnrichedEvent[]> {
    // Get current entity and their events
    this.currentEvents = [];
    this.currentTurnIndex = (this.currentTurnIndex + 1) % this.turnOrder.length;
    const currentEntity = this.turnOrder[this.currentTurnIndex];
    this.currentEvents = await currentEntity.takeTurn();

    // Handle internally and return events
    this.handleEvents();
    return this.currentEvents;
  }

  /**
   * Process user input into the play.
   * This does not trigger a turn, but is processed in a similar way.
   */
  public async handleInput(input: string[]): Promise<EnrichedEvent[]> {
    // Turn input into events
    this.currentEvents = [];
    this.currentEvents = await this.inputHandler.handleInput(input);

    // Handle internally and return events
    this.handleEvents();
    return this.currentEvents;
  }

  /**
   * Get the current state of the play, for the UI
   */
  public getState() {
    const speechEvents = this.currentEvents.filter(e => e.type === 'speech');
    const thoughtEvents = this.currentEvents.filter(e => e.type === 'thought');
    const characters = this.entityRegistry.getCharacters().map(c => ({
      id: c.id,
      name: c.name,
      avatar: c.avatar,
      position: c.position,
      emotion: c.emotion,
      speech: speechEvents.filter(e => e.sourceId === c.id).map(e => e.content.trim()).join('\n\n'),
      thought: thoughtEvents.filter(e => e.sourceId === c.id).map(e => e.content.trim()).join('\n\n'),
    }));

    return {
      characters,
      scene: this.currentScene,
    };
  }
}