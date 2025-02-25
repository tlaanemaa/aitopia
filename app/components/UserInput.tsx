"use client";

import { useState } from "react";
import { useGameStore } from "../store/gameStore";
import { initializeVoices } from "../store/voice";
import { nextTurn } from "../actions/nextTurn";

export default function UserInput() {
  const { loading, turn } = useGameStore();
  const [input, setInput] = useState("");

  const sendInput = async () => {
    setInput("");
    initializeVoices();
    await nextTurn(input);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !loading) {
      sendInput();
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 flex items-center justify-center p-2">
      <div className="flex items-center space-x-2 w-full max-w-2xl bg-white p-2 rounded-full shadow-lg">
        <input
          type="text"
          placeholder="Type your instructions..."
          value={input}
          disabled={loading}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-grow py-2 px-4 rounded-full focus:outline-none disabled:bg-gray-200 bg-white text-gray-900 min-w-1"
        />
        <button
          disabled={loading}
          onClick={sendInput}
          className="px-4 py-2 bg-gray-800 text-white rounded-full hover:bg-gray-900 disabled:bg-gray-500 whitespace-nowrap"
        >
          {loading ? "Thinking..." : turn > 0 ? "Next Turn" : "Start game"}
        </button>
      </div>
    </div>
  );
}
