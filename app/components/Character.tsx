import Image from "next/image";
import { useEffect, useState } from "react";
import CharacterEmotion from "./CharacterEmotion";
import SpeechBubble from "./SpeechBubble";
import ThoughtBubble from "./ThoughtBubble";
import clsx from "clsx";

// Constants for character display
const CHARACTER_WIDTH = 100;
const CHARACTER_HEIGHT = 100;
const SCREEN_MARGIN = 50;

interface CharacterProps {
  id: string;
  name: string;
  avatar: string;
  position: { x: number; y: number };
  emotion: string;
  speech?: string;
  thought?: string;
  visualState?: 'speaking' | 'thinking' | 'processing' | 'idle';
}

export default function Character({
  character,
}: Readonly<{ character: CharacterProps }>) {
  const [screenWidth, setScreenWidth] = useState(window.innerWidth);
  const [screenHeight, setScreenHeight] = useState(window.innerHeight);

  useEffect(() => {
    const handleResize = () => {
      setScreenWidth(window.innerWidth);
      setScreenHeight(window.innerHeight);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const offsetX =
    (character.position.x / 100) * (screenWidth - 2 * SCREEN_MARGIN) +
    SCREEN_MARGIN -
    CHARACTER_WIDTH / 2;
  const offsetY =
    (character.position.y / 100) * (screenHeight - 2 * SCREEN_MARGIN) +
    SCREEN_MARGIN -
    CHARACTER_HEIGHT / 2;

  // If processing, show a thinking message
  const displayThought = character.visualState === 'processing' 
    ? "Hmm... what should I do next?" 
    : character.thought;

  return (
    <div
      className="fixed top-0 left-0 transition-transform duration-[2000ms]"
      style={{
        transform: `translate(${offsetX}px, ${offsetY}px)`,
      }}
    >
      <div 
        className={clsx(
          "relative flex flex-col items-center transition-all duration-300",
          character.visualState === 'speaking' && "scale-110"
        )}
      >
        <div className="relative">
          <Image
            src={character.avatar}
            alt={character.name}
            width={CHARACTER_WIDTH}
            height={CHARACTER_HEIGHT}
            className={clsx(
              "rounded-full transition-all duration-300",
              character.visualState === 'speaking' && "ring-4 ring-yellow-400 ring-opacity-50",
              character.visualState === 'processing' && "ring-2 ring-blue-400 ring-opacity-30"
            )}
          />
          <CharacterEmotion emotion={character.emotion} />
        </div>
        <div className="absolute -bottom-7 p-1 rounded-md text-center text-lg font-semibold bg-opacity-20 bg-black whitespace-pre">
          {character.name}
        </div>
        {(displayThought || character.speech) && (
          <div className="absolute bottom-full flex flex-col text-sm p-2 w-[300px] rounded-md items-center space-y-2 bg-black bg-opacity-20 backdrop-blur-sm">
            {displayThought && <ThoughtBubble text={displayThought} speed={30} />}
            {character.speech && <SpeechBubble text={character.speech} speed={30} />}
          </div>
        )}
      </div>
    </div>
  );
}
