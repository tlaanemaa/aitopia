import { EnrichedEvent } from '../types/events';
import { Entity } from './Entity';

/**
 * Director class - Can produce both character and world events
 */
export class Director extends Entity {
  public readonly name = 'Director';
  /**
 * Take a turn
 */
  public async takeTurn(): Promise<EnrichedEvent[]> {
    return [];
  }
} 