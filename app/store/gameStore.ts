import { z } from "zod";
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { speak } from "./voice";
import { findSafePosition } from "../utils/findSafePosition";

// Constants
export const CHARACTER_WIDTH = 64;
export const CHARACTER_HEIGHT = 64;
export const SCREEN_MARGIN = 100;

// Schema definitions
export const characterSchema = z.object({
  name: z
    .string({ description: 'The name of the character, for example "Bob"' })
    .min(1, "Name is required"),
  speech: z
    .string({ description: "What the character will say next" })
    .default(""),
  thought: z
    .string({ description: "What the character will think next" })
    .default(""),
  positionX: z
    .number({ description: "Where the character will go on the X axis" })
    .transform((val) => Math.max(0, Math.min(100, val)))
    .default(50),
  positionY: z
    .number({ description: "Where the character will go on the Y axis" })
    .transform((val) => Math.max(0, Math.min(100, val)))
    .default(50),
});

export type Character = z.infer<typeof characterSchema>;

export const characterPatchSchema = characterSchema.partial({
  speech: true,
  thought: true,
  positionX: true,
  positionY: true,
});

export type CharacterPatch = z.infer<typeof characterPatchSchema>;

// Helper functions
const formatLogMessage = (message: string): string => {
  const timestamp = new Date().toLocaleTimeString();
  return `[${timestamp}] ${message}`;
};

// State interface
interface GameState {
  // Game state
  turn: number;
  loading: boolean;
  characters: Record<string, Character>;
  actionLog: string[];

  // Actions
  addTurn: () => void;
  setLoading: (loading: boolean) => void;
  setCharacter: (patch: CharacterPatch) => Promise<void>;
  addLog: (message: string) => void;
}

// Create store
export const useGameStore = create<GameState>()(
  immer((set) => ({
    // Initial state
    turn: 0,
    loading: false,
    characters: {},
    actionLog: [],

    // Actions
    addTurn: () => set((state) => ({ turn: state.turn + 1 })),

    setLoading: (loading: boolean) => set({ loading }),

    addLog: (message: string) =>
      set((state) => {
        state.actionLog.push(formatLogMessage(message));
      }),

    setCharacter: async (patch: CharacterPatch) => {
      // Normalize and validate the patch
      const normalizedPatch = {
        ...patch,
        name: patch.name?.trim() || "Unknown",
      };

      // Remove empty strings
      if (!normalizedPatch.speech?.trim()) delete normalizedPatch.speech;
      if (!normalizedPatch.thought?.trim()) delete normalizedPatch.thought;

      // Update state
      set((state) => {
        const characterName = normalizedPatch.name;

        // Log new character creation
        if (!state.characters[characterName]) {
          state.actionLog.push(
            formatLogMessage(
              `A new character named "${characterName}" has entered the story`
            )
          );
        }

        // Create or update character
        const updatedCharacter = characterSchema.parse({
          ...state.characters[characterName],
          ...normalizedPatch,
        });

        // Handle collision avoidance
        if (
          normalizedPatch.positionX != null ||
          normalizedPatch.positionY != null
        ) {
          const otherCharacters = Object.values(state.characters).filter(
            (c) => c.name !== characterName
          );

          const [safeX, safeY] = findSafePosition(
            updatedCharacter.positionX,
            updatedCharacter.positionY,
            otherCharacters
          );

          updatedCharacter.positionX = safeX;
          updatedCharacter.positionY = safeY;
        }

        // Save character
        state.characters[characterName] = updatedCharacter;

        // Log changes
        if (normalizedPatch.speech) {
          state.actionLog.push(
            formatLogMessage(`${characterName} said: ${normalizedPatch.speech}`)
          );
        }

        if (normalizedPatch.thought) {
          state.actionLog.push(
            formatLogMessage(
              `${characterName} thought: ${normalizedPatch.thought}`
            )
          );
        }

        if (
          normalizedPatch.positionX != null ||
          normalizedPatch.positionY != null
        ) {
          state.actionLog.push(
            formatLogMessage(
              `${characterName} moved to x=${updatedCharacter.positionX}, y=${updatedCharacter.positionY}`
            )
          );
        }
      });

      if (normalizedPatch.speech) {
        await speak(normalizedPatch.name, normalizedPatch.speech);
      }
    },
  }))
);

// Export convenience accessor
export const getStore = () => useGameStore.getState();
