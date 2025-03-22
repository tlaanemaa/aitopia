import { z } from "zod";
import { ChatOllama } from "@langchain/ollama";
import { Entity } from "./Entity";
import { ChatPromptValueInterface } from "@langchain/core/prompt_values";

export abstract class LlmEntity extends Entity {
    private llm = new ChatOllama({
        baseUrl: 'http://localhost:11434',
        model: 'gemma3:4b',
    });

    public async callLLm<T extends z.Schema>(prompt: ChatPromptValueInterface, responseFormat: T): Promise<z.infer<T>> {
        console.log("Prompting LLM with:", prompt.toString());
        const structuredLlm = this.llm.withStructuredOutput(responseFormat);
        const response = await structuredLlm.invoke(prompt);
        console.log("LLM responded with:", response);
        return response;
    }
}
