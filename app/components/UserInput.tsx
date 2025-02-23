"use client";

import { useState } from "react";
import { useGameStore } from "@/store/gameStore";
import { nextTurn } from "../actions/nextTurn";

export default function UserInput() {
  const { loading } = useGameStore();
  const [input, setInput] = useState("");

  const sendInput = async () => {
    setInput("");
    await nextTurn(input);
  };

  return (
    <div>
      <input
        type="text"
        placeholder="Type here"
        value={input}
        disabled={loading}
        onChange={(e) => setInput(e.target.value)}
      />
      <button disabled={loading} onClick={sendInput}>
        Submit
      </button>
    </div>
  );
}
