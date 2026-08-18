import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, ShieldAlert, RefreshCw, Compass } from 'lucide-react';

export function BrowserFallbackBanner({ error, onRetry, isDarkMode = true }) {
  if (!error) return null;

  let title = "Voice Input Notification";
  let description = "Please check your microphone setup.";
  let Icon = AlertTriangle;
  let showRetry = true;

  if (error === 'unsupported') {
    title = "Browser Speech API Unsupported";
    description = "Voice input works best in Google Chrome, Microsoft Edge, or Brave. Please switch to a Chromium-based browser to use live voice transcription.";
    Icon = Compass;
    showRetry = false;
  } else if (error === 'permission-denied') {
    title = "Microphone Access Denied";
    description = "VoiceScript needs microphone access to convert your speech to live text. Click the mic icon in your browser address bar to allow permission.";
    Icon = ShieldAlert;
    showRetry = true;
  } else if (error === 'network') {
    title = "Network Connection Issue";
    description = "Speech recognition requires an active internet connection. Please check your connection and retry.";
    Icon = AlertTriangle;
    showRetry = true;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="w-full rounded-2xl p-4 mb-4 border-2 border-amber-400/40 bg-zinc-950 text-amber-400 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg font-sans"
    >
      <div className="flex items-start space-x-3">
        <div className="p-2 rounded-xl bg-amber-400 text-black shrink-0 mt-0.5 sm:mt-0 font-bold">
          <Icon className="w-5 h-5 stroke-[2.5]" />
        </div>
        <div>
          <h4 className="font-heading font-extrabold text-sm leading-tight text-white">{title}</h4>
          <p className="text-xs mt-1 text-zinc-300 leading-relaxed max-w-xl">{description}</p>
        </div>
      </div>

      {showRetry && onRetry && (
        <button
          onClick={onRetry}
          className="shrink-0 px-4 py-1.5 rounded-xl text-xs font-heading font-extrabold bg-amber-400 text-black hover:bg-yellow-300 shadow-sm flex items-center space-x-1.5 transition-all self-end sm:self-center uppercase tracking-wider"
        >
          <RefreshCw className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>RETRY</span>
        </button>
      )}
    </motion.div>
  );
}
