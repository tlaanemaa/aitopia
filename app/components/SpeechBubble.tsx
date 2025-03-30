import TypeWriter from "./TypeWriter";

interface SpeechBubbleProps {
  text: string;
  speed?: number;
}

export default function SpeechBubble({ text, speed = 30 }: SpeechBubbleProps) {
  if (!text) return null;
  
  return (
    <div className="text-white text-ellipsis text-left bg-black/80 border border-white/40 rounded-lg p-2">
      💬 <TypeWriter text={text} speed={speed} />
    </div>
  );
} 
