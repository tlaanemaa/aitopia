import { Director } from './Director';
import { Character } from './Character';
import { Position, Emotion } from '../types/common';
import { Event } from '../types/events';

/**
 * Configuration for a character in the play
 */
export interface CharacterConfig {
  name: string;
  initialPosition?: Position;
  initialEmotion?: Emotion;
}

/**
 * Configuration for setting up a play
 */
export interface PlayConfig {
  characters: CharacterConfig[];
}

/**
 * Main class representing a theatrical play
 */
export class Play {
  private director: Director;
  private characters: Character[] = [];
  private isRunning: boolean = false;
  private currentTurnIndex: number = 0;
  private entities: (Director | Character)[] = [];

  constructor() {
    this.director = new Director(this);
    this.entities = [this.director];
  }

  /**
   * Set up the play with the given configuration
   */
  setup(config: PlayConfig): void {
    // Clear any existing characters
    this.characters = [];
    this.entities = [this.director];

    // Create characters from config
    config.characters.forEach(charConfig => {
      const character = new Character(
        this,
        charConfig.name,
        charConfig.initialPosition,
        charConfig.initialEmotion
      );
      this.characters.push(character);
      this.entities.push(character);
    });
  }

  /**
   * Start running the play
   */
  start(): void {
    if (this.isRunning) {
      throw new Error('Play is already running');
    }
    if (this.characters.length === 0) {
      throw new Error('No characters in the play');
    }
    this.isRunning = true;
  }

  /**
   * Stop the play
   */
  stop(): void {
    this.isRunning = false;
  }

  /**
   * Get the entity whose turn it is
   */
  getCurrentEntity(): Director | Character {
    return this.entities[this.currentTurnIndex];
  }

  /**
   * Check if it's a specific entity's turn
   */
  isEntityTurn(entityId: string): boolean {
    const currentEntity = this.getCurrentEntity();
    return currentEntity.id === entityId;
  }

  /**
   * Advance to the next turn
   */
  nextTurn(): void {
    if (!this.isRunning) {
      throw new Error('Play is not running');
    }

    // Get current entity and their events
    const currentEntity = this.getCurrentEntity();
    const events = currentEntity.getEvents();

    // Apply events to all entities
    this.entities.forEach(entity => {
      events.forEach((event: Event) => {
        entity.handleEvent(event);
      });
    });

    // Move to next turn
    this.currentTurnIndex = (this.currentTurnIndex + 1) % this.entities.length;
  }

  /**
   * Get all characters in the play
   */
  getCharacters(): Character[] {
    return [...this.characters];
  }

  /**
   * Get the director
   */
  getDirector(): Director {
    return this.director;
  }
} 