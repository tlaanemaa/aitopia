"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useSettingsStore } from "../store/settingsStore";

export default function Settings() {
  const {
    isOpen,
    endpoint,
    modelName,
    provider,
    availableModels,
    geminiKey,
    setEndpoint,
    setModelName,
    setProvider,
    setGeminiKey,
    fetchAvailableModels,
  } = useSettingsStore();

  useEffect(() => {
    fetchAvailableModels();
  }, [provider, endpoint, fetchAvailableModels]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 flex items-center justify-center"
        >
          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -10, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="bg-background text-foreground rounded-lg p-6 w-96 max-w-full m-4 shadow-2xl border border-[#1a1a1a]"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-light tracking-wider">Settings</h2>
              <button
                onClick={() => useSettingsStore.getState().toggleSettings()}
                className="p-1.5 rounded-full hover:bg-[#1a1a1a] transition-colors"
                aria-label="Close Settings"
              >
                <X className="w-4 h-4 text-foreground" />
              </button>
            </div>

            <div className="mb-6">
              <div className="flex gap-2">
                <button
                  onClick={() => setProvider("ollama")}
                  className={`flex-1 p-3 rounded-lg text-sm transition-colors ${
                    provider === "ollama"
                      ? "bg-foreground text-background"
                      : "bg-[#1a1a1a] hover:bg-[#252525]"
                  }`}
                >
                  Ollama
                </button>
                <button
                  onClick={() => setProvider("gemini")}
                  className={`flex-1 p-3 rounded-lg text-sm transition-colors ${
                    provider === "gemini"
                      ? "bg-foreground text-background"
                      : "bg-[#1a1a1a] hover:bg-[#252525]"
                  }`}
                >
                  Gemini
                </button>
              </div>
            </div>

            <div className="mb-6 space-y-1">
              <label className="block text-sm text-foreground font-light">
                Model Name
              </label>
              <select
                value={modelName}
                onChange={(e) => setModelName(e.target.value)}
                className="w-full p-2 bg-background border border-[#1a1a1a] rounded text-sm
                         focus:outline-none focus:border-foreground focus:ring-1 focus:ring-foreground
                         disabled:opacity-50 disabled:cursor-not-allowed
                         transition-colors"
                disabled={availableModels.length === 0}
              >
                {availableModels.length === 0 ? (
                  <option value="">No models available</option>
                ) : (
                  availableModels.map((model) => (
                    <option key={model} value={model}>
                      {model}
                    </option>
                  ))
                )}
              </select>
            </div>

            {provider === "ollama" && (
              <div className="mb-4 space-y-1">
                <label className="block text-sm text-foreground font-light">
                  LLM Endpoint
                </label>
                <input
                  type="text"
                  value={endpoint}
                  onChange={(e) => setEndpoint(e.target.value)}
                  className="w-full p-2 bg-background border border-[#1a1a1a] rounded text-sm 
                           focus:outline-none focus:border-foreground focus:ring-1 focus:ring-foreground
                           transition-colors"
                />
              </div>
            )}

            {provider === "gemini" && (
              <div className="mb-4 space-y-1">
                <label className="block text-sm text-foreground font-light">
                  Gemini Key
                </label>
                <input
                  type="password"
                  value={geminiKey}
                  onChange={(e) => setGeminiKey(e.target.value)}
                  className="w-full p-2 bg-background border border-[#1a1a1a] rounded text-sm 
                           focus:outline-none focus:border-foreground focus:ring-1 focus:ring-foreground
                           transition-colors"
                  placeholder="Enter Gemini API key"
                />
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
