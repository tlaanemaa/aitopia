import { EntityRegistry } from "../service/EntityRegistry";
import { EnrichedEvent, Position } from "./types";

export class EventSanitizer {
    private readonly MAX_TEXT_LENGTH = 200;
    private readonly COLLISION_RADIUS = 5;

    constructor(private entityRegistry: EntityRegistry) { }

    /**
     * Sanitizes a list of events.
     */
    public sanitize(events: EnrichedEvent[]): EnrichedEvent[] {
        return events.map(event => {
            const otherEvents = events.filter(e => e !== event);
            const otherEventPositions = [
                ...otherEvents.filter(e => e.type === 'character_enter').map(e => e.position),
                ...otherEvents.filter(e => e.type === 'movement').map(e => e.destination),
            ];

            switch (event.type) {
                case 'character_enter':
                    event.position = this.sanitizePosition(event.position, otherEventPositions);
                    break;
                case 'movement':
                    event.destination = this.sanitizePosition(event.destination, otherEventPositions, event.sourceId);
                    break;
                case 'action':
                    event.action = this.sanitizeText(event.action);
                    break;
                case 'thought':
                    event.content = this.sanitizeText(event.content);
                    break;
                case 'generic':
                    event.description = this.sanitizeText(event.description);
                    break;
                case 'scene_change':
                    event.newSceneDescription = this.sanitizeText(event.newSceneDescription);
                    break;
            }
            return event;
        });
    }

    /**
     * Sanitizes the text of an event to ensure it is not too long.
     */
    private sanitizeText(text: string): string {
        return text.length > this.MAX_TEXT_LENGTH
            ? text.slice(0, this.MAX_TEXT_LENGTH) + '...'
            : text;
    }

    /**
     * Sanitizes the position of an event to ensure it is not too close to other characters.
     */
    private sanitizePosition(position: Position, otherPoints: Position[], entityId?: string): Position {
        // Create a new position object to avoid modifying the read-only one
        const newPosition = { ...position };

        // Clamp the position to the grid
        newPosition.x = Math.max(0, Math.min(newPosition.x, 100));
        newPosition.y = Math.max(0, Math.min(newPosition.y, 100));

        // Find other characters to avoid collisions with
        const otherEntities = [
            ...this.entityRegistry.getCharacters().filter(c => !entityId || c.id !== entityId).map(c => c.position),
            ...otherPoints,
        ];

        // Define collision radius (in 0-100 coordinate space) and max attempts
        const MAX_ATTEMPTS = 10;
        for (let attempts = 0; attempts < MAX_ATTEMPTS; attempts++) {
            let hasCollision = false;

            // Find screen boundaries to avoid collisions with
            const screenBoundaries = [
                { x: -this.COLLISION_RADIUS, y: newPosition.y }, // Left wall
                { x: 100 + this.COLLISION_RADIUS, y: newPosition.y }, // Right wall
                { x: newPosition.x, y: -this.COLLISION_RADIUS }, // Top wall
                { x: newPosition.x, y: 100 + this.COLLISION_RADIUS }, // Bottom wall
            ];

            // Check collisions with all entities (real and virtual)
            for (const other of [...otherEntities, ...screenBoundaries]) {
                // Calculate distance between characters
                const dx = newPosition.x - other.x;
                const dy = newPosition.y - other.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                // If characters are too close
                if (distance < this.COLLISION_RADIUS) {
                    hasCollision = true;

                    let vectorX: number;
                    let vectorY: number;

                    if (distance === 0) {
                        // If characters are exactly on top of each other, generate random direction
                        const angle = Math.random() * Math.PI * 2;
                        vectorX = Math.cos(angle);
                        vectorY = Math.sin(angle);
                    } else {
                        // Use normalized vector away from other character
                        vectorX = dx / distance;
                        vectorY = dy / distance;
                    }

                    // Calculate how far to push to get just beyond collision radius
                    const pushDistance = this.COLLISION_RADIUS - distance;

                    // Move in the calculated direction
                    newPosition.x += vectorX * pushDistance;
                    newPosition.y += vectorY * pushDistance;
                }
            }

            // If no collisions found, we're done
            if (!hasCollision) break;
        }

        return newPosition;
    }
}
