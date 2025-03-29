import Image from "next/image";
import { getAvatarUrl } from "../constants";

interface CharacterBadgeProps {
  avatar: string;
  name: string;
  isActive: boolean;
  isProcessing: boolean;
}

export default function CharacterBadge({
  avatar,
  name,
  isActive,
  isProcessing,
}: CharacterBadgeProps) {
  return (
    <div className="relative w-12 h-12 m-0 p-0 rounded-full flex items-center justify-center">
      <div className="relative rounded-full bg-black/50 w-full h-full overflow-hidden">
        <Image src={getAvatarUrl(avatar)} alt={name} height={50} width={50} />
      </div>
      {isProcessing ? (
        <div className="absolute -inset-1 rounded-full animate-spin border-2 border-transparent border-t-white/70 border-r-white/70" />
      ) : isActive ? (
        <div className="absolute -inset-1 rounded-full border-2 border-white/70" />
      ) : (
        <div className="absolute -inset-1 rounded-full border-2 border-white/10" />
      )}
    </div>
  );
}
