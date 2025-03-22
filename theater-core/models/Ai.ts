import { z } from "zod";
import { ChatOllama } from "@langchain/ollama";
import { ChatPromptValueInterface } from "@langchain/core/prompt_values";

/**
 * Configuration for the AI
 */
export interface AiConfig {
    model: string;
    baseUrl: string;
}

export class Ai {
    private llm: ChatOllama;

    constructor(aiConfig: AiConfig) {
        this.llm = new ChatOllama({
            baseUrl: aiConfig.baseUrl,
            model: aiConfig.model,
        });
    }

    public async call<T extends z.Schema>(prompt: ChatPromptValueInterface, responseFormat: T): Promise<z.infer<T>> {
        console.log("Prompting LLM with:", prompt.toString());
        const structuredLlm = this.llm.withStructuredOutput(responseFormat);
        const response = await structuredLlm.invoke(prompt);
        console.log("LLM responded with:", response);
        return response;
    }
}
