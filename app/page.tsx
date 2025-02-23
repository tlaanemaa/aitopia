"use client";

import ActionLog from "./components/ActionLog";
import GameField from "./components/GameField";
import { TurnCounter } from "./components/TurnCounter";
import UserInput from "./components/UserInput";

export default function Home() {
  return (
    <div>
      <GameField />
      <TurnCounter />
      <ActionLog />
      <UserInput />
    </div>
  );
}
