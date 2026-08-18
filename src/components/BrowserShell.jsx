import React from 'react';
import { motion } from 'framer-motion';
import { WaveformVisualizer } from './WaveformVisualizer';
import { MicButton } from './MicButton';
import { TranscriptPanel } from './TranscriptPanel';
import { BrowserFallbackBanner } from './BrowserFallbackBanner';
import { Lock, Search } from 'lucide-react';

export function BrowserShell({
  isListening,
  onMicClick,
  getFrequencyData,
  transcript,
  interimTranscript,
  onClearTranscript,
  error,
  onRetryError,
  isSupported,
  isDarkMode = true,
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="w-full max-w-3xl mx-auto"
    >
      {/* Fallback Banner */}
      <BrowserFallbackBanner error={error} onRetry={onRetryError} isDarkMode={isDarkMode} />

      {/* Main Browser Shell Card */}
      <div
        className={`
          w-full rounded-3xl p-5 md:p-8 transition-all duration-300 relative overflow-hidden shadow-2xl
          ${
            isDarkMode
              ? 'bg-black/95 border-2 border-amber-400/25 shadow-glow-card'
              : 'bg-white border-2 border-amber-300 shadow-xl shadow-amber-100/60'
          }
        `}
      >
        {/* TOP BAR: Browser Chrome */}
        <div className={`w-full flex items-center justify-between pb-4 mb-4 border-b ${
          isDarkMode ? 'border-zinc-800' : 'border-amber-100'
        }`}>
          {/* Traffic Light Dots */}
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full bg-rose-500 shadow-sm inline-block" />
            <span className="w-3 h-3 rounded-full bg-amber-400 shadow-sm inline-block" />
            <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-sm inline-block" />
          </div>

          {/* Fake Address Bar */}
          <div className={`flex-1 max-w-sm mx-4 rounded-full px-3.5 py-1 flex items-center justify-between text-xs border select-none shadow-inner font-mono ${
            isDarkMode
              ? 'bg-zinc-950 text-zinc-400 border-amber-400/30'
              : 'bg-amber-50 text-zinc-500 border-amber-200'
          }`}>
            <div className="flex items-center space-x-1.5 truncate">
              <Lock className={`w-3.5 h-3.5 shrink-0 ${isDarkMode ? 'text-amber-400' : 'text-amber-600'}`} />
              <span className={`text-[11px] truncate tracking-tight ${isDarkMode ? 'text-zinc-300' : 'text-zinc-600'}`}>
                https://voicescript.app/studio
              </span>
            </div>
            <Search className={`w-3 h-3 shrink-0 ml-1 ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`} />
          </div>

          {/* Status Badge */}
          <div className={`text-[11px] font-bold font-mono tracking-widest uppercase hidden sm:block ${
            isDarkMode ? 'text-amber-400' : 'text-amber-600'
          }`}>
            {isListening ? 'LIVE' : 'READY'}
          </div>
        </div>

        {/* WAVEFORM & MIC */}
        <div className="relative w-full flex flex-col items-center justify-center my-2">
          <WaveformVisualizer
            isListening={isListening}
            getFrequencyData={getFrequencyData}
            isDarkMode={isDarkMode}
          />

          {/* Overlapping Centered Mic Button */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
            <MicButton
              isListening={isListening}
              onClick={onMicClick}
              disabled={!isSupported || error === 'permission-denied'}
              isDarkMode={isDarkMode}
            />
          </div>
        </div>

        {/* Guidance Text */}
        <div className={`w-full text-center my-1 font-heading font-semibold text-xs tracking-widest uppercase ${
          isDarkMode ? 'text-zinc-500' : 'text-zinc-400'
        }`}>
          {isListening ? 'Click mic button to pause' : 'Click mic to start voice transcription'}
        </div>

        {/* TRANSCRIPT PANEL */}
        <TranscriptPanel
          transcript={transcript}
          interimTranscript={interimTranscript}
          isListening={isListening}
          onClear={onClearTranscript}
          isDarkMode={isDarkMode}
        />
      </div>
    </motion.div>
  );
}
