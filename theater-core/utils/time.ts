/**
 * Time utility functions for the theater-core domain
 */

/**
 * Get the current timestamp in milliseconds
 */
export function getCurrentTime(): number {
  return Date.now();
}

/**
 * Format a relative time (e.g., "2 minutes ago")
 */
export function formatRelativeTime(timestamp: number): string {
  const now = getCurrentTime();
  const diffInMs = now - timestamp;
  
  // Convert to seconds
  const diffInSeconds = Math.floor(diffInMs / 1000);
  
  if (diffInSeconds < 5) {
    return 'just now';
  } else if (diffInSeconds < 60) {
    return `${diffInSeconds} seconds ago`;
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  }
}

/**
 * Calculate story time (can be different from real time)
 * This allows for dramatic compression or extension of time
 */
export function calculateStoryTime(
  realTimeDelta: number,
  timeCompressionFactor: number = 1.0
): number {
  return realTimeDelta * timeCompressionFactor;
}

/**
 * Format a timestamp as a story-friendly time (e.g., "morning", "evening")
 */
export function formatStoryTime(
  storyTimeOfDay: number // 0-24 representing hours in the day
): string {
  if (storyTimeOfDay >= 5 && storyTimeOfDay < 12) {
    return 'morning';
  } else if (storyTimeOfDay >= 12 && storyTimeOfDay < 17) {
    return 'afternoon';
  } else if (storyTimeOfDay >= 17 && storyTimeOfDay < 21) {
    return 'evening';
  } else {
    return 'night';
  }
}

/**
 * Check if an event is recent (within specified time window)
 */
export function isEventRecent(
  eventTimestamp: number,
  timeWindowMs: number = 5 * 60 * 1000 // Default: 5 minutes
): boolean {
  const now = getCurrentTime();
  return (now - eventTimestamp) <= timeWindowMs;
} 