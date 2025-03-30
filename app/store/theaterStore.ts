import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { Play } from "@/theater-core";
import type { PlayState } from "@/theater-core";
import { getSettings } from "./settingsStore";
import { AVATAR_URLS } from '../constants'

interface ErrorRecord {
    timestamp: Date;
    message: string;
}

interface TheaterStore {
    // State
    play: Play;
    scene: PlayState['scene'];
    characters: PlayState['characters'];
    directorLog: PlayState['directorLog'];
    turnOrder: PlayState['turnOrder'];
    autoRun: boolean;
    activeCharacterId: string | null;     // Who is visually active (speaking)
    processingCharacterId: string | null; // Who is being processed
    inputQueue: string[];
    isProcessing: boolean;
    isProcessingUserInput: boolean;
    turnCount: number;
    errors: ErrorRecord[];

    // Simple actions for state updates
    syncPlayState: () => void;
    setAutoRun: (autoRun: boolean) => void;
    setActiveCharacter: (id: string | null) => void;
    setProcessingCharacter: (id: string | null) => void;
    queueInput: (input: string) => void;
    clearInputQueue: () => void;
    setProcessing: (isProcessing: boolean) => void;
    setProcessingUserInput: (isProcessing: boolean) => void;
    incrementTurn: () => void;
    addError: (error: Error) => void;
}

export const useTheaterStore = create<TheaterStore>()(
    immer((set) => ({
        // Initial state
        play: new Play(
            {
                model: getSettings().modelName,
                baseUrl: getSettings().endpoint,
            },
            AVATAR_URLS,
            []
        ),
        autoRun: false,
        scene: "",
        characters: [],
        activeCharacterId: null,
        processingCharacterId: null,
        turnOrder: [],
        inputQueue: [],
        isProcessing: false,
        isProcessingUserInput: false,
        turnCount: 0,
        directorLog: [],
        errors: [],

        // Actions
        syncPlayState: () => set((state) => {
            const playState = state.play.getState();
            state.scene = playState.scene;
            state.characters = playState.characters;
            state.turnOrder = playState.turnOrder;
            state.directorLog = playState.directorLog;
        }),

        setAutoRun: (autoRun) => set({ autoRun }),

        setActiveCharacter: (id) => set({ activeCharacterId: id }),

        setProcessingCharacter: (id) => set({ processingCharacterId: id }),

        queueInput: (input) => set((state) => ({
            inputQueue: [...state.inputQueue, input]
        })),

        clearInputQueue: () => set({ inputQueue: [] }),

        setProcessing: (isProcessing) => set({ isProcessing }),

        setProcessingUserInput: (isProcessing) => set({ isProcessingUserInput: isProcessing }),

        incrementTurn: () => set((state) => ({
            turnCount: state.turnCount + 1
        })),

        addError: (error: Error) => set((state) => ({
            errors: [...state.errors, { timestamp: new Date(), message: error.message }]
        }))
    }))
);

/**
 * Get a snapshot of the current theater state
 */
export const getTheaterState = () => useTheaterStore.getState();