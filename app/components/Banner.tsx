"use client";

import { motion } from "framer-motion";

export default function Banner() {
  const letters = "AITOPIA".split("");

  return (
    <motion.div
      className="fixed inset-0 flex items-center justify-center bg-black"
      initial={{ opacity: 1 }}
      exit={{
        opacity: 0,
        transition: {
          duration: 6,
          ease: [0.16, 1, 0.3, 1],
        },
      }}
    >
      <div className="relative w-full">
        {/* Main title sequence */}
        <div className="relative flex flex-col items-center">
          {/* Main title */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{
              opacity: 0,
              scale: 1.5,
              filter: "blur(20px)",
              transition: {
                duration: 6,
                ease: [0.16, 1, 0.3, 1],
              },
            }}
            transition={{
              duration: 8,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="relative flex justify-center overflow-hidden"
          >
            <div className="relative flex">
              {letters.map((letter, i) => (
                <motion.span
                  key={i}
                  initial={{
                    opacity: 0,
                    marginRight: "0.8em",
                    filter: "blur(20px)",
                  }}
                  animate={{
                    opacity: [0, 0.1, 0.3, 0.6, 1],
                    marginRight: "0.01em",
                    filter: [
                      "blur(20px)",
                      "blur(15px)",
                      "blur(10px)",
                      "blur(5px)",
                      "blur(0px)",
                    ],
                  }}
                  exit={{
                    opacity: 0,
                    scale: 1.5,
                    filter: "blur(20px)",
                    transition: {
                      duration: 6,
                      ease: [0.16, 1, 0.3, 1],
                      delay: i * 0.1,
                    },
                  }}
                  transition={{
                    duration: 8,
                    ease: [0.25, 1, 0.5, 1],
                    opacity: {
                      duration: 8,
                      times: [0, 0.2, 0.4, 0.6, 1],
                      ease: [0.16, 1, 0.3, 1],
                    },
                    filter: {
                      duration: 8,
                      times: [0, 0.2, 0.4, 0.6, 1],
                      ease: [0.16, 1, 0.3, 1],
                    },
                  }}
                  className="text-[4rem] sm:text-[6rem] md:text-[8rem] lg:text-[12rem] font-normal text-white/[0.95] uppercase block relative tracking-tight"
                  style={{
                    textShadow: "0 0 40px rgba(255,255,255,0.1)",
                    fontFamily: "Gugi, sans-serif",
                  }}
                >
                  {letter}
                </motion.span>
              ))}
            </div>
          </motion.div>

          {/* Call to action message */}
          <motion.div
            initial={{ opacity: 0, filter: "blur(10px)" }}
            animate={{
              opacity: 1,
              filter: "blur(0px)",
              transition: {
                duration: 4,
                delay: 3,
                ease: [0.16, 1, 0.3, 1],
              },
            }}
            exit={{
              opacity: 0,
              filter: "blur(10px)",
              transition: {
                duration: 6,
                ease: [0.16, 1, 0.3, 1],
              },
            }}
            className="mt-12 text-center space-y-4"
          >
            <div
              className="text-lg sm:text-xl md:text-2xl text-white/70 tracking-wider font-light"
              style={{ fontFamily: "Gugi, sans-serif" }}
            >
              Where Stories Come Alive
            </div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{
                opacity: 1,
                y: 0,
                transition: {
                  duration: 4,
                  delay: 4,
                  ease: [0.16, 1, 0.3, 1],
                },
              }}
              className="text-sm sm:text-base text-white/50 tracking-wide max-w-md mx-auto"
              style={{ fontFamily: "Gugi, sans-serif" }}
            >
              What will you create?
            </motion.div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
