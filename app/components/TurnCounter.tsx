import { useTheaterStore } from "../store/theaterStore";

export default function TurnCounter() {
  const { turnCount } = useTheaterStore();
  return (
    <div className="fixed top-0 left-0 p-3 text-white font-mono text-xl">
      {turnCount}
    </div>
  );
}
