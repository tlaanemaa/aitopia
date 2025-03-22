import { Entity } from "../models/Entity";
import { Character } from "../models/Character";

export class EntityRegistry {
    private entities: Map<string, Entity> = new Map();

    register(entity: Entity): void {
        this.entities.set(entity.id, entity);
    }

    deregister(entityId: string): void {
        this.entities.delete(entityId);
    }

    getEntity(entityId: string): Entity | undefined {
        return this.entities.get(entityId);
    }

    getEntities(): Entity[] {
        return Array.from(this.entities.values());
    }

    getCharacters(): Character[] {
        return Array.from(this.entities.values()).filter(entity => entity instanceof Character);
    }

    getCharacterNames(): string[] {
        return this.getCharacters().map(character => character.name);
    }

    getCharactersByName(name: string): Character[] {
        return this.getCharacters().filter(character => character.name === name);
    }
}
