/**
 * Creates a consistent hash number from a string using djb2 algorithm
 * @param str The string to hash
 * @param range Optional range for the hash (will return a number between 0 and range-1)
 */
export function hashString(str: string, range?: number): number {
  // Using djb2 hash algorithm
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i);
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  hash = Math.abs(hash);
  
  // If range is provided, constrain the hash to that range
  if (range !== undefined) {
    return hash % range;
  }
  
  return hash;
}

/**
 * Picks an item from an array using a string as seed
 * @param arr The array to pick from
 * @param seed The string to use as seed
 */
export function pickFromArray<T>(arr: readonly T[], seed: string): T {
  return arr[hashString(seed, arr.length)];
} 