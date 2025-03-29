import { motion, AnimatePresence } from "framer-motion";
import { useTheaterStore } from "../store/theaterStore";

export default function InputQueue() {
  const { inputQueue } = useTheaterStore();

  return (
    <AnimatePresence>
      <div className="space-y-1 mb-1">
        {inputQueue.map((text, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{
              duration: 0.3,
              ease: "easeOut",
            }}
            className="text-sm text-white/50 bg-black/60 backdrop-blur-md px-6 py-1 rounded-full border border-white/5"
          >
            {text}
          </motion.div>
        ))}
      </div>
    </AnimatePresence>
  );
}
