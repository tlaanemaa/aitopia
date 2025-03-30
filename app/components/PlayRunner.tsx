"use client";

import { useEffect } from "react";
import { useTheaterStore, getTheaterState } from "../store/theaterStore";
import { useSettingsStore } from "../store/settingsStore";
import { speak } from "../utils/voice";
import { PlayState } from "@/theater-core";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const MIN_TURN_TIME = 2000;
let CURRENT_TURN_LOOP: Promise<void> = Promise.resolve();

/**
 * Process user input
 */
async function processUserInput() {
  console.log("Processing user input");
  const store = getTheaterState();
  if (!store.play) throw new Error("Play not found");
  const userInput = store.inputQueue;
  store.setProcessingUserInput(true);
  await store.play.processTurn(userInput);
  store.clearInputQueue();
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
  store.play.nextTurn();
  store.setProcessingCharacter(store.play.currentTurnEntity.id);
  await store.play.processTurn();
  store.setProcessingCharacter(null);
  return store.play.getState();
}

/**
 * Process the next turn
 */
async function processNextTurn(): Promise<PlayState> {
  console.log("Processing next turn");
  const { inputQueue } = getTheaterState();
  const newState =
    inputQueue.length > 0
      ? await processUserInput()
      : await processCharacterTurn();

  return newState;
}

/**
 * Read out speeches in order
 */
async function readSpeeches(state: PlayState) {
  const { setActiveCharacter, addError } = getTheaterState();
  const speakers = state.characters.filter((c) => c.speech);

  for (const speaker of speakers) {
    try {
      setActiveCharacter(speaker.id);
      await speak(speaker.name, speaker.speech);
    } catch (error) {
      console.error(error);
      addError(error as Error);
    } finally {
      setActiveCharacter(null);
    }
  }
}

/**
 * Run the turn loop
 */
async function runTurnLoop() {
  let currentSpeeches: Promise<void> = Promise.resolve();
  const { syncPlayState, incrementTurn, addError } = getTheaterState();
  syncPlayState();

  // It's important to get the new state every time.
  while (getTheaterState().autoRun) {
    const turnStartTime = Date.now();
    try {
      incrementTurn();
      const [nextState] = await Promise.all([
        processNextTurn(),
        currentSpeeches,
      ]);

      syncPlayState();
      currentSpeeches = readSpeeches(nextState);
    } catch (error) {
      console.error(error);
      addError(error as Error);
    } finally {
      await wait(Math.max(0, MIN_TURN_TIME - (Date.now() - turnStartTime)));
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
   * Trigger a new turn loop to start after the previous loop
   * has finished if autoRun is true
   */
  useEffect(() => {
    if (autoRun) CURRENT_TURN_LOOP = CURRENT_TURN_LOOP.finally(runTurnLoop);
  }, [autoRun]);

  return null;
}
