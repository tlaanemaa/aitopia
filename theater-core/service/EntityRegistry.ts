import { Entity } from "../models/Entity";

class EntityRegistry {
    private entities: Map<string, Entity> = new Map();

    register(entity: Entity): void {
        this.entities.set(entity.id, entity);
    }

    getEntity(id: string): Entity | undefined {
        return this.entities.get(id);
    }

    clear(): void {
        this.entities.clear();
    }
}

export const entityRegistry = new EntityRegistry();