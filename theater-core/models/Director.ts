/**
 * Director - Manages the narrative and directs the theatrical experience
 */
import { v4 as uuidv4 } from 'uuid';
import { 
  CharacterArchetype, 
  Emotion, 
  NarrativePhase, 
  PlotThread, 
  Position 
} from '../types/common';
import { PlaywrightAction } from '../types/actions';
import { SceneChangeEvent, WorldEvent } from '../types/events';
import { getCurrentTime } from '../utils/time';
import { Character, CharacterData } from './Character';
import { Scene, SceneData } from './Scene';
import { Prop, PropData } from './Prop';
import { EntityRegistry } from './EntityRegistry';

/**
 * Director metadata
 */
export interface DirectorData {
  id?: string;
  name?: string;
  storyTitle?: string;
  storyGenre?: string;
  storyTheme?: string;
  initialPhase?: NarrativePhase;
}

/**
 * Director class - Directs the narrative
 */
export class Director {
  // Identity
  readonly id: string;
  name: string;
  storyTitle: string;
  storyGenre: string;
  storyTheme: string;
  
  // Narrative state
  narrativePhase: NarrativePhase;
  plotThreads: PlotThread[];
  narrativeProgress: number; // 0-100
  lastNarration: string;
  lastActionTimestamp: number;
  characterRotation: string[]; // IDs of characters in turn order
  nextCharacterIndex: number;
  
  // Registry for entity lookup
  private registry: EntityRegistry;
  
  /**
   * Create a new director
   */
  constructor(data: DirectorData = {}) {
    // Set identity properties
    this.id = data.id || uuidv4();
    this.name = data.name || 'Narrator';
    this.storyTitle = data.storyTitle || 'Untitled Story';
    this.storyGenre = data.storyGenre || 'drama';
    this.storyTheme = data.storyTheme || 'exploration of human nature';
    
    // Set initial narrative state
    this.narrativePhase = data.initialPhase || NarrativePhase.EXPOSITION;
    this.plotThreads = [];
    this.narrativeProgress = 0;
    this.lastNarration = '';
    this.lastActionTimestamp = getCurrentTime();
    this.characterRotation = [];
    this.nextCharacterIndex = 0;
    
    // Store reference to registry
    this.registry = new EntityRegistry();
  }
  
  /**
   * Process a director action from the LLM
   */
  processAction(action: PlaywrightAction): {
    worldEvents: WorldEvent[];
    newCharacters: Character[];
    newProps: Prop[];
    newScene?: Scene;
    nextCharacterId?: string;
  } {
    const worldEvents: WorldEvent[] = [];
    const newCharacters: Character[] = [];
    const newProps: Prop[] = [];
    let newScene: Scene | undefined = undefined;
    
    // Update action timestamp
    this.lastActionTimestamp = getCurrentTime();
    
    // Process narration
    if (action.narration) {
      this.lastNarration = action.narration;
      
      // Create a global narration event
      const narrationEvent: WorldEvent = {
        id: uuidv4(),
        type: 'narration',
        description: action.narration,
        timestamp: getCurrentTime(),
        location: { x: 50, y: 50 }, // Center of scene by default
        isGlobal: true,
        involvedCharacterIds: [],
        involvedObjectIds: []
      };
      
      worldEvents.push(narrationEvent);
    }
    
    // Process scene change
    if (action.sceneChange) {
      // Create a new scene
      const sceneData: SceneData = {
        name: action.sceneChange.newSceneId,
        description: action.sceneChange.description,
        // Other scene properties would need to be set
      };
      
      newScene = new Scene(sceneData);
      
      // Create a scene change event
      const sceneChangeEvent: SceneChangeEvent = {
        id: uuidv4(),
        type: 'scene_change',
        description: `The scene changes to ${action.sceneChange.newSceneId}: ${action.sceneChange.description}`,
        timestamp: getCurrentTime(),
        location: { x: 50, y: 50 }, // Center of scene by default
        isGlobal: true,
        involvedCharacterIds: [],
        involvedObjectIds: [],
        newSceneId: action.sceneChange.newSceneId,
        transitionDescription: action.sceneChange.description
      };
      
      worldEvents.push(sceneChangeEvent);
      
      // Progress the narrative if this is a major scene change
      this.progressNarrative(10);
    }
    
    // Process new props
    if (action.newProps && action.newProps.length > 0) {
      for (const propData of action.newProps) {
        // Create the prop
        const prop = new Prop({
          type: propData.propType,
          description: propData.description,
          initialPosition: propData.position
        });
        
        newProps.push(prop);
        
        // Create a prop introduction event
        const propEvent: WorldEvent = {
          id: uuidv4(),
          type: 'prop_introduction',
          description: `A ${propData.propType} appears: ${propData.description}`,
          timestamp: getCurrentTime(),
          location: propData.position,
          isGlobal: true, // Everyone notices new props
          involvedCharacterIds: [],
          involvedObjectIds: [prop.id]
        };
        
        worldEvents.push(propEvent);
      }
    }
    
    // Process new characters
    if (action.newCharacters && action.newCharacters.length > 0) {
      for (const charData of action.newCharacters) {
        // Create the character
        const character = new Character({
          name: charData.name,
          traits: charData.traits,
          initialEmotion: charData.initialEmotion,
          initialPosition: charData.position
        }, this.registry);
        
        newCharacters.push(character);
        
        // Add to character rotation
        this.characterRotation.push(character.id);
        
        // Create a character entrance event
        const entranceEvent: WorldEvent = {
          id: uuidv4(),
          type: 'entrance',
          description: `${charData.name} enters: ${charData.description}`,
          timestamp: getCurrentTime(),
          location: charData.position,
          isGlobal: true, // Everyone notices new characters
          involvedCharacterIds: [character.id],
          involvedObjectIds: []
        };
        
        worldEvents.push(entranceEvent);
      }
    }
    
    // Determine next character to act
    let nextCharacterId: string | undefined = undefined;
    
    if (action.suggestedNextCharacterId) {
      // Use suggested character if provided
      nextCharacterId = action.suggestedNextCharacterId;
      
      // Update rotation to prioritize this character
      const index = this.characterRotation.indexOf(nextCharacterId);
      if (index !== -1) {
        this.nextCharacterIndex = index;
      }
    } else if (this.characterRotation.length > 0) {
      // Otherwise use the next character in rotation
      nextCharacterId = this.characterRotation[this.nextCharacterIndex];
      
      // Move to the next character for next time
      this.nextCharacterIndex = (this.nextCharacterIndex + 1) % this.characterRotation.length;
    }
    
    // Count this event
    this.narrativeProgress++;
    
    return {
      worldEvents,
      newCharacters,
      newProps,
      newScene,
      nextCharacterId
    };
  }
  
  /**
   * Create a new character
   */
  createCharacter(charData: Partial<CharacterData>): Character {
    // Generate a new character
    const character = new Character({
      id: uuidv4(),
      name: charData.name || 'Anonymous Character',
      traits: charData.traits || [],
      backstory: charData.backstory || '',
      initialPosition: charData.initialPosition || { x: 50, y: 50 }
    }, this.registry);
    
    // Add the character to rotation
    this.characterRotation.push(character.id);
    
    return character;
  }
  
  /**
   * Create a character
   */
  private createCharacterFromData(data: CharacterData): Character {
    const character = new Character(data, this.registry);
    this.characterRotation.push(character.id);
    return character;
  }
  
  /**
   * Remove a character from the rotation
   */
  removeCharacterFromRotation(characterId: string): boolean {
    const index = this.characterRotation.indexOf(characterId);
    
    if (index !== -1) {
      this.characterRotation.splice(index, 1);
      
      // Adjust next character index if needed
      if (this.nextCharacterIndex >= this.characterRotation.length) {
        this.nextCharacterIndex = 0;
      }
      
      return true;
    }
    
    return false;
  }
  
  /**
   * Get the next character ID in the rotation
   */
  getNextCharacterId(): string | undefined {
    if (this.characterRotation.length === 0) {
      return undefined;
    }
    
    return this.characterRotation[this.nextCharacterIndex];
  }
  
  /**
   * Advance to the next character in the rotation
   */
  advanceCharacterRotation(): void {
    if (this.characterRotation.length > 0) {
      this.nextCharacterIndex = (this.nextCharacterIndex + 1) % this.characterRotation.length;
    }
  }
  
  /**
   * Add a new plot thread
   */
  addPlotThread(description: string, involvedCharacterIds: string[] = []): void {
    const plotThread: PlotThread = {
      description,
      resolved: false,
      involvedCharacterIds: [...involvedCharacterIds]
    };
    
    this.plotThreads.push(plotThread);
  }
  
  /**
   * Resolve a plot thread
   */
  resolvePlotThread(index: number): boolean {
    if (index >= 0 && index < this.plotThreads.length) {
      this.plotThreads[index].resolved = true;
      
      // Progress the narrative when resolving plot threads
      this.progressNarrative(15);
      
      return true;
    }
    
    return false;
  }
  
  /**
   * Progress the narrative
   */
  progressNarrative(amount: number): void {
    // Update progress
    this.narrativeProgress += amount;
    
    // Cap at 100
    if (this.narrativeProgress > 100) {
      this.narrativeProgress = 100;
    }
    
    // Check for phase transitions
    this.updateNarrativePhase();
  }
  
  /**
   * Update the narrative phase based on progress
   */
  private updateNarrativePhase(): void {
    // Simple progression based on percentage
    if (this.narrativeProgress < 20 && this.narrativePhase !== NarrativePhase.EXPOSITION) {
      this.narrativePhase = NarrativePhase.EXPOSITION;
    } else if (this.narrativeProgress >= 20 && this.narrativeProgress < 50 && this.narrativePhase !== NarrativePhase.RISING_ACTION) {
      this.narrativePhase = NarrativePhase.RISING_ACTION;
    } else if (this.narrativeProgress >= 50 && this.narrativeProgress < 75 && this.narrativePhase !== NarrativePhase.CLIMAX) {
      this.narrativePhase = NarrativePhase.CLIMAX;
    } else if (this.narrativeProgress >= 75 && this.narrativeProgress < 90 && this.narrativePhase !== NarrativePhase.FALLING_ACTION) {
      this.narrativePhase = NarrativePhase.FALLING_ACTION;
    } else if (this.narrativeProgress >= 90 && this.narrativePhase !== NarrativePhase.RESOLUTION) {
      this.narrativePhase = NarrativePhase.RESOLUTION;
    }
  }
  
  /**
   * Generate a narrative context for the LLM
   */
  generateNarrativeContextForLLM(
    characters: Character[], 
    currentScene: Scene, 
    userDirection?: string
  ): string {
    // Create a summary of the current story state
    const phaseText = `NARRATIVE PHASE: ${this.narrativePhase} (progress: ${this.narrativeProgress}%)`;
    
    // Generate scene description
    const sceneText = currentScene.generateDescriptionForLLM();
    
    // Generate character summaries
    const characterSummaries = characters.map(c => c.generateSummaryForLLM()).join('\n');
    
    // Generate plot threads
    const unresolvedPlots = this.plotThreads
      .filter(p => !p.resolved)
      .map(p => p.description)
      .join('\n');
    
    // Format user direction if provided
    const directionText = userDirection 
      ? `\nAUDIENCE SUGGESTION: ${userDirection}`
      : '';
    
    return `
      STORY: "${this.storyTitle}" (${this.storyGenre})
      THEME: ${this.storyTheme}
      ${phaseText}
      
      ${sceneText}
      
      CHARACTERS:
      ${characterSummaries}
      
      ${unresolvedPlots.length > 0 ? `UNRESOLVED PLOT THREADS:\n${unresolvedPlots}` : ''}
      ${directionText}
    `.trim();
  }
} 