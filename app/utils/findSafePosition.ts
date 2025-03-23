import {
  CHARACTER_WIDTH,
  CHARACTER_HEIGHT,
  SCREEN_MARGIN,
} from "../constants";

/**
 * Calculates distance between two points in pixel space
 */
function getPixelDistance(
  x1: number,
  y1: number,
  x2: number,
  y2: number
): number {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

/**
 * Converts percentage position to pixel position
 */
function percentToPixel(
  percent: number,
  dimension: number,
  margin: number
): number {
  return (percent / 100) * (dimension - 2 * margin) + margin;
}

/**
 * Converts pixel position to percentage position
 */
function pixelToPercent(
  pixel: number,
  dimension: number,
  margin: number
): number {
  return ((pixel - margin) / (dimension - 2 * margin)) * 100;
}

/**
 * Finds a safe position for a character that doesn't collide with existing characters
 * @param targetX The desired X position (0-100)
 * @param targetY The desired Y position (0-100)
 * @param existingObjects Array of objects with positionX and positionY properties
 * @returns [safeX, safeY] coordinates in the 0-100 range
 */
export function findSafePosition(
  targetX: number,
  targetY: number,
  existingObjects: Array<{ positionX: number; positionY: number }>,
  recursionDepth = 0
): [number, number] {
  // Prevent infinite recursion
  if (recursionDepth > 5) {
    return [targetX, targetY];
  }

  // If no existing objects, return the target position
  if (existingObjects.length === 0) {
    return [targetX, targetY];
  }

  // Get screen dimensions (with fallbacks for SSR)
  const screenWidth = typeof window !== "undefined" ? window.innerWidth : 1000;
  const screenHeight = typeof window !== "undefined" ? window.innerHeight : 800;

  // Minimum distance between characters in pixels
  const MIN_DISTANCE_PX = Math.max(CHARACTER_WIDTH, CHARACTER_HEIGHT) * 1.0;

  // Convert percentage positions to pixel positions
  const targetPixelX = percentToPixel(targetX, screenWidth, SCREEN_MARGIN);
  const targetPixelY = percentToPixel(targetY, screenHeight, SCREEN_MARGIN);

  // Find the closest colliding character
  let closestObj = null;
  let closestDistance = Infinity;

  for (const obj of existingObjects) {
    const objPixelX = percentToPixel(obj.positionX, screenWidth, SCREEN_MARGIN);
    const objPixelY = percentToPixel(
      obj.positionY,
      screenHeight,
      SCREEN_MARGIN
    );

    const distance = getPixelDistance(
      targetPixelX,
      targetPixelY,
      objPixelX,
      objPixelY
    );

    if (distance < MIN_DISTANCE_PX && distance < closestDistance) {
      closestDistance = distance;
      closestObj = obj;
    }
  }

  // If no collision, return the target position
  if (!closestObj) {
    return [targetX, targetY];
  }

  // Calculate vector away from the closest object
  const closestObjPixelX = percentToPixel(
    closestObj.positionX,
    screenWidth,
    SCREEN_MARGIN
  );
  const closestObjPixelY = percentToPixel(
    closestObj.positionY,
    screenHeight,
    SCREEN_MARGIN
  );

  let vectorX = targetPixelX - closestObjPixelX;
  let vectorY = targetPixelY - closestObjPixelY;

  // If perfect overlap, generate random vector
  if (closestDistance === 0) {
    const angle = Math.random() * Math.PI * 2;
    vectorX = Math.cos(angle);
    vectorY = Math.sin(angle);
  } else {
    // Normalize the vector
    const magnitude = Math.sqrt(vectorX * vectorX + vectorY * vectorY);
    vectorX = vectorX / magnitude;
    vectorY = vectorY / magnitude;
  }

  // Calculate how far to push (in pixels)
  const pushDistance = MIN_DISTANCE_PX - closestDistance;

  // Calculate new position in pixels
  const newPixelX = targetPixelX + vectorX * pushDistance;
  const newPixelY = targetPixelY + vectorY * pushDistance;

  // Convert back to percentage and clamp
  const newX = Math.max(
    0,
    Math.min(100, pixelToPercent(newPixelX, screenWidth, SCREEN_MARGIN))
  );
  const newY = Math.max(
    0,
    Math.min(100, pixelToPercent(newPixelY, screenHeight, SCREEN_MARGIN))
  );

  // Recursively check the new position for collisions
  return findSafePosition(newX, newY, existingObjects, recursionDepth + 1);
}
