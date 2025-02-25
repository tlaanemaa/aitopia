"use client";

import { useGameStore } from "./store/gameStore";
import ActionLog from "./components/ActionLog";
import GameField from "./components/GameField";
import TurnCounter from "./components/TurnCounter";
import UserInput from "./components/UserInput";
import Banner from "./components/Banner";
import Settings from "./components/Settings";
import SettingsButton from "./components/SettingsButton";
import { AnimatePresence } from "framer-motion";

export default function Home() {
  const isStarted = useGameStore().turn > 0;

  return (
    <div className="relative min-h-screen">
      <ActionLog />
      <GameField />
      <TurnCounter />
      <AnimatePresence>{!isStarted && <Banner />}</AnimatePresence>
      <UserInput />
      <SettingsButton />
      <Settings />
    </div>
  );
}
