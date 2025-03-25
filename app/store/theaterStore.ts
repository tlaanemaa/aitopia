import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { Play } from "@/theater-core";
import type { CharacterState, MemoryItem, TurnOrder } from "@/theater-core";
import { getSettings } from "./settingsStore";
import { AVATAR_URLS } from '../constants'

interface ErrorRecord {
    timestamp: Date;
    message: string;
}

interface TheaterStore {
    // State
    play: Play;
    autoRun: boolean;
    scene: string;
    characters: CharacterState[];
    activeCharacterId: string | null;     // Who is visually active (speaking)
    processingCharacterId: string | null; // Who is being processed
    turnOrder: TurnOrder;
    inputQueue: string[];
    isProcessing: boolean;
    isProcessingUserInput: boolean;
    turnCount: number;
    directorLog: MemoryItem[];
    errors: ErrorRecord[];

    // Simple actions for state updates
    setAutoRun: (autoRun: boolean) => void;
    setScene: (scene: string) => void;
    setCharacters: (characters: CharacterState[]) => void;
    setActiveCharacter: (id: string | null) => void;
    setProcessingCharacter: (id: string | null) => void;
    setTurnOrder: (turnOrder: TurnOrder) => void;
    queueInput: (input: string) => void;
    clearInputQueue: () => void;
    setProcessing: (isProcessing: boolean) => void;
    setProcessingUserInput: (isProcessing: boolean) => void;
    incrementTurn: () => void;
    setDirectorLog: (log: MemoryItem[]) => void;
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
        setAutoRun: (autoRun) => set({ autoRun }),

        setScene: (scene) => set({ scene }),

        setCharacters: (characters) => set({ characters }),

        setActiveCharacter: (id) => set({ activeCharacterId: id }),

        setProcessingCharacter: (id) => set((state) => ({
            processingCharacterId: id,
            ...(!state.activeCharacterId ? { activeCharacterId: id } : {})
        })),

        setTurnOrder: (turnOrder) => set({ turnOrder }),

        queueInput: (input) => set((state) => ({
            inputQueue: [...state.inputQueue, input]
        })),

        clearInputQueue: () => set({ inputQueue: [] }),

        setProcessing: (isProcessing) => set({ isProcessing }),

        setProcessingUserInput: (isProcessing) => set({ isProcessingUserInput: isProcessing }),

        incrementTurn: () => set((state) => ({
            turnCount: state.turnCount + 1
        })),

        setDirectorLog: (log) => set({ directorLog: log }),

        addError: (error: Error) => set((state) => ({
            errors: [...state.errors, { timestamp: new Date(), message: error.message }]
        }))
    }))
);

/**
 * Get a snapshot of the current theater state
 */
export const getTheaterState = () => useTheaterStore.getState();