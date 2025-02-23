import { Character as CharacterModel } from "@/store/gameStore";

export default function Character({
  character,
}: Readonly<{ character: CharacterModel }>) {
  const screenWidth = window.innerWidth;
  const screenHeight = window.innerHeight;

  const positionX = (character.positionX / 100) * screenWidth - 64; // 64 is half the width of the character image
  const positionY = (character.positionY / 100) * screenHeight - 64; // 64 is half the height of the character image
  return (
    <div
      className="absolute transition-transform duration-500"
      style={{
        transform: `translate(${positionX}px, ${positionY}px)`,
      }}
    >
      {character.thought && (
        <div className="absolute -top-20 w-xl p-2 bg-white opacity-50 border rounded-full shadow-lg text-black text-center">
          {character.thought}
        </div>
      )}
      {character.speech && (
        <div className="absolute mb-2 p-2 bg-white border rounded shadow-lg text-black text-center">
          {character.speech}
        </div>
      )}
      <div className="flex flex-col items-center">
        <img
          src="http://localhost:3000/among_us.webp"
          alt={character.name}
          width={128}
          className="w-16 h-16 rounded-full"
        />
        <div className="absolute -bottom-2 text-center text-lg font-semibold">
          {character.name}
        </div>
      </div>
    </div>
  );
}
