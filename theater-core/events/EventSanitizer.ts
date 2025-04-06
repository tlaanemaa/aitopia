import { EntityRegistry } from "../service/EntityRegistry";
import { EnrichedCharacterEvent, EnrichedDirectorEvent, EnrichedEvent, Position } from "./types";

const round = (value: number, places: number = 2) => Math.round(value * 10 ** places) / 10 ** places;

export class EventSanitizer {
    private readonly COLLISION_RADIUS = 10;

    constructor(private entityRegistry: EntityRegistry) { }

    /**
     * Sanitizes a list of events.
     */
    public sanitize(events: EnrichedEvent[]): EnrichedEvent[] {
        return events.map(event => {
            switch (event.type) {
                case 'director_event':
                    return this.sanitizeDirectorEvent(event);
                case 'character_event':
                    return this.sanitizeCharacterEvent(event);
                default:
                    return event;
            }
        });
    }

    /**
     * Sanitizes a director event
     */
    private sanitizeDirectorEvent(event: EnrichedDirectorEvent): EnrichedDirectorEvent {
        // Create a map of all new character positions, taking the last position for each character
        const newPositions = Object.entries([
            ...Object.entries(event.newCharacters ?? {}).map(([name, c]) => ({ name, position: c.position })),
        ].reduce(
            (acc, { name, position }) => ({ ...acc, [name]: position }),
            {} as Record<string, Position>
        ));

        if (event.newCharacters) {
            event.newCharacters = Object.fromEntries(
                Object.entries(event.newCharacters).map(([name, c]) => {
                    const otherCharacterPositions = newPositions.filter(([otherName]) => otherName !== name).map(([, position]) => position);
                    return [name, {
                        ...c,
                        position: this.sanitizePosition(c.position, otherCharacterPositions),
                    }];
                })
            );
        }

        // Sanitize text lengths
        if (event.newSceneDescription) {
            event.newSceneDescription = this.sanitizeText(event.newSceneDescription, 200);
        }

        if (event.genericWorldEvent) {
            event.genericWorldEvent = this.sanitizeText(event.genericWorldEvent, 200);
        }

        return event;
    }

    /**
     * Sanitizes a character event
     */
    private sanitizeCharacterEvent(
        event: EnrichedCharacterEvent,
        otherPositions: Position[] = []
    ): EnrichedCharacterEvent {
        if (event.destination) {
            event.destination = this.sanitizePosition(event.destination, otherPositions, event.name);
        }
        if (event.speech) {
            event.speech = this.sanitizeText(event.speech, 200);
        }
        if (event.thought) {
            event.thought = this.sanitizeText(event.thought, 200);
        }
        return event;
    }

    /**
     * Sanitizes the text of an event to ensure it is not too long.
     */
    private sanitizeText(text: string, maxLength: number): string {
        return text.length > maxLength
            ? text.slice(0, maxLength) + '...'
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
        const MAX_ATTEMPTS = 50;
        for (let attempts = 0; attempts < MAX_ATTEMPTS; attempts++) {
            let hasCollision = false;

            // Jiggle the position a bit
            newPosition.x += Math.random() * 2 - 1;
            newPosition.y += Math.random() * 2 - 1;

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

        newPosition.x = Math.max(0, Math.min(round(newPosition.x, 2), 100));
        newPosition.y = Math.max(0, Math.min(round(newPosition.y, 2), 100));
        return newPosition;
    }
}
