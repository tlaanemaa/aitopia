"use client";

import { useCallback, useEffect, useState } from "react";
import { Play } from "@/theater-core";
import { useTheaterStore } from "../store/theaterStore";
import { useSettingsStore } from "../store/settingsStore";
import { speak } from "../utils/voice";
import { AVATAR_URLS } from "../constants";

export function useTheater() {
    const store = useTheaterStore();
    const settings = useSettingsStore();
    const [autoAdvance, setAutoAdvance] = useState(true);

    /**
     * Update ai settings
     */
    useEffect(() => {
        if (!store.play) return;
        store.play.ai.model = settings.modelName;
        store.play.ai.baseUrl = settings.endpoint;
    }, [settings.modelName, settings.endpoint, store]);

    /**
     * Process user input
     */
    const processUserInput = useCallback(async () => {
        if (!store.play) return;
        const userInput = store.inputQueue;
        if (userInput.length === 0) return;
        store.clearInputQueue();
        store.setProcessingUserInput(true);
        await store.play.processTurn(userInput);
        store.setProcessingUserInput(false);
        return store.play.getState();
    }, [store]);

    /**
     * Process character turn
     */
    const processCharacterTurn = useCallback(async () => {
        if (!store.play) return;
        store.play.nextTurn();
        store.setProcessingCharacter(store.play.currentTurnEntity.id);
        await store.play.processTurn();
        store.setProcessingCharacter(null);
        return store.play.getState();
    }, [store]);

    /**
     * Process the next turn
     */
    const processNextTurn = useCallback(async (currentSpeech: Promise<void[]>): Promise<void[]> => {
        const nextStatePromise = store.inputQueue.length > 0
            ? processUserInput()
            : processCharacterTurn();

        // Wait for the next state and current speech to finish
        store.setActiveCharacter(store.activeCharacterId || store.processingCharacterId);
        const [nextState] = await Promise.all([
            nextStatePromise,
            currentSpeech.finally(() => store.setActiveCharacter(store.processingCharacterId))
        ]);

        // Update game state
        if (!nextState) return [];
        store.incrementTurn();
        store.setCharacters(nextState.characters);
        store.setScene(nextState.scene);

        // Return the promise of all the characters speaking
        return Promise.all(
            nextState.characters.filter(c => c.speech).map(c => speak(c.name, c.speech))
        );
    }, [store, processUserInput, processCharacterTurn]);

    /**
     * Main theater loop
     */
    useEffect(() => {
        if (!autoAdvance) return;
        let currentSpeech = Promise.resolve<void[]>([]);
        let running = true;

        const runLoop = async () => {
            while (running) {
                try {
                    currentSpeech = processNextTurn(currentSpeech);
                } finally { }
            }
        }

        runLoop();
        return () => { running = false; };
    }, [autoAdvance, processNextTurn]);

    return {
        // State
        isStarted: () => store.play !== null,
        isProcessing: !!store.processingCharacterId || store.isProcessingUserInput,
        isProcessingUserInput: store.isProcessingUserInput,
        activeCharacterId: store.activeCharacterId,
        processingCharacterId: store.processingCharacterId,

        // Actions
        queueInput: store.queueInput,
        initialize: () => {
            const play = new Play(
                {
                    model: settings.modelName,
                    baseUrl: settings.endpoint
                },
                AVATAR_URLS as string[],
                []
            );
            store.setPlay(play);
        },

        // Auto-advance controls
        autoAdvance,
        setAutoAdvance,

        // Manual control
        processNextTurn
    };
}
