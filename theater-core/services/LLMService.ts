/**
 * LLMService - Handles interactions with language models
 */
import { ChatOllama } from "@langchain/ollama";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { z } from "zod";

import { WorldService } from "./WorldService";
import { StoryManager } from "./StoryManager";
import { Emotion } from "../types/common";
import { CharacterAction, PlaywrightAction } from "../types/actions";

// Type to match the Action interface
type ActionBase = {
  actionId: string;
  timestamp: number;
};

/**
 * Schemas for LLM responses
 */

// Schema for character action
const characterActionSchema = z.object({
  characterId: z.string(),
  speech: z.string().optional(),
  thought: z.string().optional(),
  emotion: z.nativeEnum(Emotion).optional(),
  movement: z.object({
    x: z.number(),
    y: z.number()
  }).optional(),
  interactionTarget: z.string().optional(),
  interactionType: z.string().optional()
}).transform(data => ({
  actionId: Date.now().toString(),
  timestamp: Date.now(),
  ...data
}));

// Schema for director action (formerly playwright action)
const directorActionSchema = z.object({
  type: z.enum(["narration", "scene_change", "new_character", "new_prop", "advance_rotation"]),
  description: z.string().optional(),
  newSceneName: z.string().optional(),
  newSceneDescription: z.string().optional(),
  characterName: z.string().optional(),
  characterTraits: z.array(z.string()).optional().default([]),
  characterArchetype: z.string().optional(),
  characterBackstory: z.string().optional(),
  characterAppearance: z.string().optional(),
  characterGoal: z.string().optional(),
  characterEmotion: z.nativeEnum(Emotion).optional().default(Emotion.NEUTRAL),
  propType: z.string().optional(),
  propName: z.string().optional(),
  propDescription: z.string().optional(),
  propPosition: z.object({
    x: z.number(),
    y: z.number()
  }).optional().default({ x: 50, y: 50 })
}).transform(action => {
  const baseAction: ActionBase = {
    actionId: Date.now().toString(),
    timestamp: Date.now()
  };

  if (action.type === 'narration') {
    return {
      ...baseAction,
      narration: action.description
    };
  }
  
  if (action.type === 'scene_change') {
    return {
      ...baseAction,
      sceneChange: {
        newSceneId: action.newSceneName!,
        description: action.newSceneDescription || 'The scene changes.'
      }
    };
  }
  
  if (action.type === 'new_character') {
    return {
      ...baseAction,
      newCharacters: [{
        name: action.characterName!,
        traits: action.characterTraits,
        position: { x: 50, y: 50 },
        initialEmotion: action.characterEmotion || Emotion.NEUTRAL,
        description: action.characterBackstory || `A new character named ${action.characterName}`
      }]
    };
  }
  
  if (action.type === 'new_prop') {
    return {
      ...baseAction,
      newProps: [{
        propType: action.propType!,
        position: action.propPosition,
        description: action.propDescription || `A ${action.propType}`
      }]
    };
  }
  
  return baseAction;
});

// Schema for character turn response
const characterTurnResponseSchema = z.object({
  narrativeDescription: z.string(),
  action: characterActionSchema,
  suggestedResponse: z.string().optional()
});

// Schema for director turn response (formerly playwright)
const directorTurnResponseSchema = z.object({
  narrativeDescription: z.string(),
  actions: z.array(directorActionSchema),
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

When specifying emotions, use one of the following values exactly:
${Object.values(Emotion).join(', ')}
`;

  private readonly DIRECTOR_SYSTEM_PROMPT = `
You are the Director of an interactive theatrical experience.
Your job is to manage the flow of the narrative, introduce new elements, and guide the story.
You will be given information about the current state of the world, the characters, and recent events.
Based on this information, you may:
1. Provide narration
2. Change the scene
3. Introduce new characters
4. Add new props
5. Direct which character should act next

When specifying character emotions, use one of the following values exactly:
${Object.values(Emotion).join(', ')}
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
    world: WorldService,
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
When specifying an emotion, use one of the following exact values: ${Object.values(Emotion).join(', ')}
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
      
      // Ensure the characterId from the context is used if not specified
      const action = {
        ...response.action,
        characterId: response.action.characterId || characterId
      } as CharacterAction;
      
      return {
        narrativeDescription: response.narrativeDescription,
        action,
        suggestedResponse: response.suggestedResponse
      };
    } catch (error) {
      console.error("Error generating character action:", error);
      
      // Fallback to a default action with required fields
      return {
        narrativeDescription: `${character.name} seems lost in thought.`,
        action: {
          characterId: characterId,
          actionId: Date.now().toString(),
          timestamp: Date.now(),
          thought: "I'm not sure what to do right now.",
          emotion: character.currentEmotion
        }
      };
    }
  }
  
  /**
   * Generate director actions
   */
  async generateDirectorActions(
    storyManager: StoryManager,
    userInput?: string
  ): Promise<{
    narrativeDescription: string;
    actions: PlaywrightAction[];
    nextCharacterId?: string;
  }> {
    // Get context from the orchestrator
    const context = storyManager.generateLLMContext(userInput);
    
    // Create the prompt
    const promptTemplate = ChatPromptTemplate.fromMessages([
      ["system", this.DIRECTOR_SYSTEM_PROMPT.trim()],
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

As the Director, what actions would you take to move the story forward? Consider:
- Adding narration to set the scene
- Changing the scene if appropriate
- Introducing new characters if needed
- Adding props that could enhance the scene
- Deciding which character should act next

When specifying character emotions, use one of the following exact values: ${Object.values(Emotion).join(', ')}

Provide a narrative description and list the actions you want to take.
`]
    ]);
    
    // Structure the LLM output
    const structuredLLM = this.model.withStructuredOutput(directorTurnResponseSchema);
    
    // Generate the response
    try {
      const prompt = await promptTemplate.invoke({});
      console.log("Director Prompt:", prompt.toString());
      
      const response = await structuredLLM.invoke(prompt);
      console.log("Director LLM Response:", response);
      
      return {
        narrativeDescription: response.narrativeDescription,
        actions: response.actions as PlaywrightAction[],
        nextCharacterId: response.nextCharacterId
      };
    } catch (error) {
      console.error("Error generating director actions:", error);
      
      // Fallback to a default action with required fields
      return {
        narrativeDescription: "The story continues...",
        actions: [{
          actionId: Date.now().toString(),
          timestamp: Date.now(),
          narration: "The scene remains quiet for a moment."
        }]
      };
    }
  }
} 