import { Director } from './Director';
import { Character } from './Character';
import { EnrichedEvent, CharacterEnterEvent, EnrichedCharacterEvent, EnrichedDirectorEvent } from '../events/types';
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

  private addCharacter(name: string, charConfig: CharacterEnterEvent): void {
    const character = new Character(
      this.ai,
      this.entityRegistry,
      this.assetRegistry,
      name,
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
    const directorEvents = this.currentEvents.filter(e => e.type === 'director_event') as EnrichedDirectorEvent[];

    // Handle character additions. This is done first to ensure that characters are available during propagation.
    directorEvents.forEach((e) => {
      const newCharacters = Object.entries(e.newCharacters ?? {});
      newCharacters.forEach(([name, charConfig]) => this.addCharacter(name, charConfig));
    });

    // Handle scene changes
    directorEvents.forEach((e) => {
      if (e.newSceneDescription) {
        this.currentScene = e.newSceneDescription;
      }
    });

    // Propagate all the events to all characters
    this.currentEvents.forEach(e => this.entityRegistry.getCharacters().forEach(c => c.handleEvent(e)));


    // Handle character removals. This is done last to ensure that characters are available during propagation.
    directorEvents.forEach((e) => {
      if (e.charactersToRemove) {
        const charactersToRemove = Object.keys(e.charactersToRemove);
        charactersToRemove.forEach(name => this.removeCharacter(name));
      }
    });
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

      this.currentEvents = this.eventSanitizer.sanitize(this.currentEvents);

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
    const speechEvents = this.currentEvents.filter(e => e.type === 'character_event' && e.speech) as EnrichedCharacterEvent[];
    const thoughtEvents = this.currentEvents.filter(e => e.type === 'character_event' && e.thought) as EnrichedCharacterEvent[];

    const characters = this.entityRegistry.getCharacters().map(c => ({
      id: c.id,
      name: c.name,
      avatar: c.avatar,
      position: c.position,
      active: c.id === this.currentTurnEntity.id,
      emotion: c.emotion,
      lastThought: c.lastThought,
      lastSpeech: c.lastSpeech,
      currentSpeech: speechEvents.find(e => e.name === c.name)?.speech ?? '',
      currentThought: thoughtEvents.find(e => e.name === c.name)?.thought ?? '',
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
