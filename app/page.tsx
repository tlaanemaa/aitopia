"use client";

import { AnimatePresence } from "framer-motion";
import { useTheaterStore } from "./store/theaterStore";
import ActionLog from "./components/ActionLog";
import Stage from "./components/Stage";
import TurnCounter from "./components/TurnCounter";
import UserInput from "./components/UserInput";
import Banner from "./components/Banner";
import Settings from "./components/Settings";
import SettingsButton from "./components/SettingsButton";
import PlayRunner from "./components/PlayRunner";

export default function Home() {
  const isStarted = useTheaterStore().turnCount > 0;

  return (
    <div className="relative min-h-screen">
      <PlayRunner />
      <ActionLog />
      <Stage />
      <TurnCounter />
      <AnimatePresence>{!isStarted && <Banner />}</AnimatePresence>
      <UserInput />
      <SettingsButton />
      <Settings />
    </div>
  );
}
