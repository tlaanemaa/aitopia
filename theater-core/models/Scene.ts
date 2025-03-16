/**
 * Scene - Represents a setting where the story takes place
 */
import { v4 as uuidv4 } from 'uuid';
import { Obstacle, Position } from '../types/common';
import { findSafePosition, isLineOfSightBlocked, isPathBlocked } from '../utils/spatial';

/**
 * Scene metadata
 */
export interface SceneData {
  id?: string;              // Unique identifier
  name: string;             // Scene name
  description: string;      // Description of the scene
  mood?: string;            // Emotional tone of the scene
  time?: string;            // Time of day
  width?: number;           // Scene width
  height?: number;          // Scene height
  obstacles?: Obstacle[];   // Objects that block movement or sight
  entrancePoints?: Position[]; // Points where characters can enter the scene
  backgroundImageUrl?: string; // URL to background image
}

/**
 * Scene class - Represents the current setting
 */
export class Scene {
  // Identity
  readonly id: string;
  name: string;
  description: string;
  mood: string;
  time: string;
  
  // Physical properties
  width: number;
  height: number;
  obstacles: Obstacle[];
  entrancePoints: Position[];
  backgroundImageUrl?: string;
  
  /**
   * Create a new scene
   */
  constructor(data: SceneData) {
    // Set identity properties
    this.id = data.id || uuidv4();
    this.name = data.name;
    this.description = data.description;
    this.mood = data.mood || 'neutral';
    this.time = data.time || 'day';
    
    // Set physical properties
    this.width = data.width || 100;
    this.height = data.height || 100;
    this.obstacles = [...(data.obstacles || [])];
    this.entrancePoints = [...(data.entrancePoints || [
      { x: 10, y: 50 }, // Default left entrance
      { x: 90, y: 50 }, // Default right entrance
    ])];
    this.backgroundImageUrl = data.backgroundImageUrl;
  }
  
  /**
   * Check if a position is within scene boundaries
   */
  isPositionInBounds(position: Position): boolean {
    return (
      position.x >= 0 && 
      position.x <= this.width &&
      position.y >= 0 && 
      position.y <= this.height
    );
  }
  
  /**
   * Check if a position is valid (in bounds and not blocked by obstacles)
   */
  isPositionValid(position: Position, characterRadius: number = 1): boolean {
    // First check if position is in bounds
    if (!this.isPositionInBounds(position)) {
      return false;
    }
    
    // Then check if position is blocked by any obstacle
    for (const obstacle of this.obstacles) {
      if (!obstacle.blocksMovement) continue;
      
      // Simple rectangle collision check
      const minDistX = obstacle.size.width / 2 + characterRadius;
      const minDistY = obstacle.size.height / 2 + characterRadius;
      
      const dx = Math.abs(position.x - obstacle.position.x);
      const dy = Math.abs(position.y - obstacle.position.y);
      
      if (dx < minDistX && dy < minDistY) {
        return false;
      }
    }
    
    return true;
  }
  
  /**
   * Check if there's a clear path between two positions
   */
  isPathClear(start: Position, end: Position): boolean {
    return !isPathBlocked(start, end, this.obstacles);
  }
  
  /**
   * Check if there's a clear line of sight between two positions
   */
  hasLineOfSight(observer: Position, target: Position): boolean {
    return !isLineOfSightBlocked(observer, target, this.obstacles);
  }
  
  /**
   * Find a safe position for a character to move to
   */
  findSafePosition(targetPos: Position, characterRadius: number = 1): Position {
    // First try the target position
    if (this.isPositionValid(targetPos, characterRadius)) {
      return targetPos;
    }
    
    // Otherwise find a safe position near the target
    return findSafePosition(targetPos, this.obstacles, characterRadius);
  }
  
  /**
   * Get a random valid position in the scene
   */
  getRandomPosition(characterRadius: number = 1): Position {
    // Try up to 20 times to find a valid random position
    for (let i = 0; i < 20; i++) {
      const x = Math.random() * this.width;
      const y = Math.random() * this.height;
      const pos = { x, y };
      
      if (this.isPositionValid(pos, characterRadius)) {
        return pos;
      }
    }
    
    // If all random attempts fail, use the center of the scene
    return this.findSafePosition({ x: this.width / 2, y: this.height / 2 }, characterRadius);
  }
  
  /**
   * Get a valid entrance position for a new character
   */
  getEntrancePosition(): Position {
    // If there are defined entrance points, use one of those
    if (this.entrancePoints.length > 0) {
      const randomIndex = Math.floor(Math.random() * this.entrancePoints.length);
      return { ...this.entrancePoints[randomIndex] };
    }
    
    // Otherwise, use a position along the edge
    const side = Math.floor(Math.random() * 4); // 0: top, 1: right, 2: bottom, 3: left
    
    switch (side) {
      case 0: // Top
        return { x: Math.random() * this.width, y: 0 };
      case 1: // Right
        return { x: this.width, y: Math.random() * this.height };
      case 2: // Bottom
        return { x: Math.random() * this.width, y: this.height };
      case 3: // Left
        return { x: 0, y: Math.random() * this.height };
      default:
        return { x: 0, y: 0 };
    }
  }
  
  /**
   * Add an obstacle to the scene
   */
  addObstacle(obstacle: Obstacle): void {
    this.obstacles.push(obstacle);
  }
  
  /**
   * Remove an obstacle from the scene
   */
  removeObstacle(obstacleIndex: number): void {
    if (obstacleIndex >= 0 && obstacleIndex < this.obstacles.length) {
      this.obstacles.splice(obstacleIndex, 1);
    }
  }
  
  /**
   * Generate a description of the scene for the LLM
   */
  generateDescriptionForLLM(): string {
    const obstacleDescs = this.obstacles.map(o => o.description).join(', ');
    
    return `
      SCENE: ${this.name}
      DESCRIPTION: ${this.description}
      MOOD: ${this.mood}
      TIME: ${this.time}
      ${this.obstacles.length > 0 ? `NOTABLE FEATURES: ${obstacleDescs}` : ''}
    `.trim();
  }
} 