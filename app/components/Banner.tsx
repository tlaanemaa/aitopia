'use client';

import { motion } from 'framer-motion';

export default function Banner() {
  return (
    <motion.div 
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.2 }}
      className="fixed text-white flex flex-col inset-0 justify-center items-center text-center"
    >
      <h1 className="text-6xl font-light">Welcome to Aitopia</h1>
    </motion.div>
  );
}
