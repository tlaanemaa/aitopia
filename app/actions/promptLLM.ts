"use server";

import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import type { Character } from "@/store/gameStore";
import { characterPatchSchema } from "@/store/gameStore";
import { z } from "zod";

const SYSTEM_PROMPT = `
You are controlling characters in a story. You can move them around, and make them talk and think.
If you want to add a character, simply give them an action.
Avoid stacking characters on top of each other, as this will make it difficult to see them.
`;

const STATE_PROMPT = `
The current state of characters in the game is as follows:
<game_state>
{STATE}
</game_state>

The log of recent actions is as follows:
<action_log>
{ACTION_LOG}
</action_log>
`;

const TASK_PROMPT = `
The user has provided the following input:
{USER_INPUT}

What is your next action?
`

const promptTemplate = ChatPromptTemplate.fromMessages([
    ["system", SYSTEM_PROMPT.trim()],
    ["user", STATE_PROMPT.trim()],
    ["user", TASK_PROMPT.trim()],
])

const model = new ChatOpenAI({
    apiKey: "asd",
    configuration: {
        baseURL: "http://localhost:11434/v1",
    },
    model: "llama3.2:1b",
});

const responseFormat = z.object({
    characterActions: z.array(characterPatchSchema, { description: "The actions you want to take with characters this turn" }),
    goAgain: z.boolean({ description: "Whether you want to take another turn" }),
});

/**
 * Prompts the LLM to take their turn in the game
 */
export async function promptLLM(userInput = "", characters: Character[], actionLog: string[]) {
    const structuredLlm = model.withStructuredOutput(responseFormat);
    const prompt = await promptTemplate.invoke({
        STATE: JSON.stringify(characters, null, 2),
        ACTION_LOG: actionLog.slice(-50).map(x => `- ${x}`).join("\n"),
        USER_INPUT: userInput || "No input provided",
    });
    console.log("Prompting LLM:", prompt.toString());
    const response = await structuredLlm.invoke(prompt);
    console.log("LLM response:", response);
    return response;
}
