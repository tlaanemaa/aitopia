import { Position } from '../events/types';

/**
 * Calculate the Euclidean distance between two positions
 */
export function calculateDistance(pos1: Position, pos2: Position): number {
  const dx = pos2.x - pos1.x;
  const dy = pos2.y - pos1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Check if a position is within a given range of another position
 */
export function isInRange(pos1: Position, pos2: Position, range: number): boolean {
  return calculateDistance(pos1, pos2) <= range;
}

/**
 * Wait for a given number of milliseconds
 */
export function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Position to string
 */
export function positionToString(position: Position): string {
  return `x=${position.x}, y=${position.y}`;
}
