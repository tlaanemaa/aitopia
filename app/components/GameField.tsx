"use client";

import { useGameStore } from "../store/gameStore";
import Character from "./Character";

export default function GameField() {
  const { characters } = useGameStore();
  return (
    <div className="top-0 left-0 right-0 bottom-0 fixed">
      {Object.values(characters).map((character) => (
        <Character key={character.characterName} character={character} />
      ))}
    </div>
  );
}
