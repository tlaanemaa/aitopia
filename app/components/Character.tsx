import Image from "next/image";
import {
  Character as CharacterModel,
  CHARACTER_HEIGHT,
  CHARACTER_WIDTH,
  SCREEN_MARGIN,
} from "../store/gameStore";
import { useEffect, useState } from "react";
import TypeWriter from "./TypeWriter";

export default function Character({
  character,
}: Readonly<{ character: CharacterModel }>) {
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
    (character.positionX / 100) * (screenWidth - 2 * SCREEN_MARGIN) +
    SCREEN_MARGIN -
    CHARACTER_WIDTH;
  const offsetY =
    (character.positionY / 100) * (screenHeight - 2 * SCREEN_MARGIN) +
    SCREEN_MARGIN -
    CHARACTER_HEIGHT;

  return (
    <div
      className="fixed top-0 left-0 transition-transform duration-[2000ms]"
      style={{
        transform: `translate(${offsetX}px, ${offsetY}px)`,
      }}
    >
      <div className="relative flex flex-col items-center">
        <Image
          src={character.avatar}
          alt={character.characterName}
          width={CHARACTER_WIDTH}
          height={CHARACTER_HEIGHT}
        />
        <div className="absolute -bottom-7 p-1 rounded-md text-center text-lg font-semibold bg-opacity-20 bg-black whitespace-pre">
          {character.characterName}
        </div>
        {(character.thought || character.speech) && (
          <div className="absolute bottom-full flex flex-col text-sm p-1 w-[300px] rounded-md items-center space-y-2 bg-opacity-20 bg-black">
            {character.thought && (
              <div className="opacity-70 text-white text-ellipsis text-center">
                💭 <TypeWriter text={character.thought} speed={30} />
              </div>
            )}
            {character.speech && (
              <div className="text-white text-ellipsis text-center">
                💬 <TypeWriter text={character.speech} speed={30} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
