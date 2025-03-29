import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
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
    public model: string;
    public baseUrl: string;

    constructor(aiConfig: AiConfig) {
        this.model = aiConfig.model;
        this.baseUrl = aiConfig.baseUrl;
    }

    public async call<T extends z.Schema>(prompt: ChatPromptValueInterface, responseFormat: T): Promise<z.infer<T>> {
        const llm = new ChatOllama({
            baseUrl: this.baseUrl,
            model: this.model,
            temperature: 1,
        })

        const wrappedSchema = z.object({
            events: responseFormat.describe("The events that you want to produce."),
        });

        console.log("Prompting LLM with:", prompt.toString());
        const structuredLlm = llm.withStructuredOutput(zodToJsonSchema(wrappedSchema, {
            $refStrategy: "none",
        }));
        const response = await structuredLlm.invoke(prompt, {
            timeout: 60000,
        });
        console.log("LLM responded with:", response);
        return response.events;
    }
}
