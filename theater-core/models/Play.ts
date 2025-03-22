import { Director } from './Director';
import { Character } from './Character';
import { EnrichedEvent, CharacterEnterEvent } from '../types/events';
import { EntityRegistry } from '../service/EntityRegistry';
import { Entity } from './Entity';
import { wait } from '../utils/util';

/**
 * Main class representing a theatrical play
 */
export class Play {
  private director: Director;
  private readonly entityRegistry = new EntityRegistry();
  private isRunning: boolean = false;
  private currentTurnIndex: number = 0;
  private characters: Character[] = [];
  private turnOrder: Entity[] = [];
  public playPromise?: Promise<string>;

  constructor(seedEvents: EnrichedEvent[]) {
    this.director = new Director(this.entityRegistry);
    this.turnOrder = [this.director];
    this.handleEvents(seedEvents);
  }

  /**
   * Start running the play
   */
  public start(): Promise<string> {
    if (this.isRunning) throw new Error('Play is already running!');
    this.isRunning = true;
    this.playPromise = this.run().finally(() => {
      this.isRunning = false;
      this.playPromise = undefined;
    });
    return this.playPromise;
  }

  /**
   * Stop the play
   */
  public async stop(): Promise<string | undefined> {
    this.isRunning = false;
    return this.playPromise;
  }

  private addCharacter(charConfig: CharacterEnterEvent): void {
    const character = new Character(
      this.entityRegistry,
      charConfig.name,
      charConfig.position,
      charConfig.traits,
      charConfig.backstory,
      charConfig.description
    );
    this.entityRegistry.register(character);
    this.characters.push(character);
    this.turnOrder.push(character);
  }

  private removeCharacter(characterId: string): void {
    this.entityRegistry.deregister(characterId);
    this.characters = this.characters.filter(c => c.id !== characterId);
    this.turnOrder = this.turnOrder.filter(e => e.id !== characterId);
  }

  private handleEvents(events: EnrichedEvent[]): void {
    // Handle character additions. This is done first to ensure that characters are available during propagation.
    events
      .filter(event => event.type === 'character_enter')
      .forEach(event => this.addCharacter(event));

    // Propagate events to all characters
    events.forEach(event => {
      this.characters.forEach(character => character.handleEvent(event));
    });

    // Handle character removals. This is done last to ensure that characters are available during propagation.
    events
      .filter(event => event.type === 'character_exit')
      .forEach(event => this.removeCharacter(event.characterId));
  }

  /**
   * Run the play until it is stopped
   */
  public async run(): Promise<string> {
    while (this.isRunning) {
      // Calculate turn start time
      const turnStartTime = Date.now();

      // Get current entity and their events
      this.currentTurnIndex = (this.currentTurnIndex + 1) % this.turnOrder.length;
      const currentEntity = this.turnOrder[this.currentTurnIndex];
      const events = await currentEntity.takeTurn();

      // Handle events
      this.handleEvents(events);

      // Little delay to prevent spamming
      const turnDuration = Date.now() - turnStartTime;
      if (turnDuration < 1000) await wait(100);
    }

    return "Play is stopped!";
  }
} 