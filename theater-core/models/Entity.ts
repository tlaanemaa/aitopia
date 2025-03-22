import { v4 as uuidv4 } from 'uuid';
import { EnrichedEvent } from '../types/events';
import { EntityRegistry } from '../service/EntityRegistry';
import { AssetRegistry } from '../service/AssetRegistry';

interface MemoryItem {
  timestamp: Date;
  content: string;
}

/**
 * Base class for all entities in the theater (Director and Characters)
 */
export abstract class Entity {
  public readonly id = uuidv4();
  public abstract readonly name: string;
  protected memorySize = 20;
  protected memory: MemoryItem[] = [];

  constructor(
    public readonly entityRegistry: EntityRegistry,
    public readonly assetRegistry: AssetRegistry
  ) { }

  /**
   * Add a memory to the entity
   */
  protected addMemory(content: string): void {
    this.memory.push({ timestamp: new Date(), content });
    this.memory = this.memory.slice(-this.memorySize); // Keep last N memories
  }

  /**
   * Get memories as a string
   */
  protected getMemories(): string {
    return this.memory.map(m => `${m.timestamp.toTimeString()} - ${m.content}`).join('\n');
  }

  /**
   * Take your turn in the play
   */
  public abstract takeTurn(): Promise<EnrichedEvent[]>;

  /**
   * Handle events happening in the world
   */
  public abstract handleEvent(event: EnrichedEvent): void
}