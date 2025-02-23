"use client";

import { getStore } from "@/store/gameStore";
import { promptLLM } from "./promptLLM";

export async function nextTurn(userInput?: string, iteration = 0) {
    const { characters, actionLog, setCharacter, addTurn, setLoading, addLog } = getStore();
    try {
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


        if (llmResponse.goAgain && iteration < 10) await nextTurn(undefined, iteration + 1);
    } catch (error) {
        addLog(String(error));
    } finally {
        setLoading(false);
    }
}
