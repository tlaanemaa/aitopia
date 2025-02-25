"use client";

import { Settings2 } from "lucide-react";
import { motion } from "framer-motion";
import { useSettingsStore } from "../store/settingsStore";

export default function SettingsButton() {
  const toggleSettings = useSettingsStore((state) => state.toggleSettings);

  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={toggleSettings}
      className="fixed top-4 right-4 p-2 rounded-full bg-background hover:bg-[#1a1a1a] transition-colors"
      aria-label="Toggle Settings"
    >
      <Settings2 className="w-5 h-5 text-foreground" />
    </motion.button>
  );
}
