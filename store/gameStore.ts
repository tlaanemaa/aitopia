import { z } from "zod";
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { speak } from "./voice";

const toLog = (message: string) => {
  const ts = new Date().toLocaleTimeString();
  return `[${ts}] ${message}`;
};

export const characterSchema = z.object({
  name: z.string({
    description: 'The name of the character, for example "Bob"',
  }),
  speech: z.string({ description: "The last thing the character said" }),
  thought: z.string({ description: "The last thing the character thought" }),
  positionX: z.number({
    description:
      "The x coordinate of the character. From 0 to 100 where 50 is the middle of the screen",
  }),
  positionY: z.number({
    description:
      "The y coordinate of the character. From 0 to 100 where 50 is the middle of the screen",
  }),
});

export type Character = z.infer<typeof characterSchema>;
export const characterPatchSchema = characterSchema.partial({
  speech: true,
  thought: true,
  positionX: true,
  positionY: true,
});
export type CharacterPatch = z.infer<typeof characterPatchSchema>;

interface GameState {
  turn: number;
  addTurn: () => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
  characters: Record<Character["name"], Character>;
  setCharacter: (patch: CharacterPatch) => Promise<void>;
  actionLog: string[];
  addLog: (message: string) => void;
  userInput: string;
  setUserInput: (input: string) => void;
}

const CHAR_SIZE = 16; // Size in percentage of screen
const MIN_DISTANCE = CHAR_SIZE * 1.5; // Minimum distance between characters

function getDistance(x1: number, y1: number, x2: number, y2: number) {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

function findSafePosition(
  targetX: number,
  targetY: number,
  existingCharacters: Character[],
  attempts = 8
): [number, number] {
  // If no collision, return original position
  if (!existingCharacters.some(char => 
    getDistance(targetX, targetY, char.positionX, char.positionY) < MIN_DISTANCE
  )) {
    return [targetX, targetY];
  }

  // Try positions in a growing circle
  for (let i = 1; i <= attempts; i++) {
    const radius = MIN_DISTANCE * i / 2;
    for (let angle = 0; angle < 360; angle += 45) {
      const radian = (angle * Math.PI) / 180;
      const newX = Math.max(0, Math.min(100, targetX + radius * Math.cos(radian)));
      const newY = Math.max(0, Math.min(100, targetY + radius * Math.sin(radian)));

      if (!existingCharacters.some(char =>
        getDistance(newX, newY, char.positionX, char.positionY) < MIN_DISTANCE
      )) {
        return [newX, newY];
      }
    }
  }

  // If no safe position found, return original but clamped to bounds
  return [
    Math.max(0, Math.min(100, targetX)),
    Math.max(0, Math.min(100, targetY))
  ];
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
    setCharacter: (patch: CharacterPatch) => {
      // Parse the patch
      const parsedPatch = characterPatchSchema.parse(patch);
      parsedPatch.name = parsedPatch.name.trim() || "Unknown";
      parsedPatch.positionX = Math.max(
        0,
        Math.min(100, parsedPatch.positionX ?? 50)
      );
      parsedPatch.positionY = Math.max(
        0,
        Math.min(100, parsedPatch.positionY ?? 50)
      );

      // Update state first
      set((state) => {
        // Get or create character
        if (state.characters[parsedPatch.name] == null) {
          state.actionLog.push(
            toLog(
              `A new character named "${parsedPatch.name}" has entered the story`
            )
          );
          state.characters[parsedPatch.name] = characterSchema.parse({
            name: parsedPatch.name,
            speech: "",
            thought: "",
            positionX: 0,
            positionY: 0,
          });
        }

        // If position is being updated, check for collisions
        if (parsedPatch.positionX != null || parsedPatch.positionY != null) {
          const targetX = parsedPatch.positionX ?? state.characters[parsedPatch.name].positionX;
          const targetY = parsedPatch.positionY ?? state.characters[parsedPatch.name].positionY;
          
          const otherCharacters = Object.values(state.characters).filter(
            c => c.name !== parsedPatch.name
          );

          const [safeX, safeY] = findSafePosition(targetX, targetY, otherCharacters);
          parsedPatch.positionX = safeX;
          parsedPatch.positionY = safeY;
        }

        // Apply the patch
        if (!parsedPatch.speech?.trim()) delete parsedPatch.speech;
        if (!parsedPatch.thought?.trim()) delete parsedPatch.thought;
        state.characters[parsedPatch.name] = {
          ...state.characters[parsedPatch.name],
          ...parsedPatch,
        };

        // Add log entries
        if (parsedPatch.speech)
          state.actionLog.push(
            toLog(`${parsedPatch.name} said: ${parsedPatch.speech}`)
          );
        if (parsedPatch.thought)
          state.actionLog.push(
            toLog(`${parsedPatch.name} thought: ${parsedPatch.thought}`)
          );
        if (parsedPatch.positionX != null || parsedPatch.positionY != null) {
          state.actionLog.push(
            toLog(
              `${parsedPatch.name} moved to x=${parsedPatch.positionX}, y=${parsedPatch.positionY}`
            )
          );
        }
      });

      // Return the speech promise (or a resolved promise if no speech)
      return parsedPatch.speech
        ? speak(parsedPatch.name, parsedPatch.speech)
        : Promise.resolve();
    },

    actionLog: [],
    addLog: (message: string) =>
      set((state) => {
        state.actionLog.push(toLog(message));
      }),

    userInput: "",
    setUserInput: (input: string) => set({ userInput: input }),
  }))
);

export default useGameStore;
export const getStore = () => useGameStore.getState();
