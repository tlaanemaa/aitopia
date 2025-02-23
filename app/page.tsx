import ActionLog from "./components/ActionLog";
import GameField from "./components/GameField";
import UserInput from "./components/UserInput";

export default function Home() {
  return (
    <div>
      <GameField />
      <ActionLog />
      <UserInput />
    </div>
  );
}
