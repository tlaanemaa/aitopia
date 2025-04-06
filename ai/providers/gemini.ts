"use server";

import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { Messages, JsonSchema } from "../types";
import { ChatPromptTemplate } from "@langchain/core/prompts";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_PASSWORD = process.env.GEMINI_PASSWORD;

/**
 * Call an LLM from Gemini
 * First message is the system prompt, the rest are user messages
 */
export async function callGemini(model: string, geminiKey: string, messages: Messages[], responseJsonSchema: JsonSchema) {
    const prompt = await ChatPromptTemplate.fromMessages(messages).invoke({});
    const models = await getGeminiModels();
    const llm = new ChatGoogleGenerativeAI({
        apiKey: geminiKey === GEMINI_PASSWORD ? GEMINI_API_KEY : geminiKey,
        // Make sure it's one of our models to prevent abuse
        model: models.find(m => m === model) ?? models[0],
        temperature: 1,
    }).withStructuredOutput(responseJsonSchema);

    const response = await llm.invoke(prompt);
    return response;
}

/**
 * Get the list of Gemini models
 */
export async function getGeminiModels() {
    return [
        "gemini-2.0-flash-lite",
        "gemini-2.0-flash",
    ] as const
}