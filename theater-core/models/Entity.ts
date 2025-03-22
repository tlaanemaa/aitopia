import { v4 as uuidv4 } from 'uuid';
import { EnrichedEvent } from '../types/events';
import { EntityRegistry } from '../service/EntityRegistry';

/**
 * Base class for all entities in the theater (Director and Characters)
 */
export abstract class Entity {
  public readonly id = uuidv4();
  public abstract readonly name: string;

  constructor(
    public readonly entityRegistry: EntityRegistry
  ) { }

  public abstract takeTurn(): Promise<EnrichedEvent[]>;
}