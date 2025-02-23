import { Character as CharacterModel } from "@/store/gameStore";

export default function Character({
  character,
}: Readonly<{ character: CharacterModel }>) {
  return (
    <div>
      <h1>{character.name}</h1>
      <p>{character.speech}</p>
      <p>{character.thought}</p>
      <p>
        {character.position.x}, {character.position.y}
      </p>
    </div>
  );
}
