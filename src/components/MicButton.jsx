import React from 'react';
import { motion } from 'framer-motion';
import { Mic, Square } from 'lucide-react';

export function MicButton({ isListening, onClick, disabled = false, isDarkMode = true }) {
  return (
    <div className="relative flex items-center justify-center z-20">
      {/* Outer Pulsing Yellow Glow Rings when listening */}
      {isListening && (
        <>
          <motion.div
            initial={{ scale: 0.9, opacity: 0.9 }}
            animate={{ scale: [1, 1.85, 2.3], opacity: [0.8, 0.35, 0] }}
            transition={{
              duration: 1.8,
              repeat: Infinity,
              ease: "easeOut",
            }}
            className="absolute w-16 h-16 rounded-full bg-amber-400/40 pointer-events-none blur-sm"
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0.9 }}
            animate={{ scale: [1, 1.45, 1.8], opacity: [0.9, 0.45, 0] }}
            transition={{
              duration: 1.8,
              repeat: Infinity,
              delay: 0.45,
              ease: "easeOut",
            }}
            className="absolute w-16 h-16 rounded-full bg-yellow-300/30 pointer-events-none"
          />
        </>
      )}

      {/* Main Mic Trigger Button */}
      <motion.button
        whileHover={{ scale: disabled ? 1 : 1.08 }}
        whileTap={{ scale: disabled ? 1 : 0.93 }}
        onClick={onClick}
        disabled={disabled}
        aria-label={isListening ? "Stop Transcription" : "Start Voice Transcription"}
        className={`
          relative w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center
          shadow-xl transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-amber-400/40
          ${
            disabled
              ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed border-2 border-zinc-700'
              : isListening
              ? 'bg-amber-400 text-black shadow-glow-mic border-2 border-amber-300 ring-4 ring-amber-400/30'
              : 'bg-black text-amber-400 border-2 border-amber-400 hover:bg-amber-400 hover:text-black shadow-lg hover:shadow-glow-mic'
          }
        `}
      >
        {isListening ? (
          <div className="flex items-center justify-center">
            <Square className="w-7 h-7 md:w-8 md:h-8 fill-current text-black animate-pulse" />
          </div>
        ) : (
          <Mic className="w-8 h-8 md:w-9 md:h-9 transition-transform duration-200 stroke-[2.5]" />
        )}
      </motion.button>
    </div>
  );
}
