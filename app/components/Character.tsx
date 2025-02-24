import Image from "next/image";
import { Character as CharacterModel } from "@/store/gameStore";
import { useEffect, useState } from "react";

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

  const margin = 100;
  const characterHeight = 64;
  const characterWidth = 64;
  const offsetX =
    (character.positionX / 100) * (screenWidth - 2 * margin) +
    margin -
    characterWidth;
  const offsetY =
    (character.positionY / 100) * (screenHeight - 2 * margin) +
    margin -
    characterHeight;

  return (
    <div
      className="fixed top-0 left-0 transition-transform duration-[2000ms]"
      style={{
        transform: `translate(${offsetX}px, ${offsetY}px)`,
      }}
    >
      <div className="relative flex flex-col items-center">
        <Image
          src="/among_us.webp"
          alt={character.name}
          width={characterWidth}
          height={characterHeight}
          className="w-16 h-16 rounded-full z-10"
        />
        <div className="absolute -bottom-5 p-1 rounded-md text-center text-lg font-semibold bg-opacity-20 bg-black whitespace-pre">
          {character.name}
        </div>
        {(character.thought || character.speech) && (
          <div className="absolute bottom-full flex flex-col text-sm p-1 w-[300px] rounded-md items-center space-y-2 bg-opacity-20 bg-black">
            {character.thought && (
              <div className="opacity-70 text-white text-ellipsis text-center">
                {`💭 ${character.thought}`}
              </div>
            )}
            {character.speech && (
              <div className="text-white text-ellipsis text-center">
                {`💬 ${character.speech}`}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
