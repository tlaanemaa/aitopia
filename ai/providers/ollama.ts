import { z } from "zod";
import { ChatOllama } from "@langchain/ollama";
import { JsonSchema, Messages } from "../types";
import { ChatPromptTemplate } from "@langchain/core/prompts";

/**
 * Call an LLM from Ollama
 */
export async function callOllama<T extends z.Schema>(
    model: string,
    baseUrl: string,
    messages: Messages[],
    responseJsonSchema: JsonSchema
): Promise<z.infer<T>> {
    const prompt = await ChatPromptTemplate.fromMessages(messages).invoke({});
    const llm = new ChatOllama({
        model,
        baseUrl,
        temperature: 1,
    }).withStructuredOutput(responseJsonSchema);

    const response = await llm.invoke(prompt, { timeout: 60000 });
    return response;
}

/**
 * Get the list of Ollama models
 */
export async function getOllamaModels(baseUrl: string) {
    const response = await fetch(`${baseUrl}/api/tags`);
    const data = await response.json();
    const models: string[] = data.models.map(
        (model: { name: string }) => model.name
    );
    return models;
}