import Image from "next/image";
import { getAvatarUrl } from "../constants";
import { useTheaterStore } from "../store/theaterStore";

interface CharacterBadgeProps {
  characterId: string;
}

export default function CharacterBadge({ characterId }: CharacterBadgeProps) {
  const { activeCharacterId, processingCharacterId, turnOrder } =
    useTheaterStore();

  const entity = turnOrder.find((e) => e.id === characterId);
  if (!entity) return null;

  const isActive = characterId === activeCharacterId;
  const isProcessing = characterId === processingCharacterId;

  return (
    <div className="relative w-12 h-12 m-0 p-0">
      {isProcessing && isActive ? (
        <div className="absolute -inset-1 rounded-full animate-spin border-2 border-transparent border-t-white/70 border-r-white/70" />
      ) : isActive ? (
        <div className="absolute -inset-1 rounded-full border-2 border-white/70" />
      ) : (
        <div className="absolute -inset-1 rounded-full border-2 border-white/20" />
      )}
      <div className="rounded-full bg-black/20 p-2 w-full h-full flex items-center justify-center">
        <Image
          src={getAvatarUrl(entity.avatar)}
          alt={entity.name}
          width={32}
          height={32}
          className="rounded-full"
        />
      </div>
    </div>
  );
}
