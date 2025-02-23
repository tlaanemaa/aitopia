"use server";

import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import type { Character } from "@/store/gameStore";
import { characterPatchSchema } from "@/store/gameStore";
import { z } from "zod";

const SYSTEM_PROMPT = `
You are controlling characters in a story. You can move them around, and make them talk and think.
If you want to add a character, simply give them an action.
`;

const STATE_PROMPT = `
The current state of the characters in the story is the following:
{STATE}
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
    actions: z.array(characterPatchSchema, { description: "The actions to take this turn" }).default([]),
    goAgain: z.boolean({ description: "Whether you want to take another turn" }).default(false),
});

/**
 * Prompts the LLM to take their turn in the game
 */
export async function promptLLM(characters: Character[], userInput = "") {
    console.log("Prompting LLM with characters", characters);
    const structuredLlm = model.withStructuredOutput(responseFormat);
    const prompt = await promptTemplate.invoke({
        STATE: JSON.stringify(characters, null, 2),
        USER_INPUT: userInput || "No input provided",
    });
    const response = await structuredLlm.invoke(prompt);
    console.log("LLM returned", response)
    return response;
}
