"use client";

import { useGameStore } from "@/store/gameStore";
import Character from "./Character";

export default function GameField() {
  const { characters } = useGameStore();
  return (
    <div>
      {Object.values(characters).map((character) => (
        <Character key={character.name} character={character} />
      ))}
    </div>
  );
}
