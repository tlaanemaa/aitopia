import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import { ChatPromptValueInterface, } from "@langchain/core/prompt_values";
import { isSystemMessage } from "@langchain/core/messages";
import { aiProviders, AiProvider } from "@/ai";

/**
 * Configuration for the AI
 */
export interface AiConfig {
    model: string;
    baseUrl: string;
    provider: AiProvider;
}

export class Ai {
    public model: string;
    public baseUrl: string;
    public provider: AiProvider;

    constructor(aiConfig: AiConfig) {
        this.model = aiConfig.model;
        this.baseUrl = aiConfig.baseUrl;
        this.provider = aiConfig.provider;
    }

    public async call<T extends z.Schema>(prompt: ChatPromptValueInterface, responseFormat: T): Promise<z.infer<T>> {
        // Wrap the response format to make sure we have a top level object
        const wrappedSchema = z.object({
            events: responseFormat.describe("The events that you want to produce."),
        });

        // Convert the response format to a JSON schema
        const responseSchema = zodToJsonSchema(wrappedSchema, {
            $refStrategy: "none",
        });

        // Convert the prompt to a list of messages
        const messages = prompt.toChatMessages().map(x => ({
            role: isSystemMessage(x) ? "system" : "user" as const,
            content: x.content.toString(),
        } as const));

        // Call the LLM
        console.log(`Prompting ${this.provider} with:`, prompt.toString());
        let response: z.infer<T>;
        switch (this.provider) {
            case "gemini":
                response = await aiProviders.gemini.call(this.model, messages, responseSchema);
                break;
            case "ollama":
                response = await aiProviders.ollama.call(this.model, this.baseUrl, messages, responseSchema);
                break;
        }
        console.log(`${this.provider} responded with:`, response);

        return response.events;
    }
}

