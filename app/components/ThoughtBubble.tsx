import TypeWriter from "./TypeWriter";

interface ThoughtBubbleProps {
  text: string;
  speed?: number;
}

export default function ThoughtBubble({ text, speed = 30 }: ThoughtBubbleProps) {
  if (!text) return null;
  
  return (
    <div className="text-white/70 text-ellipsis text-left bg-black/80 border border-white/20 rounded-lg p-2 border-dashed">
      💭 <TypeWriter text={text} speed={speed} />
    </div>
  );
} 
