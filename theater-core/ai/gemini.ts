"use server";

import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { Messages, JsonSchema } from "./types";
import { ChatPromptTemplate } from "@langchain/core/prompts";
/**
 * Call an LLM from Gemini
 * First message is the system prompt, the rest are user messages
 */
export async function callGemini(model: string, messages: Messages[], responseJsonSchema: JsonSchema) {
    const prompt = await ChatPromptTemplate.fromMessages(messages).invoke({});
    const llm = new ChatGoogleGenerativeAI({
        apiKey: process.env.GEMINI_API_KEY,
        model: "gemini-2.0-flash-lite", // TODO: Hardcoded to avoid someone using an expensive model
        temperature: 1,
    }).withStructuredOutput(responseJsonSchema);

    const response = await llm.invoke(prompt);
    return response;
}
