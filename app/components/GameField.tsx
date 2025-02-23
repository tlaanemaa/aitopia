"use client";

import { useGameStore } from "@/store/gameStore";
import Character from "./Character";

export default function GameField() {
  const { characters } = useGameStore();
  return (
    <div className="top-20 left-20 right-0 bottom-10 fixed">
      {Object.values(characters).map((character) => (
        <Character key={character.name} character={character} />
      ))}
    </div>
  );
}
