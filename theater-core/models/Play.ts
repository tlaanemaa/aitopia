import { Director } from './Director';
import { Character } from './Character';
import { EnrichedEvent, CharacterEnterEvent } from '../types/events';
import { EntityRegistry } from '../service/EntityRegistry';
import { Entity } from './Entity';
import { InputHandler } from '../service/InputHandler';
import { AssetRegistry } from '../service/AssetRegistry';

/**
 * Main class representing a theatrical play
 */
export class Play {
  private director: Director;
  private turnOrder: Entity[] = [];
  private currentTurnIndex: number = 0;
  public readonly entityRegistry = new EntityRegistry();
  private readonly assetRegistry = new AssetRegistry();
  private readonly inputHandler = new InputHandler(this.entityRegistry, this.assetRegistry);

  /**
   * Constructor for the Play class
   * 
   * @param avatars - List of avatars to be used in the play
   * @param seedEvents - List of seed events to be used in the play
   */
  constructor(avatars: string[], seedEvents: EnrichedEvent[]) {
    this.assetRegistry.setAvatars(avatars);
    this.director = new Director(this.entityRegistry, this.assetRegistry);
    this.entityRegistry.register(this.director);
    this.turnOrder = [this.director];
    this.handleEvents(seedEvents);
  }

  private addCharacter(charConfig: CharacterEnterEvent): void {
    const character = new Character(
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

  private handleEvents(events: EnrichedEvent[]): void {
    // Handle character additions. This is done first to ensure that characters are available during propagation.
    events
      .filter(event => event.type === 'character_enter')
      .forEach(event => this.addCharacter(event));

    // Propagate events to all characters
    events.forEach(event => {
      this.entityRegistry.getEntities().forEach(e => e.handleEvent(event));
    });

    // Handle character removals. This is done last to ensure that characters are available during propagation.
    events
      .filter(event => event.type === 'character_exit')
      .forEach(event => this.removeCharacter(event.characterId));
  }

  public async nextTurn(): Promise<EnrichedEvent[]> {
    // Get current entity and their events
    this.currentTurnIndex = (this.currentTurnIndex + 1) % this.turnOrder.length;
    const currentEntity = this.turnOrder[this.currentTurnIndex];
    const events = await currentEntity.takeTurn();

    // Handle internally and return events
    this.handleEvents(events);
    return events;
  }

  public async handleInput(input: string[]): Promise<EnrichedEvent[]> {
    // Turn input into events
    const events = await this.inputHandler.handleInput(input);

    // Handle internally and return events
    this.handleEvents(events);
    return events;
  }
} 