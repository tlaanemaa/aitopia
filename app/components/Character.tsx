import Image from "next/image";
import { useEffect, useState } from "react";
import CharacterEmotion from "./CharacterEmotion";
import SpeechBubble from "./SpeechBubble";
import ThoughtBubble from "./ThoughtBubble";
import clsx from "clsx";
import {
  getAvatarUrl,
  CHARACTER_WIDTH,
  CHARACTER_HEIGHT,
  SCREEN_MARGIN,
} from "../constants";
import { CharacterState } from "@/theater-core";

interface CharacterProps {
  character: CharacterState;
  active: boolean;
  processing: boolean;
}

export default function Character({
  character,
  processing,
  active,
}: Readonly<CharacterProps>) {
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
  const displayThought = processing
    ? "Hmm... now what?"
    : character.lastThought;

  return (
    <div
      className={clsx(
        "fixed top-0 left-0 transition-transform duration-[2000ms]",
        character.active && "z-10"
      )}
      style={{
        transform: `translate(${offsetX}px, ${offsetY}px)`,
      }}
    >
      <div className="relative flex flex-col items-center transition-all duration-300">
        <div className="relative">
          <Image
            src={getAvatarUrl(character.avatar)}
            alt={character.name}
            width={CHARACTER_WIDTH}
            height={CHARACTER_HEIGHT}
            className="transition-all duration-300"
          />
          <CharacterEmotion emotion={character.emotion} />
        </div>
        <div className="absolute -bottom-7 p-1 rounded-md text-center text-lg font-semibold bg-opacity-20 bg-black whitespace-pre">
          {character.name}
        </div>
        {(displayThought.trim() || character.currentSpeech.trim()) && (
          <div className="absolute bottom-full flex flex-col mb-2 text-sm w-60 items-center space-y-2">
            {displayThought && (
              <ThoughtBubble text={displayThought} speed={30} />
            )}
            {active && character.currentSpeech && (
              <SpeechBubble text={character.currentSpeech} speed={30} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
