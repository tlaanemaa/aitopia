import Image from "next/image";
import CharacterEmotion from "./CharacterEmotion";
import SpeechBubble from "./SpeechBubble";
import ThoughtBubble from "./ThoughtBubble";
import clsx from "clsx";
import { getAvatarUrl } from "../constants";
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
  // If processing, show a thinking message
  const displayThought = processing
    ? "Hmm... now what?"
    : character.lastThought;

  return (
    <div
      className={clsx(
        "absolute left-0 top-0 -translate-x-1/2 -translate-y-1/2 h-14 w-14",
        character.active && "z-10"
      )}
      style={{
        left: `${character.position.x}%`,
        top: `${character.position.y}%`,
        transition: "left ease-in-out 2000ms, top ease-in-out 2000ms",
      }}
    >
      <div className="relative flex flex-col items-center transition-all duration-300">
        <div className="relative">
          <Image
            src={getAvatarUrl(character.avatar)}
            alt={character.name}
            width={60}
            height={60}
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
