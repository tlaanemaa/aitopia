import { CharacterState } from "@/theater-core";

interface CharacterEmotionProps {
  emotion: CharacterState["emotion"];
}

export default function CharacterEmotion({ emotion }: CharacterEmotionProps) {
  return (
    <div className="absolute -top-2 -right-2 text-2xl">
      {emotion === 'happy' && '😊'}
      {emotion === 'sad' && '😢'}
      {emotion === 'angry' && '😠'}
      {emotion === 'neutral' && '😐'}
    </div>
  );
} 
