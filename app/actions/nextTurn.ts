"use client";

import { getStore } from "@/store/gameStore";
import { getSettings } from "@/store/settingsStore";
import { promptLLM } from "./promptLLM";

export async function nextTurn(userInput?: string, iteration = 0) {
    const { addLog } = getStore();
    if (userInput && userInput.trim()) addLog(`The game master added these instructions: ${userInput}`);
    const { characters, actionLog, setCharacter, addTurn, setLoading } = getStore();

    try {
        setLoading(true);
        addTurn();

        const { endpoint, modelName } = getSettings();

        const llmResponse = await promptLLM({
            characters: Object.values(characters),
            actionLog,
            endpoint,
            modelName,
        });

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
