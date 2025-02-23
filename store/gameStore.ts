import { z } from "zod";
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer'

export const characterSchema = z.object({
    name: z.string({ description: 'The name of the character, for example "Bob"', }),
    speech: z.string({ description: 'The last thing the character said' }),
    thought: z.string({ description: 'The last thing the character thought' }),
    positionX: z.number({ description: 'The x coordinate of the character' }),
    positionY: z.number({ description: 'The y coordinate of the character' }),
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

        characters: {},
        setCharacter: (patch: CharacterPatch) => set((state) => {
            // Get the target character
            if (state.characters[patch.name] == null) {
                state.actionLog.push(`A new character named "${patch.name}" has entered the story`);
                state.characters[patch.name] = characterSchema.parse({ name: patch.name, speech: '', thought: '', positionX: 0, positionY: 0 });
            }

            // Update the character state
            const parsedPatch = characterPatchSchema.parse(patch);
            state.characters[patch.name] = { ...state.characters[patch.name], ...parsedPatch };

            // Add log entries
            if (patch.speech != null) state.actionLog.push(`${patch.name} said: ${patch.speech}`);
            if (patch.thought != null) state.actionLog.push(`${patch.name} thought: ${patch.thought}`);
            if (patch.positionX != null || patch.positionY != null) state.actionLog.push(`${patch.name} moved to x=${patch.positionX}, y=${patch.positionY}`);
        }),

        actionLog: [],

        userInput: '',
        setUserInput: (input: string) => set({ userInput: input }),
    }))
);

export default useGameStore;
export const getStore = () => useGameStore.getState();