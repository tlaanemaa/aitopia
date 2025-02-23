import { z } from "zod";
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer'

const toLog = (message: string) => {
    const ts = new Date().toLocaleString();
    return `[${ts}] ${message}`
};

export const characterSchema = z.object({
    name: z.string({ description: 'The name of the character, for example "Bob"', }),
    speech: z.string({ description: 'The last thing the character said' }),
    thought: z.string({ description: 'The last thing the character thought' }),
    positionX: z.number({ description: 'The x coordinate of the character. From 0 to 100' }),
    positionY: z.number({ description: 'The y coordinate of the character. From 0 to 100' }),
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
            // "Zorg": characterSchema.parse({ name: "Zorg", speech: "I am Zorg", thought: "I am Zorg, I think.", positionX: 200, positionY: 100 }),
        },
        setCharacter: (patch: CharacterPatch) => set((state) => {
            // Get the target character
            if (state.characters[patch.name] == null) {
                state.actionLog.push(toLog(`A new character named "${patch.name}" has entered the story`));
                state.characters[patch.name] = characterSchema.parse({ name: patch.name, speech: '', thought: '', positionX: 0, positionY: 0 });
            }

            // Parse and apply the patch
            const parsedPatch = characterPatchSchema.parse(patch);
            if (!parsedPatch.speech?.trim()) delete parsedPatch.speech;
            if (!parsedPatch.thought?.trim()) delete parsedPatch.thought;
            state.characters[patch.name] = { ...state.characters[patch.name], ...parsedPatch };

            // Add log entries
            if (parsedPatch.speech) state.actionLog.push(toLog(`${patch.name} said: ${patch.speech}`));
            if (parsedPatch.thought) state.actionLog.push(toLog(`${patch.name} thought: ${patch.thought}`));
            if (patch.positionX != null || patch.positionY != null) state.actionLog.push(toLog(`${patch.name} moved to x=${patch.positionX}, y=${patch.positionY}`));
        }),

        actionLog: [],

        userInput: '',
        setUserInput: (input: string) => set({ userInput: input }),
    }))
);

export default useGameStore;
export const getStore = () => useGameStore.getState();