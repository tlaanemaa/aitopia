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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !loading) {
      sendInput();
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 flex items-center justify-center p-2">
      <div className="flex items-center space-x-4 w-full max-w-2xl bg-white p-2 rounded-full shadow-lg">
        <input
          type="text"
          placeholder={loading ? "Loading..." : "Type your instructions..."}
          value={input}
          disabled={loading}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-grow p-2 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-200 bg-white text-gray-900"
        />
        <button
          disabled={loading}
          onClick={sendInput}
          className="px-4 py-2 bg-gray-800 text-white rounded-full hover:bg-gray-900 disabled:bg-gray-500"
        >
          Next turn
        </button>
      </div>
    </div>
  );
}
