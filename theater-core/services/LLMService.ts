/**
 * LLMService - Handles interactions with language models
 */
import { ChatOllama } from "@langchain/ollama";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { z } from "zod";

import { Character } from "../models/Character";
import { TheatricalWorld } from "../models/TheatricalWorld";
import { StoryOrchestrator } from "../models/StoryOrchestrator";
import { Emotion, CharacterArchetype, Position } from "../types/common";
import { CharacterAction, PlaywrightAction } from "../types/actions";

/**
 * Schemas for LLM responses
 */

// Schema for character action
const characterActionSchema = z.object({
  characterId: z.string(),
  speech: z.string().optional(),
  thought: z.string().optional(),
  emotion: z.string().optional(),
  movement: z.object({
    x: z.number(),
    y: z.number()
  }).optional(),
  interactionTarget: z.string().optional(),
  interactionType: z.string().optional()
});

// Schema for playwright action
const playwrightActionSchema = z.object({
  type: z.enum(["narration", "scene_change", "new_character", "new_prop", "advance_rotation"]),
  description: z.string().optional(),
  newSceneName: z.string().optional(),
  newSceneDescription: z.string().optional(),
  characterName: z.string().optional(),
  characterTraits: z.array(z.string()).optional(),
  characterArchetype: z.string().optional(),
  characterBackstory: z.string().optional(),
  characterAppearance: z.string().optional(),
  characterGoal: z.string().optional(),
  characterEmotion: z.string().optional(),
  propType: z.string().optional(),
  propName: z.string().optional(),
  propDescription: z.string().optional(),
  propPosition: z.object({
    x: z.number(),
    y: z.number()
  }).optional()
});

// Schema for character turn response
const characterTurnResponseSchema = z.object({
  narrativeDescription: z.string(),
  action: characterActionSchema,
  suggestedResponse: z.string().optional()
});

// Schema for playwright turn response
const playwrightTurnResponseSchema = z.object({
  narrativeDescription: z.string(),
  actions: z.array(playwrightActionSchema),
  nextCharacterId: z.string().optional()
});

// LLM configuration parameters
export interface LLMConfig {
  endpoint: string;
  modelName: string;
  temperature: number;
  maxTokens?: number;
}

/**
 * LLM Service for handling language model interactions
 */
export class LLMService {
  private config: LLMConfig;
  private model: ChatOllama;
  
  // System prompt templates
  private readonly CHARACTER_SYSTEM_PROMPT = `
You are playing the role of a character in an interactive theatrical experience.
You will be given information about the character you are playing, the scene, and recent events.
Your task is to generate an action for the character that is consistent with their personality, goals, and the current situation.
Think like a good improv actor: build on what has happened before, and make choices that create interesting story opportunities.
`;

  private readonly PLAYWRIGHT_SYSTEM_PROMPT = `
You are the Playwright of an interactive theatrical experience.
Your job is to manage the flow of the narrative, introduce new elements, and guide the story.
You will be given information about the current state of the world, the characters, and recent events.
Based on this information, you may:
1. Provide narration
2. Change the scene
3. Introduce new characters
4. Add new props
5. Direct which character should act next

Make choices that create an engaging, coherent, and dramatic story experience.
`;

  /**
   * Create a new LLM service
   */
  constructor(config: LLMConfig) {
    this.config = config;
    
    // Initialize the model
    this.model = new ChatOllama({
      baseUrl: config.endpoint,
      model: config.modelName,
      temperature: config.temperature
    });
  }
  
  /**
   * Generate a character action
   */
  async generateCharacterAction(
    world: TheatricalWorld,
    characterId: string,
    userInput?: string
  ): Promise<{
    narrativeDescription: string;
    action: CharacterAction;
    suggestedResponse?: string;
  }> {
    const character = world.getCharacter(characterId);
    
    if (!character) {
      throw new Error(`Character with ID ${characterId} not found`);
    }
    
    // Generate context for the LLM
    const context = world.generateLLMContext(characterId, userInput);
    
    // Create the prompt
    const promptTemplate = ChatPromptTemplate.fromMessages([
      ["system", this.CHARACTER_SYSTEM_PROMPT.trim()],
      ["user", `
You are playing the character: ${character.name}.

ABOUT YOUR CHARACTER:
${character.generateContextForLLM().identity}

WHAT YOU KNOW ABOUT THE WORLD:
Scene: ${context.scene}

WHAT YOUR CHARACTER KNOWS:
${context.focusCharacter || "You're new to this scene and don't know much yet."}

RECENT EVENTS:
${context.recentEvents.join("\n")}

${userInput ? `USER INPUT: ${userInput}` : ""}

Based on this information, what would your character do next? Consider speech, thoughts, emotions, and actions.
`]
    ]);
    
    // Structure the LLM output
    const structuredLLM = this.model.withStructuredOutput(characterTurnResponseSchema);
    
    // Generate the response
    try {
      const prompt = await promptTemplate.invoke({});
      console.log("Character Prompt:", prompt.toString());
      
      const response = await structuredLLM.invoke(prompt);
      console.log("Character LLM Response:", response);
      
      return {
        narrativeDescription: response.narrativeDescription,
        action: this.validateAndTransformCharacterAction(response.action),
        suggestedResponse: response.suggestedResponse
      };
    } catch (error) {
      console.error("Error generating character action:", error);
      
      // Fallback to a default action
      return {
        narrativeDescription: `${character.name} seems lost in thought.`,
        action: {
          thought: "I'm not sure what to do right now.",
          emotion: character.currentEmotion
        }
      };
    }
  }
  
  /**
   * Generate playwright actions
   */
  async generatePlaywrightActions(
    orchestrator: StoryOrchestrator,
    userInput?: string
  ): Promise<{
    narrativeDescription: string;
    actions: PlaywrightAction[];
    nextCharacterId?: string;
  }> {
    // Get context from the orchestrator
    const context = orchestrator.generateLLMContext(userInput);
    
    // Create the prompt
    const promptTemplate = ChatPromptTemplate.fromMessages([
      ["system", this.PLAYWRIGHT_SYSTEM_PROMPT.trim()],
      ["user", `
WORLD STATE:
${context.world}

ACTIVE CHARACTER:
${context.activeCharacter}

NARRATIVE PHASE:
${context.narrativePhase}

TURN COUNT:
${context.turnCount}

${userInput ? `USER INPUT: ${userInput}` : ""}

As the Playwright, what actions would you take to move the story forward? Consider:
- Adding narration to set the scene
- Changing the scene if appropriate
- Introducing new characters if needed
- Adding props that could enhance the scene
- Deciding which character should act next

Provide a narrative description and list the actions you want to take.
`]
    ]);
    
    // Structure the LLM output
    const structuredLLM = this.model.withStructuredOutput(playwrightTurnResponseSchema);
    
    // Generate the response
    try {
      const prompt = await promptTemplate.invoke({});
      console.log("Playwright Prompt:", prompt.toString());
      
      const response = await structuredLLM.invoke(prompt);
      console.log("Playwright LLM Response:", response);
      
      return {
        narrativeDescription: response.narrativeDescription,
        actions: response.actions.map(action => this.validateAndTransformPlaywrightAction(action)),
        nextCharacterId: response.nextCharacterId
      };
    } catch (error) {
      console.error("Error generating playwright actions:", error);
      
      // Fallback to a default action
      return {
        narrativeDescription: "The story continues...",
        actions: [{
          type: "narration",
          description: "The scene remains quiet for a moment."
        }]
      };
    }
  }
  
  /**
   * Validate and transform a character action from the LLM
   */
  private validateAndTransformCharacterAction(action: any): CharacterAction {
    const characterAction: CharacterAction = {};
    
    // Copy speech if provided
    if (action.speech) {
      characterAction.speech = action.speech;
    }
    
    // Copy thought if provided
    if (action.thought) {
      characterAction.thought = action.thought;
    }
    
    // Map emotion string to Emotion enum
    if (action.emotion) {
      const emotion = this.mapToEmotion(action.emotion);
      if (emotion) {
        characterAction.emotion = emotion;
      }
    }
    
    // Copy movement if provided
    if (action.movement && typeof action.movement.x === 'number' && typeof action.movement.y === 'number') {
      characterAction.movement = {
        x: action.movement.x,
        y: action.movement.y
      };
    }
    
    // Copy interaction details if provided
    if (action.interactionTarget && action.interactionType) {
      characterAction.interactionTarget = action.interactionTarget;
      characterAction.interactionType = action.interactionType;
    }
    
    return characterAction;
  }
  
  /**
   * Validate and transform a playwright action from the LLM
   */
  private validateAndTransformPlaywrightAction(action: any): PlaywrightAction {
    const playwrightAction: PlaywrightAction = {
      type: action.type
    };
    
    // Copy description if provided
    if (action.description) {
      playwrightAction.description = action.description;
    }
    
    // Handle scene change specifics
    if (action.type === 'scene_change') {
      if (action.newSceneName) playwrightAction.newSceneName = action.newSceneName;
      if (action.newSceneDescription) playwrightAction.newSceneDescription = action.newSceneDescription;
    }
    
    // Handle new character specifics
    if (action.type === 'new_character') {
      if (action.characterName) playwrightAction.characterName = action.characterName;
      if (action.characterTraits) playwrightAction.characterTraits = action.characterTraits;
      if (action.characterArchetype) playwrightAction.characterArchetype = this.mapToArchetype(action.characterArchetype);
      if (action.characterBackstory) playwrightAction.characterBackstory = action.characterBackstory;
      if (action.characterAppearance) playwrightAction.characterAppearance = action.characterAppearance;
      if (action.characterGoal) playwrightAction.characterGoal = action.characterGoal;
      if (action.characterEmotion) playwrightAction.characterEmotion = this.mapToEmotion(action.characterEmotion);
    }
    
    // Handle new prop specifics
    if (action.type === 'new_prop') {
      if (action.propType) playwrightAction.propType = action.propType;
      if (action.propName) playwrightAction.propName = action.propName;
      if (action.propDescription) playwrightAction.propDescription = action.propDescription;
      if (action.propPosition) playwrightAction.propPosition = action.propPosition;
    }
    
    return playwrightAction;
  }
  
  /**
   * Map a string to an Emotion enum value
   */
  private mapToEmotion(emotionString: string): Emotion | undefined {
    const normalized = emotionString.toLowerCase().trim();
    
    // Try direct mapping
    for (const emotion of Object.values(Emotion)) {
      if (normalized === emotion.toLowerCase()) {
        return emotion as Emotion;
      }
    }
    
    // Map common synonyms
    const synonymMap: Record<string, Emotion> = {
      'joy': Emotion.HAPPY,
      'joyful': Emotion.HAPPY,
      'cheerful': Emotion.HAPPY,
      'pleased': Emotion.HAPPY,
      'delighted': Emotion.HAPPY,
      
      'melancholy': Emotion.SAD,
      'gloomy': Emotion.SAD,
      'depressed': Emotion.SAD,
      'unhappy': Emotion.SAD,
      'sorrowful': Emotion.SAD,
      
      'furious': Emotion.ANGRY,
      'mad': Emotion.ANGRY,
      'enraged': Emotion.ANGRY,
      'irritated': Emotion.ANGRY,
      'annoyed': Emotion.ANGRY,
      
      'scared': Emotion.AFRAID,
      'frightened': Emotion.AFRAID,
      'terrified': Emotion.AFRAID,
      'anxious': Emotion.AFRAID,
      'nervous': Emotion.AFRAID,
      
      'shocked': Emotion.SURPRISED,
      'astonished': Emotion.SURPRISED,
      'amazed': Emotion.SURPRISED,
      'startled': Emotion.SURPRISED,
      
      'repulsed': Emotion.DISGUSTED,
      'revolted': Emotion.DISGUSTED,
      'grossed out': Emotion.DISGUSTED,
      
      'inquisitive': Emotion.CURIOUS,
      'interested': Emotion.CURIOUS,
      'intrigued': Emotion.CURIOUS,
      
      'puzzled': Emotion.CONFUSED,
      'bewildered': Emotion.CONFUSED,
      'perplexed': Emotion.CONFUSED,
      
      'thrilled': Emotion.EXCITED,
      'enthusiastic': Emotion.EXCITED,
      'eager': Emotion.EXCITED,
      
      'concerned': Emotion.WORRIED,
      'troubled': Emotion.WORRIED,
      'uneasy': Emotion.WORRIED,
      
      'entertained': Emotion.AMUSED,
      'humored': Emotion.AMUSED,
      
      'resolved': Emotion.DETERMINED,
      'committed': Emotion.DETERMINED,
      'steadfast': Emotion.DETERMINED,
      
      'satisfied': Emotion.PROUD,
      'accomplished': Emotion.PROUD,
      
      'embarrassed': Emotion.ASHAMED,
      'humiliated': Emotion.ASHAMED,
      'regretful': Emotion.ASHAMED,
      
      'relaxed': Emotion.CALM,
      'peaceful': Emotion.CALM,
      'tranquil': Emotion.CALM,
      
      'indifferent': Emotion.NEUTRAL,
      'impassive': Emotion.NEUTRAL,
      'stoic': Emotion.NEUTRAL
    };
    
    if (normalized in synonymMap) {
      return synonymMap[normalized];
    }
    
    // Default fallback
    console.warn(`Unknown emotion: ${emotionString}, falling back to NEUTRAL`);
    return Emotion.NEUTRAL;
  }
  
  /**
   * Map a string to a CharacterArchetype enum value
   */
  private mapToArchetype(archetypeString: string): CharacterArchetype | undefined {
    const normalized = archetypeString.toLowerCase().trim();
    
    // Try direct mapping
    for (const archetype of Object.values(CharacterArchetype)) {
      if (normalized === archetype.toLowerCase()) {
        return archetype as CharacterArchetype;
      }
    }
    
    // Map common synonyms
    const synonymMap: Record<string, CharacterArchetype> = {
      'protagonist': CharacterArchetype.HERO,
      'main character': CharacterArchetype.HERO,
      'champion': CharacterArchetype.HERO,
      
      'joker': CharacterArchetype.TRICKSTER,
      'prankster': CharacterArchetype.TRICKSTER,
      'deceiver': CharacterArchetype.TRICKSTER,
      
      'mentor': CharacterArchetype.SAGE,
      'wiseman': CharacterArchetype.SAGE,
      'teacher': CharacterArchetype.SAGE,
      'wise one': CharacterArchetype.SAGE,
      
      'adventurer': CharacterArchetype.EXPLORER,
      'wanderer': CharacterArchetype.EXPLORER,
      'seeker': CharacterArchetype.EXPLORER,
      
      'nurturer': CharacterArchetype.CAREGIVER,
      'helper': CharacterArchetype.CAREGIVER,
      'healer': CharacterArchetype.CAREGIVER,
      
      'artist': CharacterArchetype.CREATOR,
      'inventor': CharacterArchetype.CREATOR,
      'innovator': CharacterArchetype.CREATOR,
      
      'revolutionary': CharacterArchetype.REBEL,
      'outlaw': CharacterArchetype.REBEL,
      'misfit': CharacterArchetype.REBEL,
      
      'naive': CharacterArchetype.INNOCENT,
      'pure': CharacterArchetype.INNOCENT,
      'child': CharacterArchetype.INNOCENT,
      
      'leader': CharacterArchetype.RULER,
      'boss': CharacterArchetype.RULER,
      'controller': CharacterArchetype.RULER,
      
      'clown': CharacterArchetype.JESTER,
      'comedian': CharacterArchetype.JESTER,
      'fool': CharacterArchetype.JESTER
    };
    
    if (normalized in synonymMap) {
      return synonymMap[normalized];
    }
    
    // No match found
    console.warn(`Unknown archetype: ${archetypeString}, returning undefined`);
    return undefined;
  }
} 