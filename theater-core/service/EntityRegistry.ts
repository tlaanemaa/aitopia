import { Entity } from "../models/Entity";

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
}
