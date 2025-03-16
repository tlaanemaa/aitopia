/**
 * ExperienceFactory - Factory for creating and configuring interactive experiences
 */
import { v4 as uuidv4 } from 'uuid';
import { WorldService } from './WorldService';
import { Orchestrator, OrchestratorConfig } from './Orchestrator';
import { CharacterArchetype, Emotion, Position, NarrativePhase } from '../types/common';
import { LLMConfig } from './LLMService';
import { Scene } from '../models/Scene';
import { Character } from '../models/Character';
import { Prop } from '../models/Prop';
import { Director } from '../models/Director';
import { EntityRegistry } from '../models/EntityRegistry';

/**
 * Configuration for a character in an experience
 */
export interface CharacterConfig {
  name: string;
  archetype?: CharacterArchetype;
  traits?: string[];
  backstory?: string;
  appearance?: string;
  goal?: string;
  initialEmotion?: Emotion;
  initialPosition?: Position;
  avatarUrl?: string;
}

/**
 * Configuration for a scene in an experience
 */
export interface SceneConfig {
  name: string;
  description: string;
  mood?: string;
  time?: string;
  width?: number;
  height?: number;
  backgroundImageUrl?: string;
}

/**
 * Configuration for a prop in an experience
 */
export interface PropConfig {
  type: string;
  name?: string;
  description: string;
  position: Position;
  size?: { width: number; height: number };
  movable?: boolean;
  interactable?: boolean;
  states?: string[];
  initialState?: string;
  imageUrl?: string;
}

/**
 * Configuration for an interactive experience
 */
export interface ExperienceConfig {
  title: string;
  genre?: string;
  theme?: string;
  scene: SceneConfig;
  initialCharacters?: CharacterConfig[];
  initialProps?: PropConfig[];
  llm: LLMConfig;
  autoAdvance?: boolean;
  turnDelay?: number;
  maxConsecutiveTurns?: number;
}

/**
 * Factory for creating interactive experiences
 */
export class ExperienceFactory {
  /**
   * Create a new interactive experience
   */
  static create(config: ExperienceConfig): {
    orchestrator: Orchestrator;
    experienceId: string;
    title: string;
  } {
    const experienceId = uuidv4();
    
    // Create scene
    const scene = new Scene({
      name: config.scene.name,
      description: config.scene.description,
      mood: config.scene.mood,
      time: config.scene.time,
      width: config.scene.width,
      height: config.scene.height,
      backgroundImageUrl: config.scene.backgroundImageUrl
    });
    
    // Create a shared entity registry
    const registry = new EntityRegistry();
    
    // Create characters
    const characters: Character[] = [];
    if (config.initialCharacters) {
      for (const charConfig of config.initialCharacters) {
        characters.push(new Character({
          name: charConfig.name,
          traits: charConfig.traits || [],
          archetype: charConfig.archetype,
          backstory: charConfig.backstory,
          appearance: charConfig.appearance,
          goal: charConfig.goal,
          initialEmotion: charConfig.initialEmotion,
          initialPosition: charConfig.initialPosition,
          avatarUrl: charConfig.avatarUrl
        }, registry)); // Share the registry across all characters
      }
    }
    
    // Create props
    const props: Prop[] = [];
    if (config.initialProps) {
      for (const propConfig of config.initialProps) {
        props.push(new Prop({
          type: propConfig.type,
          name: propConfig.name || propConfig.type,
          description: propConfig.description,
          initialPosition: propConfig.position,
          size: propConfig.size,
          movable: propConfig.movable,
          interactable: propConfig.interactable,
          states: propConfig.states,
          initialState: propConfig.initialState,
          imageUrl: propConfig.imageUrl
        }));
      }
    }
    
    // Create director with appropriate settings
    const director = new Director({
      name: 'Director',
      storyTitle: config.title,
      storyGenre: config.genre,
      storyTheme: config.theme,
      initialPhase: NarrativePhase.EXPOSITION
    });
    
    // Create world service
    const world = new WorldService({
      registry,
      initialScene: scene,
      initialCharacters: characters,
      initialProps: props,
      director
    });
    
    // Create orchestrator service
    const orchestrator = new Orchestrator(
      world,
      {
        llmConfig: config.llm,
        autoAdvance: config.autoAdvance !== false, 
        turnDelay: config.turnDelay || 1000, 
        maxConsecutiveTurns: config.maxConsecutiveTurns || 10
      }
    );
    
    return {
      orchestrator,
      experienceId,
      title: config.title
    };
  }
} 