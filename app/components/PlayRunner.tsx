"use client";

import { useEffect } from "react";
import { useTheaterStore, getTheaterState } from "../store/theaterStore";
import { useSettingsStore } from "../store/settingsStore";
import { speak, initializeVoices } from "../utils/voice";

/**
 * Process user input
 */
async function processUserInput() {
  console.log("Processing user input");
  const store = getTheaterState();
  if (!store.play) throw new Error("Play not found");
  const userInput = store.inputQueue;
  store.clearInputQueue();
  store.setProcessingUserInput(true);
  await store.play.processTurn(userInput);
  store.setProcessingUserInput(false);
  return store.play.getState();
}

/**
 * Process character turn
 */
async function processCharacterTurn() {
  console.log("Processing character turn");
  const store = getTheaterState();
  if (!store.play) throw new Error("Play not found");
  store.setProcessingCharacter(store.play.currentTurnEntity.id);
  store.play.nextTurn();
  await store.play.processTurn();
  store.setProcessingCharacter(null);
  return store.play.getState();
}

/**
 * Process the next turn
 */
async function processNextTurn(): Promise<Promise<void>[]> {
  console.log("Processing next turn");
  const { inputQueue } = getTheaterState();
  const nextState =
    inputQueue.length > 0
      ? await processUserInput()
      : await processCharacterTurn();

  // Update game state
  getTheaterState().syncPlayState();

  // Return the promise of all the characters speaking
  return nextState.characters
    .filter((c) => c.speech)
    .map((c) => speak(c.name, c.speech));
}

/**
 * Run the turn loop
 */
async function runTurnLoop() {
  getTheaterState().syncPlayState();
  let currentSpeeches = [Promise.resolve()];
  // It's important to get the new state every time.
  while (getTheaterState().autoRun) {
    try {
      getTheaterState().incrementTurn();
      const [nextSpeeches] = await Promise.all([
        processNextTurn(),
        Promise.all(currentSpeeches).then(() => {
          const { play, setActiveCharacter } = getTheaterState();
          setActiveCharacter(play.currentTurnEntity.id);
        }),
      ]);

      currentSpeeches = nextSpeeches;
    } catch (error) {
      console.error(error);
      getTheaterState().addError(error as Error);
    } finally {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }
}

/**
 * PlayRunner component
 */
export default function PlayRunner() {
  const modelName = useSettingsStore((state) => state.modelName);
  const endpoint = useSettingsStore((state) => state.endpoint);
  const play = useTheaterStore((state) => state.play);
  const autoRun = useTheaterStore((state) => state.autoRun);

  /**
   * Update ai settings
   */
  useEffect(() => {
    if (!play) return;
    play.ai.model = modelName;
    play.ai.baseUrl = endpoint;
  }, [modelName, endpoint, play]);

  /**
   * Trigger the turn loop when autoRun is true
   */
  useEffect(() => {
    if (autoRun) runTurnLoop();
  }, [autoRun]);

  // Initialize voices
  useEffect(() => {
    initializeVoices();
  }, []);

  return null;
}
