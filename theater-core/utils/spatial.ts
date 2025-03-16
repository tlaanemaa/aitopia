/**
 * Spatial utility functions for the theater-core domain
 */
import { Position, Obstacle } from '../types/common';

/**
 * Calculate the Euclidean distance between two positions
 */
export function calculateDistance(pos1: Position, pos2: Position): number {
  const dx = pos2.x - pos1.x;
  const dy = pos2.y - pos1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Check if a line of sight is blocked by obstacles
 */
export function isLineOfSightBlocked(
  fromPos: Position,
  toPos: Position,
  obstacles: Obstacle[]
): boolean {
  // Only consider obstacles that block sight
  const sightBlockers = obstacles.filter(obstacle => obstacle.blocksSight);
  
  // If no sight blockers, line of sight is clear
  if (sightBlockers.length === 0) return false;
  
  // For each obstacle, check if the line intersects with it
  for (const obstacle of sightBlockers) {
    if (lineIntersectsRectangle(fromPos, toPos, obstacle)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Check if a path is blocked by obstacles
 */
export function isPathBlocked(
  fromPos: Position,
  toPos: Position,
  obstacles: Obstacle[]
): boolean {
  // Only consider obstacles that block movement
  const movementBlockers = obstacles.filter(obstacle => obstacle.blocksMovement);
  
  // If no movement blockers, path is clear
  if (movementBlockers.length === 0) return false;
  
  // For each obstacle, check if the line intersects with it
  for (const obstacle of movementBlockers) {
    if (lineIntersectsRectangle(fromPos, toPos, obstacle)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Check if a line intersects with a rectangular obstacle
 */
function lineIntersectsRectangle(
  lineStart: Position,
  lineEnd: Position,
  obstacle: Obstacle
): boolean {
  const rect = {
    left: obstacle.position.x - obstacle.size.width / 2,
    right: obstacle.position.x + obstacle.size.width / 2,
    top: obstacle.position.y - obstacle.size.height / 2,
    bottom: obstacle.position.y + obstacle.size.height / 2
  };
  
  // Check if line intersects any of the rectangle's edges
  return (
    lineIntersectsLine(
      lineStart, lineEnd,
      { x: rect.left, y: rect.top }, { x: rect.right, y: rect.top }
    ) ||
    lineIntersectsLine(
      lineStart, lineEnd,
      { x: rect.right, y: rect.top }, { x: rect.right, y: rect.bottom }
    ) ||
    lineIntersectsLine(
      lineStart, lineEnd,
      { x: rect.right, y: rect.bottom }, { x: rect.left, y: rect.bottom }
    ) ||
    lineIntersectsLine(
      lineStart, lineEnd,
      { x: rect.left, y: rect.bottom }, { x: rect.left, y: rect.top }
    )
  );
}

/**
 * Check if two line segments intersect
 */
function lineIntersectsLine(
  line1Start: Position,
  line1End: Position,
  line2Start: Position,
  line2End: Position
): boolean {
  // Calculate direction vectors
  const d1x = line1End.x - line1Start.x;
  const d1y = line1End.y - line1Start.y;
  const d2x = line2End.x - line2Start.x;
  const d2y = line2End.y - line2Start.y;
  
  // Calculate the determinant
  const det = d1x * d2y - d1y * d2x;
  
  // If determinant is zero, lines are parallel
  if (det === 0) return false;
  
  // Calculate parameter values for intersection point
  const dx = line2Start.x - line1Start.x;
  const dy = line2Start.y - line1Start.y;
  
  const t1 = (dx * d2y - dy * d2x) / det;
  const t2 = (dx * d1y - dy * d1x) / det;
  
  // Check if intersection point lies on both line segments
  return t1 >= 0 && t1 <= 1 && t2 >= 0 && t2 <= 1;
}

/**
 * Find a safe position for a character that doesn't collide with obstacles
 */
export function findSafePosition(
  targetPos: Position,
  obstacles: Obstacle[],
  characterRadius: number = 1
): Position {
  // If no obstacles, target position is safe
  if (obstacles.length === 0) return targetPos;
  
  // Check if target position collides with any obstacle
  if (!isPositionSafe(targetPos, obstacles, characterRadius)) {
    // Try positions in expanding radius around target
    const maxAttempts = 20;
    const radiusStep = 5;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const radius = attempt * radiusStep;
      const angle = Math.random() * 2 * Math.PI;
      
      const candidatePos = {
        x: targetPos.x + radius * Math.cos(angle),
        y: targetPos.y + radius * Math.sin(angle)
      };
      
      if (isPositionSafe(candidatePos, obstacles, characterRadius)) {
        return candidatePos;
      }
    }
    
    // If no safe position found, return original but with warning
    console.warn('Could not find safe position, returning original position');
    return targetPos;
  }
  
  return targetPos;
}

/**
 * Check if a position is safe (doesn't collide with obstacles)
 */
function isPositionSafe(
  position: Position,
  obstacles: Obstacle[],
  characterRadius: number
): boolean {
  // Only consider obstacles that block movement
  const movementBlockers = obstacles.filter(obstacle => obstacle.blocksMovement);
  
  // If no movement blockers, position is safe
  if (movementBlockers.length === 0) return true;
  
  // Check if position is too close to any obstacle
  for (const obstacle of movementBlockers) {
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