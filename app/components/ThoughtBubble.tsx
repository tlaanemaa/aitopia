import TypeWriter from "./TypeWriter";

interface ThoughtBubbleProps {
  text: string;
  speed?: number;
}

export default function ThoughtBubble({ text, speed = 30 }: ThoughtBubbleProps) {
  if (!text) return null;
  
  return (
    <div className="opacity-70 text-white text-ellipsis text-left bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-2 border-dashed">
      💭 <TypeWriter text={text} speed={speed} />
    </div>
  );
} 
