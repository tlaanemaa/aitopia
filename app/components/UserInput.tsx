"use client";

import { useState, useEffect } from "react";
import { useTheaterStore } from "../store/theaterStore";
import { motion, AnimatePresence } from "framer-motion";

function useAnimatedDots(isProcessing: boolean) {
  const [dots, setDots] = useState("");

  useEffect(() => {
    if (!isProcessing) {
      setDots("");
      return;
    }

    const interval = setInterval(() => {
      setDots((prev) => {
        if (prev === "") return ".";
        if (prev === ".") return "..";
        if (prev === "..") return "...";
        return ".";
      });
    }, 500);

    return () => clearInterval(interval);
  }, [isProcessing]);

  return dots;
}

export default function UserInput() {
  const {
    turnCount,
    setAutoRun,
    queueInput,
    inputQueue,
    isProcessingUserInput,
  } = useTheaterStore();
  const [input, setInput] = useState("");
  const animatedDots = useAnimatedDots(isProcessingUserInput);

  const sendInput = async () => {
    if (!input.trim() && !isInitialState) return;

    // Add to queue with animation
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
    <div className="fixed bottom-0 left-0 right-0 flex flex-col items-center p-3">
      {/* Queue Visualization */}
      <AnimatePresence>
        {inputQueue.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full max-w-3xl mb-2"
          >
            <div className="space-y-1">
              {inputQueue.map((text, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{
                    duration: 0.3,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  className="text-sm text-white/50 bg-black/60 backdrop-blur-md px-6 py-1 rounded-full border border-white/5"
                >
                  {text}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input Field */}
      <motion.div
        className="relative flex items-center w-full max-w-3xl bg-gray-400/10 backdrop-blur-md p-[1px] rounded-full border border-1 border-white/30 overflow-hidden"
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
                "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.02) 25%, rgba(255,255,255,0.04) 50%, rgba(255,255,255,0.02) 75%, transparent 100%)",
                "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.02) 25%, rgba(255,255,255,0.04) 50%, rgba(255,255,255,0.02) 75%, transparent 100%)",
              ],
              x: ["-100%", "100%"],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "linear",
            }}
          />
        )}

        <input
          type="text"
          placeholder={
            isProcessingUserInput
              ? `Crafting your narrative${animatedDots}`
              : isInitialState
              ? "Begin your story..."
              : "Type your instructions..."
          }
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-grow h-12 px-6 rounded-full text-md focus:outline-none bg-transparent text-white placeholder-white/30 min-w-1 relative z-10 text-base font-light tracking-wide"
        />
        <motion.div className="h-12 w-[1px] bg-gradient-to-b from-white/0 via-white/10 to-white/0" />
        <motion.button
          onClick={sendInput}
          disabled={!input.trim() && !isInitialState}
          className="h-12 px-8 text-base rounded-full transition-all disabled:opacity-30 disabled:cursor-not-allowed whitespace-nowrap relative z-20 text-white/90 hover:text-white font-light tracking-wide"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {isInitialState ? "Begin" : "Send"}
        </motion.button>
      </motion.div>
    </div>
  );
}
