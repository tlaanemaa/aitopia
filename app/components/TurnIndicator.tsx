import { useTheaterStore } from "../store/theaterStore";
import CharacterBadge from "./CharacterBadge";

export default function TurnIndicator() {
  const { turnOrder } = useTheaterStore();

  // If no characters, show a placeholder
  if (!turnOrder.length) return null;

  return (
    <div className="fixed flex flex-col right-4 bottom-40 p-2 rounded-lg z-50 gap-2">
      {turnOrder.map((entity) => (
        <div key={entity.id} className="mb-2 last:mb-0">
          <CharacterBadge characterId={entity.id} />
        </div>
      ))}
    </div>
  );
}
