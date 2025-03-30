export type JsonSchema = object;

export type Messages = {
    role: "system" | "user";
    content: string;
};

export type AiProvider = "gemini" | "ollama";
