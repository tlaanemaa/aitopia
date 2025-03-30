import { Director } from './Director';
import { Character } from './Character';
import { EnrichedEvent, CharacterEnterEvent } from '../events/types';
import { EntityRegistry } from '../service/EntityRegistry';
import { Entity } from './Entity';
import { AssetRegistry } from '../service/AssetRegistry';
import { Ai, AiConfig } from './Ai';
import { EventSanitizer } from '../events/EventSanitizer';

/**
 * Main class representing a theatrical play
 */
export class Play {
  public ai: Ai;
  public turnOrder: Entity[] = [];
  public director: Director;
  public currentTurnIndex: number = 0;
  private readonly entityRegistry = new EntityRegistry();
  private readonly assetRegistry = new AssetRegistry();
  private readonly eventSanitizer = new EventSanitizer(this.entityRegistry);
  private currentEvents: EnrichedEvent[] = [];
  private currentScene: string = '';
  private isProcessing: boolean = false;

  /**
   * Constructor for the Play class
   * 
   * @param aiConfig - Configuration for the AI
   * @param avatars - List of avatars to be used in the play
   * @param seedEvents - List of seed events to be used in the play
   */
  constructor(aiConfig: AiConfig, avatars: string[], seedEvents: EnrichedEvent[] = []) {
    this.ai = new Ai(aiConfig);
    this.assetRegistry.setAvatars(avatars);
    this.director = new Director(this.ai, this.entityRegistry, this.assetRegistry);
    this.entityRegistry.register(this.director);
    this.turnOrder = [this.director];
    this.currentEvents = seedEvents;
    this.handleEvents();
  }

  private addCharacter(charConfig: CharacterEnterEvent): void {
    const character = new Character(
      this.ai,
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

  private handleEvents(): void {
    // Sanitize events to ensure they are valid
    this.currentEvents = this.eventSanitizer.sanitize(this.currentEvents);

    // Handle character additions. This is done first to ensure that characters are available during propagation.
    this.currentEvents
      .filter(event => event.type === 'character_enter')
      .forEach(event => this.addCharacter(event));

    // Handle scene changes
    this.currentEvents
      .filter(event => event.type === 'scene_change')
      .forEach(event => this.currentScene = event.newSceneDescription);

    // Propagate events to all characters
    this.currentEvents.forEach(event => {
      this.entityRegistry.getEntities().forEach(e => e.handleEvent(event));
    });

    // Handle character removals. This is done last to ensure that characters are available during propagation.
    this.currentEvents
      .filter(event => event.type === 'character_exit')
      .forEach(event => this.removeCharacter(event.characterId));
  }

  /**
   * Go to the next turn
   */
  public nextTurn() {
    this.currentTurnIndex = (this.currentTurnIndex + 1) % this.turnOrder.length;
  }

  /**
   * Get the current turn entity
   */
  public get currentTurnEntity() {
    return this.turnOrder[this.currentTurnIndex];
  }

  /**
   * Process the current turn, either handling user input if provided or letting the current character
   * take their regular turn. This advances the story state and triggers any resulting events.
   * 
   * @param input - Optional array of strings for user input to process this turn
   */
  public async processTurn(input: string[] = []): Promise<EnrichedEvent[]> {
    // If we're already processing, return
    if (this.isProcessing) return [];

    try {
      this.isProcessing = true;
      this.currentEvents = [];
      // Get current entity and their events
      this.currentEvents = input && input.length > 0
        ? await this.director.handleUserInput(input)
        : await this.currentTurnEntity.takeTurn();

      // Handle internally and return events
      this.handleEvents();
      return this.currentEvents;
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Get the current state of the play, for the UI
   */
  public getState() {
    const speechEvents = this.currentEvents.filter(e => e.type === 'speech');
    const thoughtEvents = this.currentEvents.filter(e => e.type === 'thought');
    const characters = this.entityRegistry.getCharacters().map(c => ({
      id: c.id,
      name: c.name,
      avatar: c.avatar,
      position: c.position,
      active: c.id === this.currentTurnEntity.id,
      emotion: c.emotion,
      speech: speechEvents.filter(e => e.sourceId === c.id).map(e => e.content.trim()).join('\n\n'),
      thought: thoughtEvents.filter(e => e.sourceId === c.id).map(e => e.content.trim()).join('\n\n'),
    }));
    const turnOrder = this.turnOrder.map(e => ({
      id: e.id,
      name: e.name,
      avatar: e.avatar,
    }));

    return {
      characters,
      scene: this.currentScene,
      directorLog: this.director.getLog(),
      turnOrder,
    };
  }
}
