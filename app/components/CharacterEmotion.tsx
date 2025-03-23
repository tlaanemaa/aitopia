interface CharacterEmotionProps {
  emotion: string;
}

export default function CharacterEmotion({ emotion }: CharacterEmotionProps) {
  return (
    <div className="absolute -top-2 -right-2 text-2xl">
      {emotion === 'happy' && '😊'}
      {emotion === 'sad' && '😢'}
      {emotion === 'angry' && '😠'}
      {emotion === 'neutral' && '😐'}
      {/* Add more emotions as needed */}
    </div>
  );
} 