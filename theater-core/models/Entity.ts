import { v4 as uuidv4 } from 'uuid';
import { EnrichedEvent } from '../types/events';
import { EntityRegistry } from '../service/EntityRegistry';
import { AssetRegistry } from '../service/AssetRegistry';
import { Memory } from './Memory';
import { Ai } from './Ai';

/**
 * Base class for all entities in the theater (Director and Characters)
 */
export abstract class Entity {
  public readonly id = uuidv4();
  public abstract readonly name: string;
  protected memory = new Memory(20);

  constructor(
    protected readonly ai: Ai,
    protected readonly entityRegistry: EntityRegistry,
    protected readonly assetRegistry: AssetRegistry
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