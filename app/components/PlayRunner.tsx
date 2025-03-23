"use client";

import { useEffect } from "react";
import { useTheaterStore, getTheaterState } from "../store/theaterStore";
import { useSettingsStore } from "../store/settingsStore";
import { speak, initializeVoices } from "../utils/voice";

/**
 * Process user input
 */
const processUserInput = async () => {
  console.log("Processing user input");
  const store = getTheaterState();
  if (!store.play) return;
  const userInput = store.inputQueue;
  if (userInput.length === 0) return;
  store.clearInputQueue();
  store.setProcessingUserInput(true);
  await store.play.processTurn(userInput);
  store.setProcessingUserInput(false);
  return store.play.getState();
};

/**
 * Process character turn
 */
const processCharacterTurn = async () => {
  console.log("Processing character turn");
  const store = getTheaterState();
  if (!store.play) return;
  store.play.nextTurn();
  store.setProcessingCharacter(store.play.currentTurnEntity.id);
  await store.play.processTurn();
  store.setProcessingCharacter(null);
  return store.play.getState();
};

/**
 * Process the next turn
 */
const processNextTurn = async (): Promise<Promise<void>[]> => {
  console.log("Processing next turn");
  const store = getTheaterState();
  const nextState =
    store.inputQueue.length > 0
      ? await processUserInput()
      : await processCharacterTurn();

  // Update game state
  if (!nextState) return [];
  store.incrementTurn();
  store.setCharacters(nextState.characters);
  store.setScene(nextState.scene);

  // Return the promise of all the characters speaking
  return nextState.characters
    .filter((c) => c.speech)
    .map((c) => speak(c.name, c.speech));
};

/**
 * Run the turn loop
 */
const runTurnLoop = async () => {
  let currentSpeech = [Promise.resolve()];
  while (getTheaterState().autoRun) {
    const { play, addError } = getTheaterState();
    try {
      if (!play) throw new Error("Play not found");
      const [nextSpeech] = await Promise.all([
        processNextTurn(),
        currentSpeech,
      ]);
      currentSpeech = nextSpeech;
    } catch (error) {
      console.error(error);
      addError(error as Error);
    } finally {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }
};

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
