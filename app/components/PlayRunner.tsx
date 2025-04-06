"use client";

import { useEffect } from "react";
import { useTheaterStore, getTheaterState } from "../store/theaterStore";
import { useSettingsStore } from "../store/settingsStore";
import { speak, NARRATOR_SETTINGS } from "../utils/voice";
import { PlayEvent } from "@/theater-core";

const MIN_TURN_TIME = 2000;
const TOTAL_RUNTIME_TIMEOUT = 15 * 60 * 1000; // 15 minutes
const SESSION_START_TIME = Date.now();
let CURRENT_TURN_LOOP: Promise<void> = Promise.resolve();

/**
 * Process user input
 */
async function processUserInput() {
  console.log("Processing user input");
  const store = getTheaterState();
  if (!store.play) throw new Error("Play not found");
  store.setProcessingUserInput(true);
  const newEvents = await store.play.processTurn(store.inputQueue);
  store.clearInputQueue();
  store.setProcessingUserInput(false);
  return newEvents;
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
  const newEvents = await store.play.processTurn();
  store.setProcessingCharacter(null);
  return newEvents;
}

/**
 * Process the next turn
 */
async function processNextTurn() {
  console.log("Processing next turn");
  const { inputQueue } = getTheaterState();
  const newEvents =
    inputQueue.length > 0
      ? await processUserInput()
      : await processCharacterTurn();

  return newEvents;
}

/**
 * Read out speeches in order
 */
async function readSpeeches(events: PlayEvent[]) {
  const { setActiveCharacter, addError } = getTheaterState();
  const speakers = events.filter((e) =>
    ["speech", "generic", "scene_change", "action"].includes(e.type)
  );

  for (const speaker of speakers) {
    try {
      switch (speaker.type) {
        case "speech":
          setActiveCharacter(speaker.name);
          await speak(speaker.name, speaker.data);
          break;
        case "action":
          await speak("Narrator", speaker.data, NARRATOR_SETTINGS);
          break;
        case "generic":
          await speak("Narrator", speaker.data, NARRATOR_SETTINGS);
          break;
        case "scene_change":
          await speak("Narrator", speaker.data, NARRATOR_SETTINGS);
          break;
      }
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
  const { syncPlayState, incrementTurn, addError, setAutoRun } =
    getTheaterState();
  syncPlayState();

  // It's important to get the new state every time.
  while (getTheaterState().autoRun) {
    const turnStartTime = Date.now();
    try {
      // Check for total runtime timeout
      if (Date.now() - SESSION_START_TIME > TOTAL_RUNTIME_TIMEOUT) {
        console.log("Total runtime timeout reached, stopping auto-run");
        setAutoRun(false);
        break;
      }

      incrementTurn();
      const [newEvents] = await Promise.all([
        processNextTurn(),
        currentSpeeches,
      ]);

      syncPlayState();
      currentSpeeches = readSpeeches(newEvents);
    } catch (error) {
      console.error(error);
      addError(error as Error);
    } finally {
      await new Promise((resolve) =>
        setTimeout(
          resolve,
          Math.max(0, MIN_TURN_TIME - (Date.now() - turnStartTime))
        )
      );
    }
  }
}

/**
 * PlayRunner component
 */
export default function PlayRunner() {
  const modelName = useSettingsStore((state) => state.modelName);
  const endpoint = useSettingsStore((state) => state.endpoint);
  const provider = useSettingsStore((state) => state.provider);
  const play = useTheaterStore((state) => state.play);
  const autoRun = useTheaterStore((state) => state.autoRun);

  /**
   * Update ai settings
   */
  useEffect(() => {
    if (!play) return;
    play.ai.model = modelName;
    play.ai.baseUrl = endpoint;
    play.ai.provider = provider;
  }, [modelName, endpoint, provider, play]);

  /**
   * Trigger a new turn loop to start after the previous loop
   * has finished if autoRun is true
   */
  useEffect(() => {
    if (autoRun) CURRENT_TURN_LOOP = CURRENT_TURN_LOOP.finally(runTurnLoop);
  }, [autoRun]);

  return null;
}
