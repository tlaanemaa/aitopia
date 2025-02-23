import { z } from "zod";
import { create } from 'zustand';

export const characterSchema = z.object({
    name: z.string({ description: 'The name of the character' }).default('Unknown'),
    speech: z.string({ description: 'The last thing the character said' }).default(''),
    thought: z.string({ description: 'The last thing the character thought' }).default(''),
    position: z.object({
        x: z.number({ description: 'The x coordinate of the character' }).default(0),
        y: z.number({ description: 'The y coordinate of the character' }).default(0),
    }, { description: 'The position of the character on the screen' }),
});

export type Character = z.infer<typeof characterSchema>;
export const characterPatchSchema = characterSchema.partial();
export type CharacterPatch = z.infer<typeof characterPatchSchema>;

interface GameState {
    actionLog: string[];
    characters: Character[];
    setCharacter: (patch: Partial<Character>) => void;
    setUserInput: (input: string) => void;
    userInput: string;
}

const useGameStore = create<GameState>((set) => ({
    actionLog: [],
    characters: [],
    setCharacter: (patch: Partial<Character>) => set((state) => {
        const characterIndex = state.characters.findIndex((character) => character.name === patch.name);
        if (characterIndex !== -1) {
            // Update existing character
            const updatedCharacters = [...state.characters];
            updatedCharacters[characterIndex] = {
                ...updatedCharacters[characterIndex],
                ...characterPatchSchema.parse(patch)
            };
            return { characters: updatedCharacters };
        } else {
            // Add new character
            return { characters: [...state.characters, characterSchema.parse(patch)] };
        }
    }),
    userInput: '',
    setUserInput: (input: string) => set({ userInput: input }),
    addActionLog: (action: string) => set((state) => ({ actionLog: [...state.actionLog, action] })),
}));

export default useGameStore;
export const getStore = () => useGameStore.getState();