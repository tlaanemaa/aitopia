/**
 * Handles collision avoidance for objects in a 2D space
 * All coordinates are expected to be in the range 0-100
 */
export class Collider {
  private characterSizePx: number;
  private minMarginPx: number;
  private screenWidth: number;
  private screenHeight: number;

  constructor(
    characterSizePx = 64,
    minMarginPx = 150,
    screenWidth?: number,
    screenHeight?: number
  ) {
    this.characterSizePx = characterSizePx;
    this.minMarginPx = minMarginPx;
    this.screenWidth = screenWidth || (typeof window !== 'undefined' ? window.innerWidth : 1000);
    this.screenHeight = screenHeight || (typeof window !== 'undefined' ? window.innerHeight : 800);
  }

  /**
   * Updates the screen dimensions
   */
  updateScreenSize(width: number, height: number) {
    this.screenWidth = width;
    this.screenHeight = height;
  }

  /**
   * Gets the character size as a percentage of the available screen space
   */
  private getCharacterSizePercentage(): { width: number; height: number } {
    const availableWidth = this.screenWidth - 2 * this.minMarginPx;
    const availableHeight = this.screenHeight - 2 * this.minMarginPx;

    return {
      width: (this.characterSizePx / availableWidth) * 100,
      height: (this.characterSizePx / availableHeight) * 100,
    };
  }

  /**
   * Gets the minimum distance between objects as a percentage
   */
  private getMinDistancePercentage(): number {
    const availableWidth = this.screenWidth - 2 * this.minMarginPx;
    const availableHeight = this.screenHeight - 2 * this.minMarginPx;
    
    const marginWidth = (this.minMarginPx / availableWidth) * 100;
    const marginHeight = (this.minMarginPx / availableHeight) * 100;
    
    return Math.max(marginWidth, marginHeight);
  }

  /**
   * Calculates the distance between two points
   */
  private getDistance(x1: number, y1: number, x2: number, y2: number): number {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
  }

  /**
   * Finds a safe position for an object that doesn't collide with existing objects
   * @param targetX The desired X position (0-100)
   * @param targetY The desired Y position (0-100)
   * @param existingObjects Array of objects with positionX and positionY properties
   * @param maxAttempts Maximum number of attempts to find a safe position
   * @returns [safeX, safeY] coordinates
   */
  findSafePosition(
    targetX: number,
    targetY: number,
    existingObjects: Array<{ positionX: number; positionY: number }>,
    maxAttempts = 8
  ): [number, number] {
    const { width, height } = this.getCharacterSizePercentage();
    const minDistance = this.getMinDistancePercentage();
    
    // Clamp the target position to screen bounds
    targetX = Math.max(width, Math.min(100 - width, targetX));
    targetY = Math.max(height, Math.min(100 - height, targetY));

    // If no objects or no collisions, return the target position
    if (existingObjects.length === 0 || 
        !existingObjects.some(obj => 
          this.getDistance(targetX, targetY, obj.positionX, obj.positionY) < minDistance
        )) {
      return [targetX, targetY];
    }

    // Find the closest object and the vector to it
    let closestDist = Infinity;
    let closestVector = [0, 0];
    
    for (const obj of existingObjects) {
      const dx = targetX - obj.positionX;
      const dy = targetY - obj.positionY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < closestDist) {
        closestDist = dist;
        closestVector = [dx, dy];
      }
    }

    // If perfect overlap, generate random vector
    if (closestDist === 0) {
      const angle = Math.random() * Math.PI * 2;
      closestVector = [Math.cos(angle), Math.sin(angle)];
    } else {
      // Normalize vector
      const magnitude = Math.sqrt(closestVector[0] * closestVector[0] + closestVector[1] * closestVector[1]);
      closestVector = [closestVector[0] / magnitude, closestVector[1] / magnitude];
    }

    // Try positions along the vector with increasing distances
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const pushDistance = (minDistance - closestDist) * attempt / 2;
      const newX = targetX + closestVector[0] * pushDistance;
      const newY = targetY + closestVector[1] * pushDistance;
      
      // Clamp to screen bounds
      const clampedX = Math.max(width, Math.min(100 - width, newX));
      const clampedY = Math.max(height, Math.min(100 - height, newY));
      
      // Check if this position is safe
      if (!existingObjects.some(obj => 
        this.getDistance(clampedX, clampedY, obj.positionX, obj.positionY) < minDistance
      )) {
        return [clampedX, clampedY];
      }
    }

    // If we couldn't find a safe position, try a grid search
    const gridSize = minDistance / 2;
    for (let x = width; x <= 100 - width; x += gridSize) {
      for (let y = height; y <= 100 - height; y += gridSize) {
        if (!existingObjects.some(obj => 
          this.getDistance(x, y, obj.positionX, obj.positionY) < minDistance
        )) {
          return [x, y];
        }
      }
    }

    // Last resort: return the original position clamped to bounds
    return [targetX, targetY];
  }
}

// Export a singleton instance with default settings
export const collider = new Collider(); 