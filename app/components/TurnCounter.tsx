import { useGameStore } from "../store/gameStore";

export default function TurnCounter() {
  const { turn } = useGameStore();
  return (
    <div className="fixed top-0 left-0 p-3 text-white font-mono text-xl">
      {turn}
    </div>
  );
}
