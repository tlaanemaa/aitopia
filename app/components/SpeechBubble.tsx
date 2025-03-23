import TypeWriter from "./TypeWriter";

interface SpeechBubbleProps {
  text: string;
  speed?: number;
}

export default function SpeechBubble({ text, speed = 30 }: SpeechBubbleProps) {
  if (!text) return null;
  
  return (
    <div className="text-white text-ellipsis text-center">
      💬 <TypeWriter text={text} speed={speed} />
    </div>
  );
} 