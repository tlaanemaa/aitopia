"use client";

import { useState, useCallback } from "react";
import { useTheaterStore } from "../store/theaterStore";
import { motion } from "framer-motion";
import { useEllipsis } from "../hooks/useEllipsis";
import InputQueue from "./InputQueue";
import { initializeVoices } from "../utils/voice";
import clsx from "clsx";

export default function UserInput() {
  const { turnCount, autoRun, setAutoRun, queueInput, isProcessingUserInput } =
    useTheaterStore();
  const [input, setInput] = useState("");
  const ellipsis = useEllipsis(isProcessingUserInput);
  const isInitialState = turnCount === 0;

  const sendInput = useCallback(async () => {
    const trimmedInput = input.trim();
    if (trimmedInput) queueInput(trimmedInput);
    if (isInitialState) initializeVoices();
    if (!autoRun) setAutoRun(true);
    setInput("");
  }, [input, queueInput, setAutoRun, isInitialState, autoRun]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && input.trim()) {
      sendInput();
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 flex flex-col items-center p-3">
      {/* Queue Visualization */}
      <InputQueue />

      {/* Input Field */}
      <motion.div
        className="flex items-stretch p-2 w-full max-w-2xl bg-black/40 backdrop-blur-xl rounded-full border-2 border-white/10 shadow-lg shadow-black/20 overflow-hidden"
        initial={isInitialState ? { y: 20, opacity: 0 } : false}
        animate={isInitialState ? { y: 0, opacity: 1 } : false}
        transition={{ duration: 1, delay: 2, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Gradient wave animation */}
        {isProcessingUserInput && (
          <motion.div
            className="absolute inset-0"
            animate={{
              background: [
                "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.05) 25%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.05) 75%, transparent 100%)",
                "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.05) 25%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.05) 75%, transparent 100%)",
              ],
              x: ["-100%", "100%"],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "linear",
            }}
          />
        )}

        <input
          type="text"
          placeholder={
            isProcessingUserInput
              ? `Crafting your narrative${ellipsis}`
              : isInitialState
              ? "Begin your story..."
              : "Type your instructions..."
          }
          value={input}
          disabled={isProcessingUserInput}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          className={clsx(
            "flex-grow h-11 px-5 rounded-full text-base disabled:cursor-not-allowed focus:outline-none bg-transparent text-white placeholder-white/40 min-w-1 tracking-wide transition-colors duration-200 focus:placeholder-white/60",
            isProcessingUserInput && "placeholder-white/80"
          )}
        />
        <motion.button
          onClick={sendInput}
          disabled={!input.trim() && !isInitialState}
          className="px-7 text-base rounded-full disabled:opacity-30 disabled:cursor-not-allowed whitespace-nowrap bg-white/90 hover:bg-white text-black tracking-wide cursor-pointer transition-all duration-200 disabled:hover:bg-white/90 shadow-lg shadow-black/10"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {isInitialState ? "Begin" : "Send"}
        </motion.button>
      </motion.div>
    </div>
  );
}
