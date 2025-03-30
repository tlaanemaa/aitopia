"use client";

import { useTheaterStore } from "../store/theaterStore";
import Character from "./Character";
import SceneBackground from "./SceneBackground";

export default function Stage() {
  const {
    characters,
    scene,
    activeCharacterId,
    processingCharacterId,
    isProcessingUserInput,
  } = useTheaterStore();

  return (
    <div className="fixed inset-0">
      {/* Scene */}
      <SceneBackground description={scene} />

      {/* Characters */}
      <div className="absolute top-32 left-32 right-32 bottom-40">
        {characters.map((character) => (
          <Character
            key={character.id}
            character={character}
            active={
              activeCharacterId === character.id && !isProcessingUserInput
            }
            processing={
              processingCharacterId === character.id && !isProcessingUserInput
            }
          />
        ))}
      </div>
    </div>
  );
}
