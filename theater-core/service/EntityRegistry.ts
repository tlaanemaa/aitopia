import { Entity } from "../models/Entity";
import { Character } from "../models/Character";

export class EntityRegistry {
    private entities: Record<string, Entity> = {};
    private avatars: Record<string, string> = {};

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

    getCharacter(name: string): Character | undefined {
        return this.getCharacters().find(character => character.name === name);
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
