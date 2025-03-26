"use client";

import { motion } from "framer-motion";

export default function Banner() {
  const letters = "AITOPIA".split("");
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 flex items-center justify-center bg-black"
    >
      <div className="relative w-full">
        {/* System boot sequence */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 2 }}
          className="absolute top-[15vh] left-[10vw] flex flex-col gap-2"
        >
          {[
            { text: "INITIALIZING NEURAL CORE...", delay: 0 },
            { text: "ACCESSING MAINFRAME...", delay: 0.8 },
            { text: "BYPASSING SECURITY PROTOCOLS...", delay: 1.6 },
            { text: "ACCESS GRANTED", delay: 2.4 }
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{
                duration: 0.5,
                delay: item.delay,
                ease: [0.16, 1, 0.3, 1]
              }}
              className="text-xs font-mono tracking-[0.2em] text-white/30"
            >
              {item.text}
            </motion.div>
          ))}
        </motion.div>

        {/* Main title sequence */}
        <div className="relative flex flex-col items-center">
          {/* Vertical scan line */}
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "70vh" }}
            transition={{
              duration: 3,
              delay: 3,
              ease: [0.76, 0, 0.24, 1]
            }}
            className="absolute top-[15vh] w-[1px] bg-white/10"
          />

          {/* Main title */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{
              duration: 4,
              delay: 3.5,
              ease: [0.16, 1, 0.3, 1]
            }}
            className="relative mt-[30vh] flex justify-center overflow-hidden"
          >
            <div className="relative flex">
              {letters.map((letter, i) => (
                <motion.span
                  key={i}
                  initial={{ 
                    opacity: 0,
                    marginRight: "0.4em",
                    filter: "blur(20px)",
                    y: 20
                  }}
                  animate={{ 
                    opacity: [0, 0.1, 0.3, 0.6, 1],
                    marginRight: "0.02em",
                    filter: ["blur(20px)", "blur(15px)", "blur(10px)", "blur(5px)", "blur(0px)"],
                    y: 0
                  }}
                  transition={{
                    duration: 8,
                    delay: 3.5,
                    ease: [0.25, 1, 0.5, 1],
                    opacity: {
                      duration: 8,
                      delay: 3.5,
                      times: [0, 0.2, 0.4, 0.6, 1],
                      ease: [0.16, 1, 0.3, 1]
                    },
                    filter: {
                      duration: 8,
                      delay: 3.5,
                      times: [0, 0.2, 0.4, 0.6, 1],
                      ease: [0.16, 1, 0.3, 1]
                    }
                  }}
                  className="text-[16rem] font-thin text-white/[0.95] uppercase block relative"
                  style={{
                    textShadow: '0 0 40px rgba(255,255,255,0.1)'
                  }}
                >
                  {letter}
                </motion.span>
              ))}
            </div>
            
            {/* Horizontal interference lines */}
            {[...Array(15)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ scaleX: 0, opacity: 0.05 }}
                animate={{ scaleX: 1, opacity: 0.05 }}
                transition={{
                  duration: 2.5,
                  delay: 3.5 + (i * 0.15),
                  ease: [0.76, 0, 0.24, 1]
                }}
                className="absolute w-full h-[1px] bg-white origin-left"
                style={{
                  top: `${(i + 1) * 6}%`
                }}
              />
            ))}
          </motion.div>

          {/* System status */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{
              duration: 3,
              delay: 12,
              ease: [0.16, 1, 0.3, 1]
            }}
            className="mt-20 flex flex-col items-center gap-3"
          >
            <div className="text-sm font-mono tracking-[0.2em] text-white/30">
              SYSTEM STATUS: OPERATIONAL
            </div>
            <div className="text-sm font-mono tracking-[0.2em] text-white/30">
              AWAITING HUMAN INPUT...
            </div>
          </motion.div>
        </div>

        {/* Corner accents */}
        {[0, 1, 2, 3].map((i) => (
          <motion.div
            key={i}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{
              duration: 2,
              delay: 3 + (i * 0.3),
              ease: [0.76, 0, 0.24, 1]
            }}
            className="absolute w-[20vw] h-[1px] bg-white/10"
            style={{
              top: i < 2 ? '15vh' : '85vh',
              left: i % 2 === 0 ? '10vw' : 'auto',
              right: i % 2 === 1 ? '10vw' : 'auto',
            }}
          />
        ))}
      </div>
    </motion.div>
  );
}
