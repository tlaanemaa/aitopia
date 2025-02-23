"use client";

import { useGameStore } from "@/store/gameStore";
import { promptLLM } from "./actions/promptLLM";
import Character from "./components/Character";

export default function Home() {
  const { characters } = useGameStore();
  return (
    <div>
      {characters.map((character) => (
        <Character key={character.name} character={character} />
      ))}
    </div>
  );
}

if (typeof window !== "undefined") {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).promptLLM = promptLLM;
}
