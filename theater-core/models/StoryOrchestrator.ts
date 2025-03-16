/**
 * StoryOrchestrator - Manages the overall story progression
 */
import { v4 as uuidv4 } from 'uuid';
import { TheatricalWorld } from './TheatricalWorld';
import { Character } from './Character';
import { WorldEvent } from '../types/events';
import { CharacterAction } from '../types/actions';
import { NarrativePhase, PlotThread } from '../types/common';
import { getCurrentTime } from '../utils/time';
import { EntityRegistry } from './EntityRegistry';
import { Emotion } from '../types/common';

/**
 * StoryOrchestrator configuration options
 */
export interface StoryOrchestratorConfig {
  maxTurnsPerScene: number;
  maxTurnsPerPhase: number;
  maxUserInputsPerTurn: number;
  useTurnRotation: boolean;
  narrativeComplexity: 'simple' | 'standard' | 'complex';
  includeProps: boolean;
  turnRate: number;
  plotThreadsForResolution: number;
  turnsBeforeUser: number;
}

/**
 * StoryOrchestrator class - Manages the story progression
 */
export class StoryOrchestrator {
  readonly id: string;
  private world: TheatricalWorld;
  private registry: EntityRegistry;
  private userInput: string[];
  private turnCount: number;
  private sceneChangeCount: number;
  private activeCharacterId?: string;
  private plotThreads: Map<string, PlotThread & { id: string; title: string }>;
  private config: StoryOrchestratorConfig;
  
  /**
   * Create a new story orchestrator
   */
  constructor(world: TheatricalWorld, config: Partial<StoryOrchestratorConfig> = {}) {
    this.id = uuidv4();
    this.world = world;
    this.registry = world.getRegistry();
    this.userInput = [];
    this.turnCount = 0;
    this.sceneChangeCount = 0;
    this.plotThreads = new Map<string, PlotThread & { id: string; title: string }>();
    
    // Set default configuration
    this.config = {
      maxTurnsPerScene: 20,
      maxTurnsPerPhase: config.maxTurnsPerPhase || 5,
      maxUserInputsPerTurn: 3,
      useTurnRotation: true,
      narrativeComplexity: 'standard',
      includeProps: true,
      turnRate: config.turnRate || 1,
      plotThreadsForResolution: config.plotThreadsForResolution || 3,
      turnsBeforeUser: config.turnsBeforeUser || 2
    };
    
    // Initialize state
    this.turnCount = 0;
    this.sceneChangeCount = 0;
    this.plotThreads = new Map<string, PlotThread & { id: string; title: string }>();
  }
  
  /**
   * Add user input to be processed
   */
  addUserInput(input: string): void {
    this.userInput.push(input);
    
    // Also log it to the world for history tracking
    this.world.logUserInput(input);
  }
  
  /**
   * Process a turn in the story
   */
  processTurn(): {
    events: WorldEvent[];
    narrativeDescription: string;
    activeCharacter?: Character;
    shouldRequestUserInput: boolean;
  } {
    // Increment turn count
    this.turnCount++;
    
    // Determine if we need to change scenes based on turn count
    if (this.turnCount % this.config.maxTurnsPerScene === 0) {
      this.requestSceneChange();
    }
    
    // Determine the active character
    let activeCharacter: Character | undefined;
    
    if (this.config.useTurnRotation) {
      // Use the playwright's rotation system
      activeCharacter = this.world.getNextCharacter();
      if (activeCharacter) {
        this.activeCharacterId = activeCharacter.id;
      }
    } else if (this.activeCharacterId) {
      // Keep using the same character
      activeCharacter = this.registry.getCharacter(this.activeCharacterId);
    } else {
      // No active character yet, get one from the rotation
      activeCharacter = this.world.getNextCharacter();
      if (activeCharacter) {
        this.activeCharacterId = activeCharacter.id;
      }
    }
    
    // If no active character, return early
    if (!activeCharacter) {
      return {
        events: [],
        narrativeDescription: "The story pauses as there are no characters present.",
        shouldRequestUserInput: true
      };
    }
    
    // Process the turn based on the current narrative phase
    const playwright = this.world.getPlaywright();
    const currentPhase = playwright.narrativePhase;
    let events: WorldEvent[] = [];
    let narrativeDescription = "";
    let shouldRequestUserInput = false;
    
    // Determine if we should advance the narrative phase
    if (this.turnCount % this.config.maxTurnsPerPhase === 0) {
      playwright.progressNarrative(20);
    }
    
    // Process based on phase
    switch (currentPhase) {
      case 'exposition':
        // In introduction phase, focus on character establishment
        narrativeDescription = this.processIntroductionPhase(activeCharacter);
        break;
        
      case 'rising_action':
        // In rising action, introduce conflict
        narrativeDescription = this.processRisingActionPhase(activeCharacter);
        break;
        
      case 'climax':
        // In climax, intensify the drama
        narrativeDescription = this.processClimaxPhase(activeCharacter);
        break;
        
      case 'falling_action':
        // In falling action, work toward resolution
        narrativeDescription = this.processFallingActionPhase(activeCharacter);
        break;
        
      case 'resolution':
        // In resolution, provide closure
        narrativeDescription = this.processResolutionPhase(activeCharacter);
        break;
    }
    
    // Process user input if available
    if (this.userInput.length > 0) {
      // Take up to maxUserInputsPerTurn inputs
      const inputsToProcess = this.userInput.splice(0, this.config.maxUserInputsPerTurn);
      const userInputEvents = this.processUserInputs(inputsToProcess, activeCharacter);
      events = [...events, ...userInputEvents];
      
      // Request more user input for interactive experience
      shouldRequestUserInput = true;
    } else {
      // If no user input, decide whether to request input
      shouldRequestUserInput = Math.random() < 0.3; // 30% chance to request input
    }
    
    return {
      events,
      narrativeDescription,
      activeCharacter,
      shouldRequestUserInput
    };
  }
  
  /**
   * Process the introduction phase
   */
  private processIntroductionPhase(activeCharacter: Character): string {
    // In introduction, focus on establishing character personalities and setting
    const action: CharacterAction = {
      characterId: activeCharacter.id,
      actionId: uuidv4(),
      timestamp: getCurrentTime(),
      emotion: Emotion.DETERMINED,
      speech: activeCharacter.traits.includes('shy') 
        ? `Hello, my name is ${activeCharacter.name}.`
        : `Hello, my name is ${activeCharacter.name}. I am ${activeCharacter.traits.join(', ')}.`,
      thought: `I should introduce myself and see what's going on here.`
    };
    
    // Process the action
    this.world.processCharacterAction(activeCharacter.id, action);
    
    return `${activeCharacter.name} is getting acquainted with the scene, looking around with ${action.emotion} eyes.`;
  }
  
  /**
   * Process the rising action phase
   */
  private processRisingActionPhase(activeCharacter: Character): string {
    // In rising action, introduce conflicts and tensions
    
    // Get visible characters for potential interaction
    const visibleCharacters = this.world.getVisibleCharactersFor(activeCharacter.id)
      .filter(c => c.id !== activeCharacter.id);
    
    let action: CharacterAction = {
      characterId: activeCharacter.id,
      actionId: uuidv4(),
      timestamp: getCurrentTime(),
      emotion: Emotion.DETERMINED
    };
    
    // If other characters are visible, interact with one
    if (visibleCharacters.length > 0) {
      const targetCharacter = visibleCharacters[Math.floor(Math.random() * visibleCharacters.length)];
      
      action = {
        ...action,
        speech: `I've been thinking about what's happening here, ${targetCharacter.name}. Something doesn't feel right.`,
        interactionTarget: targetCharacter.id,
        interactionType: 'approaches'
      };
    } else {
      // No one to interact with
      action = {
        ...action,
        speech: "There must be more to this place than meets the eye. I need to investigate.",
        thought: "I feel like I'm being watched. This situation is getting more complex."
      };
    }
    
    // Process the action
    this.world.processCharacterAction(activeCharacter.id, action);
    
    return `The tension rises as ${activeCharacter.name} becomes more involved in the unfolding situation.`;
  }
  
  /**
   * Process the climax phase
   */
  private processClimaxPhase(activeCharacter: Character): string {
    // In climax, dramatic confrontation or revelation
    
    // Create a dramatic moment
    const action: CharacterAction = {
      characterId: activeCharacter.id,
      actionId: uuidv4(),
      timestamp: getCurrentTime(),
      emotion: Emotion.SURPRISED,
      speech: "I've just realized what's really going on here!",
      thought: "Everything makes sense now. The pieces are falling into place."
    };
    
    // Process the action
    this.world.processCharacterAction(activeCharacter.id, action);
    
    // Add a plot thread if none exists yet
    const revelation = `${activeCharacter.name} has discovered a shocking truth.`;
    this.world.getPlaywright().addPlotThread(revelation, [activeCharacter.id]);
    
    // Store the plot thread locally too
    const threadId = uuidv4();
    const plotThread: PlotThread & { id: string; title: string } = {
      id: threadId,
      title: "The Great Revelation",
      description: revelation,
      resolved: false,
      involvedCharacterIds: [activeCharacter.id]
    };
    this.plotThreads.set(threadId, plotThread);
    
    return `A moment of revelation strikes ${activeCharacter.name}, changing everything about the situation.`;
  }
  
  /**
   * Process the falling action phase
   */
  private processFallingActionPhase(activeCharacter: Character): string {
    // In falling action, working toward resolution
    
    // Resolve plot threads
    const unresolvedThreads = Array.from(this.plotThreads.values())
      .filter(thread => !thread.resolved);
    
    if (unresolvedThreads.length > 0) {
      // Take steps to resolve a thread
      const thread = unresolvedThreads[0];
      
      const action: CharacterAction = {
        characterId: activeCharacter.id,
        actionId: uuidv4(),
        timestamp: getCurrentTime(),
        emotion: Emotion.DETERMINED,
        speech: `I know what needs to be done now. We need to address ${thread.description}.`,
        thought: `This is the right path forward. I can help resolve this situation.`
      };
      
      // Process the action
      this.world.processCharacterAction(activeCharacter.id, action);
      
      // Mark the thread as resolved
      thread.resolved = true;
      this.plotThreads.set(thread.id, thread);
      this.world.getPlaywright().resolvePlotThread(this.world.getPlaywright().plotThreads.findIndex(pt => pt.description === thread.description));
      
      return `${activeCharacter.name} takes decisive steps to resolve the situation, bringing a sense of progress.`;
    } else {
      // No threads to resolve
      const action: CharacterAction = {
        characterId: activeCharacter.id,
        actionId: uuidv4(),
        timestamp: getCurrentTime(),
        emotion: Emotion.CALM,
        speech: "Things are starting to make sense now. We're making progress.",
        thought: "We've come so far. The end is in sight."
      };
      
      // Process the action
      this.world.processCharacterAction(activeCharacter.id, action);
      
      return `${activeCharacter.name} reflects on recent events, sensing that resolution is near.`;
    }
  }
  
  /**
   * Process the resolution phase
   */
  private processResolutionPhase(activeCharacter: Character): string {
    // In resolution, provide closure
    
    // Check if all plot threads are resolved
    const allThreadsResolved = Array.from(this.plotThreads.values())
      .every(thread => thread.resolved);
    
    if (allThreadsResolved) {
      // Provide final closure
      const action: CharacterAction = {
        characterId: activeCharacter.id,
        actionId: uuidv4(),
        timestamp: getCurrentTime(),
        emotion: Emotion.CONTENT,
        speech: "It seems our journey here is coming to an end. We've learned so much.",
        thought: "This experience has changed me. I'm not the same person I was when this began."
      };
      
      // Process the action
      this.world.processCharacterAction(activeCharacter.id, action);
      
      return `${activeCharacter.name} finds a sense of peace as the story reaches its natural conclusion.`;
    } else {
      // Still need to resolve threads
      const action: CharacterAction = {
        characterId: activeCharacter.id,
        actionId: uuidv4(),
        timestamp: getCurrentTime(),
        emotion: Emotion.DETERMINED,
        speech: "We're almost there. Just a few loose ends to tie up.",
        thought: "So close to the end now. I need to make sure everything is resolved."
      };
      
      // Process the action
      this.world.processCharacterAction(activeCharacter.id, action);
      
      return `${activeCharacter.name} works to tie up the remaining loose ends, bringing closure to the story.`;
    }
  }
  
  /**
   * Process user inputs
   */
  private processUserInputs(inputs: string[], activeCharacter: Character): WorldEvent[] {
    const events: WorldEvent[] = [];
    
    for (const input of inputs) {
      // Create a general event for user input
      const event: WorldEvent = {
        id: uuidv4(),
        type: 'user_input',
        description: `User directed: "${input}"`,
        timestamp: getCurrentTime(),
        location: activeCharacter.position,
        isGlobal: true,
        involvedCharacterIds: [activeCharacter.id],
        involvedObjectIds: []
      };
      
      events.push(event);
      
      // For now, we'll have the active character respond to the input
      // In a real implementation, this would be processed through an LLM
      // to determine the appropriate action
      const responseAction: CharacterAction = {
        characterId: activeCharacter.id,
        actionId: uuidv4(),
        timestamp: getCurrentTime(),
        emotion: Emotion.THOUGHTFUL,
        speech: `[Responding to user] ${input} is an interesting suggestion.`,
        thought: `The user wants me to ${input}. I should consider how to incorporate this.`
      };
      
      // Process the response action
      this.world.processCharacterAction(activeCharacter.id, responseAction);
    }
    
    return events;
  }
  
  /**
   * Request a scene change
   */
  private requestSceneChange(): void {
    // Get all characters for narration
    const characters = this.world.getCharacters();
    const characterName = characters.length > 0 ? characters[0].name : "Everyone";
    
    // Create a playwright action to change the scene
    const playwrightAction = {
      actionId: uuidv4(),
      timestamp: getCurrentTime(),
      narration: `${characterName} looks up suddenly, noticing something unexpected...`
    };
    
    // Process the playwright action
    this.world.processPlaywrightAction(playwrightAction);
  }
  
  /**
   * Generate a context for the LLM prompt
   */
  generateLLMContext(userInput?: string): {
    world: string;
    activeCharacter: string;
    narrativePhase: NarrativePhase;
    turnCount: number;
    userInput?: string;
  } {
    const activeCharacter = this.activeCharacterId 
      ? this.world.getCharacter(this.activeCharacterId) 
      : undefined;
    
    // Generate world context
    const worldContext = this.world.generateLLMContext(
      this.activeCharacterId,
      userInput
    );
    
    return {
      world: `Scene: ${worldContext.scene}\n\nCharacters: ${worldContext.characters.join('\n')}\n\nRecent Events: ${worldContext.recentEvents.join('\n')}`,
      activeCharacter: activeCharacter 
        ? `Active Character: ${activeCharacter.name} (${activeCharacter.archetype}), currently feeling ${activeCharacter.currentEmotion}` 
        : 'No active character',
      narrativePhase: this.world.getPlaywright().narrativePhase,
      turnCount: this.turnCount,
      userInput: userInput
    };
  }

  /**
   * Change the scene
   */
  private changeScene(): void {
    // Increment scene change counter
    this.sceneChangeCount++;
    
    // Get all characters
    const characters = this.world.getCharacters();
    const characterNames = characters.map(c => c.name).join(", ");
    
    // Create a playwright action to change the scene
    const playwrightAction = {
      actionId: uuidv4(),
      timestamp: getCurrentTime(),
      narration: `The scene changes as ${characterNames} continue their journey...`
    };
    
    // Process the playwright action
    this.world.processPlaywrightAction(playwrightAction);
  }
} 