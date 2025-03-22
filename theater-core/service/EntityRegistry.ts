import { Entity } from "../models/Entity";
import { Character } from "../models/Character";

export class EntityRegistry {
    private entities: Record<string, Entity> = {};

    register(entity: Entity): void {
        this.entities[entity.id] = entity;
    }

    deregister(entityId: string): void {
        delete this.entities[entityId];
    }

    getEntity(entityId: string): Entity | undefined {
        return this.entities[entityId];
    }

    getEntities(): Entity[] {
        return Object.values(this.entities);
    }

    getCharacters(): Character[] {
        return Object.values(this.entities).filter(entity => entity instanceof Character);
    }

    getCharacterNames(): string[] {
        return this.getCharacters().map(character => character.name);
    }

    getCharactersByName(name: string): Character[] {
        return this.getCharacters().filter(character => character.name === name);
    }
}
