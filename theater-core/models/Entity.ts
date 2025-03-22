import { v4 as uuidv4 } from 'uuid';
import { EnrichedEvent } from '../types/events';
import { EntityRegistry } from '../service/EntityRegistry';
import { AssetRegistry } from '../service/AssetRegistry';
import { Memory } from './Memory';

/**
 * Base class for all entities in the theater (Director and Characters)
 */
export abstract class Entity {
  public readonly id = uuidv4();
  public abstract readonly name: string;
  protected memory = new Memory(20);

  constructor(
    public readonly entityRegistry: EntityRegistry,
    public readonly assetRegistry: AssetRegistry
  ) { }

  /**
   * Take your turn in the play
   */
  public abstract takeTurn(): Promise<EnrichedEvent[]>;

  /**
   * Handle events happening in the world
   */
  public abstract handleEvent(event: EnrichedEvent): void
}