"use client";

import { useGameStore } from "@/store/gameStore";
import ActionLog from "./components/ActionLog";
import GameField from "./components/GameField";
import TurnCounter from "./components/TurnCounter";
import UserInput from "./components/UserInput";
import Banner from "./components/Banner";

export default function Home() {
  const isStarted = useGameStore().turn > 0;

  return (
    <div>
      <ActionLog />
      <GameField />
      {!isStarted && <Banner />}
      <TurnCounter />
      <UserInput />
    </div>
  );
}
