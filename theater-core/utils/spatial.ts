import { Position } from '../types/events';

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