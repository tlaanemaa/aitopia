/**
 * EntityRegistry - A central registry for all entities in the theatrical world
 */
import { Character } from './Character';
import { Prop } from './Prop';
import { Scene } from './Scene';

/**
 * Entity types that can be registered
 */
export type Entity = Character | Prop | Scene;

/**
 * EntityRegistry class - Manages all entities in the theatrical world
 */
export class EntityRegistry {
  private characters: Map<string, Character> = new Map();
  private props: Map<string, Prop> = new Map();
  private scenes: Map<string, Scene> = new Map();

  /**
   * Register a character
   */
  registerCharacter(character: Character): void {
    if (this.characters.has(character.id)) {
      throw new Error(`Character with ID ${character.id} already exists`);
    }
    this.characters.set(character.id, character);
  }

  /**
   * Unregister a character
   */
  unregisterCharacter(characterId: string): boolean {
    return this.characters.delete(characterId);
  }

  /**
   * Get a character by ID
   */
  getCharacter(characterId: string): Character | undefined {
    return this.characters.get(characterId);
  }

  /**
   * Get all characters
   */
  getAllCharacters(): Character[] {
    return Array.from(this.characters.values());
  }

  /**
   * Register a prop
   */
  registerProp(prop: Prop): void {
    if (this.props.has(prop.id)) {
      throw new Error(`Prop with ID ${prop.id} already exists`);
    }
    this.props.set(prop.id, prop);
  }

  /**
   * Unregister a prop
   */
  unregisterProp(propId: string): boolean {
    return this.props.delete(propId);
  }

  /**
   * Get a prop by ID
   */
  getProp(propId: string): Prop | undefined {
    return this.props.get(propId);
  }

  /**
   * Get all props
   */
  getAllProps(): Prop[] {
    return Array.from(this.props.values());
  }

  /**
   * Register a scene
   */
  registerScene(scene: Scene): void {
    if (this.scenes.has(scene.id)) {
      throw new Error(`Scene with ID ${scene.id} already exists`);
    }
    this.scenes.set(scene.id, scene);
  }

  /**
   * Unregister a scene
   */
  unregisterScene(sceneId: string): boolean {
    return this.scenes.delete(sceneId);
  }

  /**
   * Get a scene by ID
   */
  getScene(sceneId: string): Scene | undefined {
    return this.scenes.get(sceneId);
  }

  /**
   * Get all scenes
   */
  getAllScenes(): Scene[] {
    return Array.from(this.scenes.values());
  }

  /**
   * Check if an entity with the given ID exists
   */
  hasEntity(id: string): boolean {
    return (
      this.characters.has(id) || 
      this.props.has(id) || 
      this.scenes.has(id)
    );
  }

  /**
   * Get any entity by ID (returns undefined if not found)
   */
  getEntity(id: string): Entity | undefined {
    return (
      this.characters.get(id) || 
      this.props.get(id) || 
      this.scenes.get(id)
    );
  }

  /**
   * Get entity name (for debugging and logging)
   */
  getEntityName(id: string): string {
    const entity = this.getEntity(id);
    if (!entity) return `Unknown Entity (${id})`;
    return entity.name;
  }

  /**
   * Clear all entities (mainly for testing)
   */
  clear(): void {
    this.characters.clear();
    this.props.clear();
    this.scenes.clear();
  }
} 