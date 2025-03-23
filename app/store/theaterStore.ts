import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { CharacterState, Play } from "@/theater-core";

interface TheaterStore {
    // State
    play: Play | null;
    scene: string;
    characters: CharacterState[];
    activeCharacterId: string | null;     // Who is visually active (speaking)
    processingCharacterId: string | null; // Who is being processed
    inputQueue: string[];
    isProcessing: boolean;
    isProcessingUserInput: boolean;
    turnCount: number;

    // Simple actions for state updates
    setPlay: (play: Play | null) => void;
    setScene: (scene: string) => void;
    setCharacters: (characters: CharacterState[]) => void;
    setActiveCharacter: (id: string | null) => void;
    setProcessingCharacter: (id: string | null) => void;
    queueInput: (input: string) => void;
    clearInputQueue: () => void;
    setProcessing: (isProcessing: boolean) => void;
    setProcessingUserInput: (isProcessing: boolean) => void;
    incrementTurn: () => void;
}

export const useTheaterStore = create<TheaterStore>()(
    immer((set) => ({
        // Initial state
        play: null,
        scene: "",
        characters: [],
        activeCharacterId: null,
        processingCharacterId: null,
        inputQueue: [],
        isProcessing: false,
        isProcessingUserInput: false,
        turnCount: 0,

        // Actions
        setPlay: (play) => set({ play }),

        setScene: (scene) => set({ scene }),

        setCharacters: (characters) => set({ characters }),

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
        }))
    }))
);