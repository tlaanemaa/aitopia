"use client";

import { getStore } from "@/store/gameStore";
import { promptLLM } from "./promptLLM";

export async function nextTurn(userInput?: string) {
    const { characters, actionLog, setCharacter, addTurn, setLoading, addLog } = getStore();
    setLoading(true);
    addTurn();
    if (userInput && userInput.trim()) addLog(`The game master said: ${userInput}`);

    const llmResponse = await promptLLM(
        Object.values(characters),
        actionLog
    );

    llmResponse.characterActions.forEach((action) => {
        setCharacter(action);
        console.log("Action:", action);
    });


    if (llmResponse.goAgain) await nextTurn();
    setLoading(false);
}
