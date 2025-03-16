/**
 * Perception - A character's subjective view of the world
 */
import {
  ObservedEvent,
  CharacterPerception,
  ObjectPerception,
  Speech,
  Thought,
  RelationshipType,
  Position
} from '../types/common';
import { WorldEvent } from '../types/events';
import { formatRelativeTime, getCurrentTime, isEventRecent } from '../utils/time';
import { calculateDistance } from '../utils/spatial';
import { EntityRegistry } from './EntityRegistry';

/**
 * Configuration for perception capabilities
 */
export interface PerceptionConfig {
  sightRange: number;         // How far the character can see (distance units)
  hearingRange: number;       // How far the character can hear (distance units)
  memoryCapacity: number;     // How many events the character can remember
  memoryDuration: number;     // How long memories last (in milliseconds)
  attentionThreshold: number; // Minimum significance level to notice an event (0-10)
}

/**
 * Default perception configuration
 */
const DEFAULT_PERCEPTION_CONFIG: PerceptionConfig = {
  sightRange: 50,
  hearingRange: 30,
  memoryCapacity: 50,
  memoryDuration: 30 * 60 * 1000, // 30 minutes
  attentionThreshold: 1
};

/**
 * Interface for emotional events
 */
interface EmotionalEventType extends WorldEvent {
  type: 'emotional';
  characterId: string;
  emotion: string;
  intensity: number;
}

/**
 * Interface for relationship events
 */
interface RelationshipEventType extends WorldEvent {
  type: 'relationship';
  characterId1: string;
  characterId2: string;
  relationshipChange: 'improved' | 'worsened' | 'established' | 'broken';
  intensity: number;
}

/**
 * Interface for interaction events
 */
interface InteractionEventType extends WorldEvent {
  type: 'interaction';
  characterId: string;
  objectId: string;
  interactionType: string;
}

/**
 * Perception class - manages what a character knows about the world
 */
export class Perception {
  private observedEvents: ObservedEvent[] = [];
  private characterPerceptions: Map<string, CharacterPerception> = new Map();
  private heardDialogue: Speech[] = [];
  private thoughts: Thought[] = [];
  private knownObjects: Map<string, ObjectPerception> = new Map();
  readonly config: PerceptionConfig;
  private ownerPosition: Position;
  private registry: EntityRegistry;
  
  /**
   * Create a new perception instance
   */
  constructor(
    registry: EntityRegistry,
    config: Partial<PerceptionConfig> = {},
    initialPosition: Position = { x: 50, y: 50 }
  ) {
    this.registry = registry;
    this.config = { ...DEFAULT_PERCEPTION_CONFIG, ...config };
    this.ownerPosition = initialPosition;
  }
  
  /**
   * Update the owner's position (affects perception)
   */
  updatePosition(newPosition: Position): void {
    this.ownerPosition = newPosition;
  }
  
  /**
   * Try to perceive a world event based on position and capabilities
   * Returns true if the event was perceived
   */
  perceiveEvent(event: WorldEvent): boolean {
    // Global events are always perceived regardless of position
    if (event.isGlobal) {
      this.addObservation(event, 10); // Global events are highly significant
      return true;
    }
    
    // Calculate distance to event
    const distance = calculateDistance(this.ownerPosition, event.location);
    
    // Check if event is within perception range
    const canSee = distance <= this.config.sightRange;
    const canHear = distance <= this.config.hearingRange;
    
    // Different event types have different perception requirements
    let perceived = false;
    let significance = 0;
    
    switch (event.type) {
      case 'speech':
        // Speech events require hearing
        if (canHear) {
          // Significance decreases with distance
          significance = 10 * (1 - distance / this.config.hearingRange);
          perceived = true;
        }
        break;
        
      case 'movement':
        // Movement events require sight
        if (canSee) {
          // Moving characters are more noticeable when they're closer
          significance = 5 * (1 - distance / this.config.sightRange);
          perceived = true;
        }
        break;
        
      case 'entrance':
      case 'exit':
        // Entrances and exits are noticeable events
        if (canSee) {
          significance = 8;
          perceived = true;
        }
        break;
        
      case 'emotional':
        // Emotional events require close proximity to notice
        if (distance <= this.config.sightRange * 0.5) {
          significance = 7;
          perceived = true;
        }
        break;
        
      case 'interaction':
        // Interactions are moderately noticeable
        if (canSee) {
          significance = 6;
          perceived = true;
        }
        break;
        
      case 'scene_change':
        // Scene changes are dramatic and always noticed
        significance = 10;
        perceived = true;
        break;
        
      case 'relationship':
        // Relationship changes are subtle unless they involve the observer
        const involvesObserver = event.involvedCharacterIds.some(
          id => this.characterPerceptions.has(id)
        );
        
        if (canSee && involvesObserver) {
          significance = 8;
          perceived = true;
        } else if (canSee) {
          significance = 4;
          perceived = true;
        }
        break;
        
      default:
        // Default handling for unknown event types
        if (canSee || canHear) {
          significance = 5;
          perceived = true;
        }
    }
    
    // Only record the event if it's significant enough to notice
    if (perceived && significance >= this.config.attentionThreshold) {
      this.addObservation(event, significance);
      
      // Update character perceptions for any characters involved
      event.involvedCharacterIds.forEach(charId => {
        this.updateCharacterPerception(charId, event);
      });
      
      // Update object perceptions for any objects involved
      event.involvedObjectIds.forEach(objId => {
        this.updateObjectPerception(objId, event);
      });
      
      return true;
    }
    
    return false;
  }
  
  /**
   * Add a speech event to heard dialogue
   */
  hearSpeech(speech: Speech): boolean {
    // Calculate distance to speaker
    const speakerPos = this.getCharacterLastKnownPosition(speech.speakerId);
    
    if (!speakerPos) {
      // If we don't know where the speaker is, assume they're too far
      return false;
    }
    
    const distance = calculateDistance(this.ownerPosition, speakerPos);
    
    // Check if speech is within hearing range (adjusted by volume)
    const adjustedHearingRange = this.config.hearingRange * speech.volume;
    
    if (distance <= adjustedHearingRange) {
      this.heardDialogue.push(speech);
      
      // Trim heard dialogue if it exceeds capacity
      if (this.heardDialogue.length > this.config.memoryCapacity) {
        this.heardDialogue.shift();
      }
      
      return true;
    }
    
    return false;
  }
  
  /**
   * Add a thought
   */
  addThought(thought: Thought): void {
    this.thoughts.push(thought);
    
    // Trim thoughts if they exceed capacity
    if (this.thoughts.length > this.config.memoryCapacity) {
      this.thoughts.shift();
    }
  }
  
  /**
   * Add an observed event
   */
  private addObservation(event: WorldEvent, significance: number): void {
    const observedEvent: ObservedEvent = {
      description: event.description,
      timestamp: event.timestamp,
      significance: significance,
      location: event.location,
      involvedCharacterIds: [...event.involvedCharacterIds],
      involvedObjectIds: [...event.involvedObjectIds]
    };
    
    this.observedEvents.push(observedEvent);
    
    // Trim observed events if they exceed capacity
    if (this.observedEvents.length > this.config.memoryCapacity) {
      // Find the least significant event that's not recent
      const oldestNonImportantIndex = this.observedEvents
        .findIndex(e => 
          !isEventRecent(e.timestamp) && 
          e.significance < 7
        );
      
      if (oldestNonImportantIndex !== -1) {
        // Remove the least significant old event
        this.observedEvents.splice(oldestNonImportantIndex, 1);
      } else {
        // If all events are important or recent, remove the oldest
        this.observedEvents.shift();
      }
    }
  }
  
  /**
   * Update perception of a character based on an event
   */
  private updateCharacterPerception(characterId: string, event: WorldEvent): void {
    // Check if we already know about this character
    let perception = this.characterPerceptions.get(characterId);
    
    // Look up the actual character name from registry
    const character = this.registry.getCharacter(characterId);
    const characterName = character ? character.name : 'Unknown Character';
    
    if (!perception) {
      // Create a new perception object for this character
      perception = {
        characterId: characterId,
        characterName: characterName, // Use name from registry if available
        lastSeen: event.timestamp,
        lastKnownPosition: event.location,
        knownTraits: [],
        relationshipType: RelationshipType.STRANGER,
        relationshipIntensity: 0,
        lastInteraction: event.description
      };
      
      this.characterPerceptions.set(characterId, perception);
    } else {
      // Update the existing perception
      perception.lastSeen = event.timestamp;
      perception.lastKnownPosition = event.location;
      perception.lastInteraction = event.description;
      
      // Update name if we have it now
      if (character && perception.characterName === 'Unknown Character') {
        perception.characterName = characterName;
      }
    }
    
    // Update based on event type
    if (event.type === 'emotional') {
      // For emotional events, update traits if applicable
      const emotionalEvent = event as EmotionalEventType;
      if (emotionalEvent.emotion && !perception.knownTraits.includes(emotionalEvent.emotion)) {
        perception.knownTraits.push(emotionalEvent.emotion);
      }
    } else if (event.type === 'relationship') {
      // For relationship events, update the relationship if it involves this character
      const relationshipEvent = event as RelationshipEventType;
      
      // Check if the event is about the relationship with this character
      if (relationshipEvent.characterId1 && relationshipEvent.characterId2) {
        const otherCharId = relationshipEvent.characterId1 === characterId
          ? relationshipEvent.characterId2
          : relationshipEvent.characterId1;
          
        // Only update if the event describes a relationship with the observer
        if (otherCharId === characterId) {
          // Map the relationship change to a RelationshipType
          let relationType = RelationshipType.ACQUAINTANCE;
          switch (relationshipEvent.relationshipChange) {
            case 'improved': 
              relationType = perception.relationshipType === RelationshipType.STRANGER ? 
                RelationshipType.ACQUAINTANCE : RelationshipType.FRIEND;
              break;
            case 'worsened':
              relationType = RelationshipType.RIVAL;
              break;
            case 'established':
              relationType = RelationshipType.ACQUAINTANCE;
              break;
            case 'broken':
              relationType = RelationshipType.STRANGER;
              break;
          }
          
          perception.relationshipType = relationType;
          perception.relationshipIntensity = relationshipEvent.intensity || 5;
        }
      }
    }
  }
  
  /**
   * Update perception of an object based on an event
   */
  private updateObjectPerception(objectId: string, event: WorldEvent): void {
    // Check if we already know about this object
    let perception = this.knownObjects.get(objectId);
    
    // Look up the actual object from registry
    const prop = this.registry.getProp(objectId);
    const objectType = prop ? prop.type : 'Unknown Object';
    
    if (!perception) {
      // Create a new perception object for this object
      perception = {
        objectId: objectId,
        objectType: objectType, // Use type from registry if available
        lastSeen: event.timestamp,
        lastKnownState: 'unknown',
        lastKnownPosition: event.location
      };
      
      this.knownObjects.set(objectId, perception);
    } else {
      // Update the existing perception
      perception.lastSeen = event.timestamp;
      perception.lastKnownPosition = event.location;
      
      // Update type if we have it now
      if (prop && perception.objectType === 'Unknown Object') {
        perception.objectType = objectType;
      }
    }
    
    // Add the object's current state
    if (event.type === 'interaction') {
      const interactionEvent = event as InteractionEventType;
      
      // If there's a target object, record the interaction
      if (interactionEvent.objectId === objectId && interactionEvent.interactionType) {
        perception.lastKnownState = interactionEvent.interactionType;
      }
    }
  }
  
  /**
   * Get the most recent observed events
   */
  getRecentObservations(count: number = 5): ObservedEvent[] {
    return [...this.observedEvents]
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, count);
  }
  
  /**
   * Get observations involving a specific character
   */
  getObservationsInvolvingCharacter(characterId: string, count: number = 3): ObservedEvent[] {
    return [...this.observedEvents]
      .filter(event => event.involvedCharacterIds.includes(characterId))
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, count);
  }
  
  /**
   * Get recent heard dialogue
   */
  getRecentDialogue(count: number = 5): Speech[] {
    return [...this.heardDialogue]
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, count);
  }
  
  /**
   * Get recent thoughts
   */
  getRecentThoughts(count: number = 3): Thought[] {
    return [...this.thoughts]
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, count);
  }
  
  /**
   * Get dialogue spoken by a specific character
   */
  getDialogueFromCharacter(characterId: string, count: number = 3): Speech[] {
    return [...this.heardDialogue]
      .filter(speech => speech.speakerId === characterId)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, count);
  }
  
  /**
   * Get known characters and their perceptions
   */
  getKnownCharacters(): Map<string, CharacterPerception> {
    // Remove characters that haven't been seen in a long time
    const now = getCurrentTime();
    const forgettingThreshold = now - this.config.memoryDuration;
    
    // Create a new map with only characters seen recently
    const recentCharacters = new Map<string, CharacterPerception>();
    
    this.characterPerceptions.forEach((perception, id) => {
      if (perception.lastSeen > forgettingThreshold || perception.relationshipIntensity > 50) {
        // Keep characters seen recently or that have a strong relationship
        recentCharacters.set(id, perception);
      }
    });
    
    return recentCharacters;
  }
  
  /**
   * Get last known position of a character
   */
  getCharacterLastKnownPosition(characterId: string): Position | null {
    const perception = this.characterPerceptions.get(characterId);
    return perception?.lastKnownPosition || null;
  }
  
  /**
   * Get relationship with a character
   */
  getRelationshipWith(characterId: string): { type: RelationshipType; intensity: number } | null {
    const perception = this.characterPerceptions.get(characterId);
    
    if (!perception) return null;
    
    return {
      type: perception.relationshipType,
      intensity: perception.relationshipIntensity
    };
  }
  
  /**
   * Format perception data for LLM prompting
   */
  formatForLLM(): {
    recentObservations: string[];
    knownCharacters: string[];
    recentDialogue: string[];
    recentThoughts: string[];
  } {
    // Get recent observations
    const recentObs = this.getRecentObservations(5).map(obs => 
      `${formatRelativeTime(obs.timestamp)}: ${obs.description}`
    );
    
    // Get known characters
    const knownChars = Array.from(this.getKnownCharacters().values()).map(char => 
      `${char.characterId}: ${char.relationshipType} - Last seen ${formatRelativeTime(char.lastSeen)}`
    );
    
    // Get recent dialogue
    const recentDialogue = this.getRecentDialogue(5).map(speech => 
      `${speech.speakerName} (${formatRelativeTime(speech.timestamp)}): "${speech.content}"`
    );
    
    // Get recent thoughts
    const recentThoughts = this.getRecentThoughts(3).map(thought => 
      `${formatRelativeTime(thought.timestamp)} (feeling ${thought.emotion}): "${thought.content}"`
    );
    
    return {
      recentObservations: recentObs,
      knownCharacters: knownChars,
      recentDialogue: recentDialogue,
      recentThoughts: recentThoughts
    };
  }
  
  /**
   * Get the sight range
   */
  getSightRange(): number {
    return this.config.sightRange;
  }
  
  /**
   * Get the hearing range
   */
  getHearingRange(): number {
    return this.config.hearingRange;
  }
  
  /**
   * Get the character's perception of another character
   */
  getCharacterPerception(characterId: string): CharacterPerception | undefined {
    // If we've never perceived this character, check if they exist and create perception
    if (!this.characterPerceptions.has(characterId)) {
      const character = this.registry.getCharacter(characterId);
      if (character) {
        this.characterPerceptions.set(characterId, {
          characterId: characterId,
          characterName: character.name,
          lastSeen: 0, // Never seen
          knownTraits: [],
          relationshipType: RelationshipType.STRANGER,
          relationshipIntensity: 0
        });
      }
    }
    
    return this.characterPerceptions.get(characterId);
  }
  
  /**
   * Get the character's perception of an object
   */
  getObjectPerception(objectId: string): ObjectPerception | undefined {
    // If we've never perceived this object, check if it exists and create perception
    if (!this.knownObjects.has(objectId)) {
      const prop = this.registry.getProp(objectId);
      if (prop) {
        this.knownObjects.set(objectId, {
          objectId: objectId,
          objectType: prop.type,
          lastSeen: 0, // Never seen
          lastKnownState: 'unknown',
          lastKnownPosition: prop.position
        });
      }
    }
    
    return this.knownObjects.get(objectId);
  }
} 