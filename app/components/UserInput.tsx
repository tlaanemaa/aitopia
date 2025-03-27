"use client";

import { useState } from "react";
import { useTheaterStore } from "../store/theaterStore";
import { motion } from "framer-motion";

export default function UserInput() {
  const { turnCount, setAutoRun, queueInput } = useTheaterStore();
  const [input, setInput] = useState("");

  const sendInput = async () => {
    queueInput(input);
    setAutoRun(true);
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && input.trim()) {
      sendInput();
    }
  };

  const isInitialState = turnCount === 0;

  return (
    <motion.div 
      className="fixed bottom-0 left-0 right-0 flex items-center justify-center p-2"
      initial={isInitialState ? { y: 20, opacity: 0 } : false}
      animate={isInitialState ? { y: 0, opacity: 1 } : false}
      transition={{ duration: 0.5, delay: 2 }}
    >
      <div className="flex items-center space-x-2 w-full max-w-2xl bg-white/5 backdrop-blur-sm p-2 rounded-full shadow-lg border border-white/5">
        <input
          type="text"
          placeholder={isInitialState ? "Begin your story..." : "Type your instructions..."}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-grow py-2 px-4 rounded-full focus:outline-none disabled:bg-gray-200 bg-transparent text-white placeholder-white/30 min-w-1"
        />
        <motion.button
          onClick={sendInput}
          className="px-6 py-2 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white rounded-full transition-colors disabled:bg-gray-500 whitespace-nowrap"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {isInitialState ? "Begin" : "Next Turn"}
        </motion.button>
      </div>
    </motion.div>
  );
}
