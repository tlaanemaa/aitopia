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

  const margin = 50;
  const positionX =
    (character.positionX / 100) * (screenWidth - 2 * margin) +
    margin +
    (screenWidth / 2 - 32);
  const positionY =
    (character.positionY / 100) * (screenHeight - 2 * margin) +
    margin +
    (screenHeight / 2 - 32);

  return (
    <div
      className="absolute transition-transform duration-1000"
      style={{
        transform: `translate(${positionX}px, ${positionY}px)`,
      }}
    >
      <div className="relative flex flex-col items-center">
        <Image
          src="/among_us.webp"
          alt={character.name}
          width={64}
          height={64}
          className="w-16 h-16 rounded-full z-10"
        />
        <div className="absolute -bottom-5 p-1 rounded-md text-center text-lg font-semibold bg-opacity-20 bg-black whitespace-pre">
          {character.name}
        </div>
        {(character.thought || character.speech) && (
          <div className="absolute bottom-full flex flex-col p-1 rounded-md items-center space-y-2 bg-opacity-20 bg-black">
            {character.thought && (
              <div
                className="opacity-70 text-white"
                style={{
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {`💭 ${character.thought}`}
              </div>
            )}
            {character.speech && (
              <div
                className="text-white"
                style={{
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {`💬 ${character.speech}`}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
