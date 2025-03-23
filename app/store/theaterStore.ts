import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { CharacterState, Play } from "../../theater-core";
import { CHARACTER_IMAGES } from "../constants";
import { getSettings } from "./settingsStore";


interface TheaterStore {
    // State
    play: Play | null;
    scene: string;
    characters: CharacterState[];
    activeCharacterId: string | null;
    inputQueue: string[];
    processingUserInput: boolean;
    turnCount: number;
    isProcessing: boolean;
    flagToStop: boolean;

    // Actions
    isStarted: () => boolean;
    initialize: () => void;
    queueInput: (input: string) => void;
    startLoop: () => Promise<void>;
    stopLoop: () => void;
}

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const useTheaterStore = create<TheaterStore>()(
    immer((set, get) => ({
        // Initial state
        play: null,
        scene: "",
        characters: [],
        activeCharacterId: null,
        inputQueue: [],
        processingUserInput: false,
        turnCount: 0,
        isProcessing: false,
        flagToStop: false,

        isStarted: () => {
            const { play, turnCount } = get();
            return play !== null && turnCount > 0;
        },

        initialize() {
            const settings = getSettings();
            const aiConfig = {
                model: settings.modelName,
                baseUrl: settings.endpoint
            };

            set((state) => {
                // Create a new Play and sync our state with it
                state.play = new Play(aiConfig, [...CHARACTER_IMAGES]);
                state.turnCount = 0;
                const playState = state.play.getState();
                state.characters = playState.characters;
                state.scene = playState.scene;
            });
        },

        // Queue user input (to be processed on next turn)
        queueInput(input: string) {
            set((state) => {
                state.inputQueue.push(input);
            });
        },

        // Process the next turn (and handle any queued input)
        async startLoop() {
            try {
                set(() => ({ isProcessing: true }));
                while (!get().flagToStop) {
                    const { play, inputQueue, isProcessing, turnCount } = get();
                    if (!play || isProcessing) return;

                    // If there is no input, proceed to the next turn
                    if (inputQueue.length === 0) {
                        play.nextTurn()
                        set(() => ({ activeCharacterId: play.currentTurnEntity.id }));
                    }

                    // Process the turn, with any queued input
                    set(() => ({ inputQueue: [] }));
                    await play.processTurn(inputQueue);

                    // Update state
                    const playState = play.getState();
                    set(() => ({
                        characters: playState.characters,
                        scene: playState.scene,
                        turnCount: turnCount + 1,
                    }));

                    // Wait a bit
                    await wait(100);
                }
            } finally {
                set(() => ({ isProcessing: false }));
            }
        },

        stopLoop() {
            set(() => ({ flagToStop: true }));
        }
    })
    ));