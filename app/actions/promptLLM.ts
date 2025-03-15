// "use server";

import { ChatOllama } from "@langchain/ollama";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { Character, characterPatchSchema } from "../store/gameStore";
import { z } from "zod";

const SYSTEM_PROMPT = `
You are responsible for managing the narrative flow of the game.
Control character actions, dialogue, and internal thoughts based on the current state and past actions.
When a new character is needed, assign it an appropriate action.
Keep the story moving forward and make it interesting and engaging! Make it fun!
`;

const TASK_PROMPT = `
Current character states in the game:
<game_state>
{STATE}
</game_state>

Recent actions taken:
<action_log>
{ACTION_LOG}
</action_log>

Please return the list of characters and actions you want them to take.
Do not repeat previous actions!
`;

const promptTemplate = ChatPromptTemplate.fromMessages([
  ["system", SYSTEM_PROMPT.trim()],
  ["user", TASK_PROMPT.trim()],
]);

const responseFormat = z.object({
  narrativeDescription: z.string({
    description: "A description of what happens next in the story. Make it interesting.",
  }),
  characterActions: z.array(characterPatchSchema, {
    description: "The list of characters and actions you want them to take",
  }),
  goAgain: z.boolean({ description: "Whether you want to take another turn" }),
});

type CallParams = {
  characters: Character[];
  actionLog: string[];
  endpoint: string;
  modelName: string;
};

/**
 * Prompts the LLM to take their turn in the game
 */
export async function promptLLM({
  characters,
  actionLog,
  endpoint,
  modelName,
}: CallParams) {
  const model = new ChatOllama({
    baseUrl: endpoint,
    model: modelName,
  });

  const structuredLlm = model.withStructuredOutput(responseFormat);
  const prompt = await promptTemplate.invoke({
    STATE: JSON.stringify(characters, null, 2),
    ACTION_LOG: actionLog
      .slice(-50)
      .map((x) => `- ${x}`)
      .join("\n"),
  });
  console.log("Prompting LLM:", prompt.toString());
  const response = await structuredLlm.invoke(prompt);
  console.log("LLM response:", response);
  return response;
}
