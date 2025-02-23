"use client";

import { getStore } from "@/store/gameStore";
import { promptLLM } from "./promptLLM";

export async function nextTurn(userInput: string) {
    const { characters, actionLog, setCharacter, addTurn, setLoading } = getStore();
    setLoading(true);
    const llmResponse = await promptLLM(
        userInput,
        Object.values(characters),
        actionLog
    );

    llmResponse.characterActions.forEach((action) => {
        setCharacter(action);
        console.log("Action:", action);
    });

    addTurn();
    if (llmResponse.goAgain) await nextTurn(userInput);
    setLoading(false);
}
