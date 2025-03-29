import { useTheaterStore } from "../store/theaterStore";
import CharacterBadge from "./CharacterBadge";

export default function TurnIndicator() {
  const {
    turnOrder,
    activeCharacterId,
    processingCharacterId,
    isProcessingUserInput,
  } = useTheaterStore();

  // If no characters, show a placeholder
  if (!turnOrder.length) return null;

  return (
    <div className="fixed flex flex-col-reverse right-4 bottom-24 p-2 rounded-lg gap-y-1">
      {turnOrder.map((entity) => (
        <div key={entity.id} className="mb-2">
          <CharacterBadge
            avatar={entity.avatar}
            name={entity.name}
            isActive={entity.id === activeCharacterId && !isProcessingUserInput}
            isProcessing={
              entity.id === processingCharacterId && !isProcessingUserInput
            }
          />
        </div>
      ))}
    </div>
  );
}
