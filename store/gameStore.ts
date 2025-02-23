import { z } from "zod";
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer'
import { readOutLoud } from "./voice";

const toLog = (message: string) => {
    const ts = new Date().toLocaleTimeString();
    return `[${ts}] ${message}`
};

export const characterSchema = z.object({
    name: z.string({ description: 'The name of the character, for example "Bob"', }),
    speech: z.string({ description: 'The last thing the character said' }),
    thought: z.string({ description: 'The last thing the character thought' }),
    positionX: z.number({ description: 'The x coordinate of the character. From 0 to 100 where 50 is the middle of the screen' }),
    positionY: z.number({ description: 'The y coordinate of the character. From 0 to 100 where 50 is the middle of the screen' }),
});

export type Character = z.infer<typeof characterSchema>;
export const characterPatchSchema = characterSchema.partial({ speech: true, thought: true, positionX: true, positionY: true });
export type CharacterPatch = z.infer<typeof characterPatchSchema>;

interface GameState {
    turn: number;
    addTurn: () => void;
    loading: boolean;
    setLoading: (loading: boolean) => void;
    characters: Record<Character["name"], Character>;
    setCharacter: (patch: CharacterPatch) => void;
    actionLog: string[];
    addLog: (message: string) => void;
    userInput: string;
    setUserInput: (input: string) => void;
}

export const useGameStore = create<GameState>()(
    immer((set) => ({
        turn: 0,
        addTurn: () => set((state) => ({ turn: state.turn + 1 })),

        loading: false,
        setLoading: (loading: boolean) => set({ loading }),

        characters: {
            // "Zorg": characterSchema.parse({ name: "Zorg", speech: "I am Zorg", thought: "I am Zorg, I think.", positionX: 20, positionY: 20 }),
        },
        setCharacter: (patch: CharacterPatch) => set((state) => {
            // Parse the patch
            const parsedPatch = characterPatchSchema.parse(patch);
            parsedPatch.name = parsedPatch.name.trim() || 'Unknown';
            parsedPatch.positionX = Math.max(0, Math.min(100, parsedPatch.positionX ?? 50));
            parsedPatch.positionY = Math.max(0, Math.min(100, parsedPatch.positionY ?? 50));

            // Get the target character
            if (state.characters[parsedPatch.name] == null) {
                state.actionLog.push(toLog(`A new character named "${parsedPatch.name}" has entered the story`));
                state.characters[parsedPatch.name] = characterSchema.parse({ name: parsedPatch.name, speech: '', thought: '', positionX: 0, positionY: 0 });
            }

            // PApply the patch
            if (!parsedPatch.speech?.trim()) delete parsedPatch.speech;
            if (!parsedPatch.thought?.trim()) delete parsedPatch.thought;
            state.characters[parsedPatch.name] = { ...state.characters[parsedPatch.name], ...parsedPatch };

            // Add log entries
            if (parsedPatch.speech) state.actionLog.push(toLog(`${parsedPatch.name} said: ${parsedPatch.speech}`));
            if (parsedPatch.thought) state.actionLog.push(toLog(`${parsedPatch.name} thought: ${parsedPatch.thought}`));
            if (parsedPatch.positionX != null || parsedPatch.positionY != null) {
                state.actionLog.push(toLog(`${parsedPatch.name} moved to x=${parsedPatch.positionX}, y=${parsedPatch.positionY}`));
            }

            // Read out loud the character's speech
            if (parsedPatch.speech) readOutLoud(parsedPatch.name, parsedPatch.speech);
        }),

        actionLog: [],
        addLog: (message: string) => set((state) => {
            state.actionLog.push(toLog(message));
        }),

        userInput: '',
        setUserInput: (input: string) => set({ userInput: input }),
    }))
);

export default useGameStore;
export const getStore = () => useGameStore.getState();