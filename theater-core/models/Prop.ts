/**
 * Prop - Represents an object in the scene that characters can interact with
 */
import { v4 as uuidv4 } from 'uuid';
import { Position } from '../types/common';

/**
 * Prop metadata
 */
export interface PropData {
  id?: string;              // Unique identifier
  type: string;             // Type of prop (e.g., "chair", "table", "book")
  name?: string;            // Name of the prop
  description: string;      // Description of the prop
  initialPosition: Position; // Starting position of the prop
  size?: {                  // Size of the prop
    width: number;
    height: number;
  };
  movable?: boolean;        // Whether the prop can be moved
  interactable?: boolean;   // Whether characters can interact with it
  states?: string[];        // Possible states of the prop (e.g., "open", "closed")
  initialState?: string;    // Initial state of the prop
  imageUrl?: string;        // URL to prop image
}

/**
 * Prop class - Represents an object in the scene
 */
export class Prop {
  // Identity
  readonly id: string;
  type: string;
  name: string;
  description: string;
  imageUrl?: string;
  
  // Physical properties
  position: Position;
  size: {
    width: number;
    height: number;
  };
  
  // State
  movable: boolean;
  interactable: boolean;
  states: string[];
  currentState: string;
  heldByCharacterId?: string; // ID of character currently holding the prop
  
  /**
   * Create a new prop
   */
  constructor(data: PropData) {
    // Set identity properties
    this.id = data.id || uuidv4();
    this.type = data.type;
    this.name = data.name || data.type;
    this.description = data.description;
    this.imageUrl = data.imageUrl;
    
    // Set physical properties
    this.position = { ...data.initialPosition };
    this.size = data.size || {
      width: 1,
      height: 1
    };
    
    // Set state properties
    this.movable = data.movable ?? true;
    this.interactable = data.interactable ?? true;
    this.states = [...(data.states || ['default'])];
    
    // Set initial state
    const initialState = data.initialState || this.states[0] || 'default';
    this.currentState = initialState;
  }
  
  /**
   * Move the prop to a new position
   */
  move(newPosition: Position): void {
    if (!this.movable) {
      console.warn(`Attempted to move immovable prop ${this.name}`);
      return;
    }
    
    this.position = { ...newPosition };
  }
  
  /**
   * Change the prop's state
   */
  setState(newState: string): boolean {
    // Check if the state is valid
    if (!this.states.includes(newState)) {
      console.warn(`Invalid state ${newState} for prop ${this.name}`);
      return false;
    }
    
    this.currentState = newState;
    return true;
  }
  
  /**
   * Have a character pick up the prop
   */
  pickUp(characterId: string): boolean {
    if (!this.movable) {
      console.warn(`Character ${characterId} attempted to pick up immovable prop ${this.name}`);
      return false;
    }
    
    this.heldByCharacterId = characterId;
    return true;
  }
  
  /**
   * Have a character drop the prop
   */
  drop(droppedPosition: Position): boolean {
    if (!this.heldByCharacterId) {
      console.warn(`Attempted to drop prop ${this.name} that is not held by anyone`);
      return false;
    }
    
    this.heldByCharacterId = undefined;
    this.position = { ...droppedPosition };
    return true;
  }
  
  /**
   * Check if the prop is currently being held
   */
  isHeld(): boolean {
    return this.heldByCharacterId !== undefined;
  }
  
  /**
   * Check if a character can interact with the prop
   */
  canInteract(): boolean {
    return this.interactable;
  }
  
  /**
   * Check if the prop's state can be changed to a specific state
   */
  canChangeStateTo(targetState: string): boolean {
    return this.states.includes(targetState);
  }
  
  /**
   * Generate a description of the prop for the LLM
   */
  generateDescriptionForLLM(): string {
    const stateText = this.states.length > 1 ? ` Currently ${this.currentState}.` : '';
    const heldText = this.isHeld() ? ` Held by a character.` : '';
    
    return `${this.name} (${this.type}): ${this.description}${stateText}${heldText}`;
  }
  
  /**
   * Create an obstacle from this prop (for collision detection)
   */
  toObstacle(): {
    position: Position;
    size: { width: number; height: number };
    description: string;
    blocksSight: boolean;
    blocksMovement: boolean;
  } {
    // Determine if the prop blocks sight based on its size
    const blocksSight = this.size.width > 3 || this.size.height > 3;
    
    return {
      position: this.position,
      size: this.size,
      description: this.description,
      blocksSight,
      blocksMovement: !this.isHeld() // Only blocks movement if not held
    };
  }
} 