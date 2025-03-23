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
    isProcessingUserInput 
  } = useTheaterStore();

  return (
    <div className="fixed inset-0">
      {/* Scene */}
      <SceneBackground description={scene} />

      {/* Characters */}
      <div className="relative w-full h-full">
        {characters.map((character) => {
          // Determine visual state
          let visualState: 'speaking' | 'thinking' | 'processing' | 'idle' = 'idle';
          
          if (character.id === activeCharacterId) {
            visualState = character.speech ? 'speaking' : 'thinking';
          } else if (character.id === processingCharacterId && !isProcessingUserInput) {
            visualState = 'processing';
          }

          return (
            <Character 
              key={character.id} 
              character={{
                ...character,
                visualState
              }} 
            />
          );
        })}
      </div>
    </div>
  );
} 