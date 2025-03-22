import { v4 as uuidv4 } from 'uuid';
import { AnyEvent } from '../types/events';

/**
 * Base class for all entities in the theater (Director and Characters)
 */
export abstract class Entity {
  public readonly id = uuidv4();
  public abstract readonly name: string;

  public abstract takeTurn(): Promise<AnyEvent[]>;
}