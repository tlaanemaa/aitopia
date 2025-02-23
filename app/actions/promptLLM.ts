"use server";

import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import type { Character } from "@/store/gameStore";
import { characterPatchSchema } from "@/store/gameStore";
import { z } from "zod";

const SYSTEM_PROMPT = `
You are the game master, controlling characters in the story. You can move characters, make them speak, and have them think. 
To add a character, simply assign them an action. 
Please avoid placing characters on top of each other, as it will hinder visibility.
`;

const STATE_PROMPT = `
Current character states in the game:
<game_state>
{STATE}
</game_state>

Recent actions taken:
<action_log>
{ACTION_LOG}
</action_log>
`;

const TASK_PROMPT = `
What action do you want to take next?
`;

const promptTemplate = ChatPromptTemplate.fromMessages([
    ["system", SYSTEM_PROMPT.trim()],
    ["user", STATE_PROMPT.trim()],
    ["user", TASK_PROMPT.trim()],
])

const model = new ChatOpenAI({
    apiKey: "asd",
    configuration: {
        baseURL: "http://192.168.1.29:11434/v1",
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
export async function promptLLM(characters: Character[], actionLog: string[]) {
    const structuredLlm = model.withStructuredOutput(responseFormat);
    const prompt = await promptTemplate.invoke({
        STATE: JSON.stringify(characters, null, 2),
        ACTION_LOG: actionLog.slice(-50).map(x => `- ${x}`).join("\n"),
    });
    console.log("Prompting LLM:", prompt.toString());
    const response = await structuredLlm.invoke(prompt);
    console.log("LLM response:", response);
    return response;
}
