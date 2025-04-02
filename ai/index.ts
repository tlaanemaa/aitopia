import { callGemini, getGeminiModels } from "./providers/gemini";
import { callOllama, getOllamaModels } from "./providers/ollama";

/**
 * AI providers
 */
export const aiProviders = {
    gemini: {
        call: callGemini,
        getModels: getGeminiModels,
    },
    ollama: {
        call: callOllama,
        getModels: getOllamaModels,
    },
} as const;

export type AiProvider = keyof typeof aiProviders;
export const availableAiProviders = Object.keys(aiProviders) as AiProvider[];
