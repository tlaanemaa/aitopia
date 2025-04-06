import { PlayEvent } from '../events/types';
import { EntityRegistry } from '../service/EntityRegistry';
import { AssetRegistry } from '../service/AssetRegistry';
import { Memory } from './Memory';
import { Ai } from './Ai';

/**
 * Base class for all entities in the theater (Director and Characters)
 */
export abstract class Entity {
  public abstract readonly name: string;
  public abstract readonly avatar: string;
  protected memory = new Memory(20);

  constructor(
    protected readonly ai: Ai,
    protected readonly entityRegistry: EntityRegistry,
    protected readonly assetRegistry: AssetRegistry
  ) { }

  public get id() {
    return this.name;
  }

  /**
   * Take your turn in the play
   */
  public abstract takeTurn(): Promise<PlayEvent[]>;

  /**
   * Handle events happening in the world
   */
  public abstract handleEvent(event: PlayEvent): void
}