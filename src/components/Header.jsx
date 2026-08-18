import React from 'react';
import { Mic, Moon, Sun, Globe, Radio } from 'lucide-react';

export function Header({ isListening, isDarkMode, onToggleTheme }) {
  return (
    <header className="w-full max-w-3xl flex items-center justify-between mb-6 px-2">

      {/* Brand Logo & Name */}
      <div className="flex items-center space-x-3.5">
        {/* Icon mark */}
        <div className="w-11 h-11 rounded-2xl bg-amber-400 text-black flex items-center justify-center shadow-lg shadow-amber-400/30 ring-2 ring-amber-300/40 transform hover:scale-105 transition-transform duration-200">
          <Mic className="w-6 h-6 stroke-[2.5]" />
        </div>

        <div>
          <div className="flex items-center space-x-2.5">
            {/* Wordmark: 'Voice' in primary color, 'Script' in accent yellow */}
            <h1 className={`text-2xl md:text-3xl font-extrabold font-heading tracking-tight ${
              isDarkMode ? 'text-white' : 'text-zinc-900'
            }`}>
              Voice<span className={isDarkMode ? 'text-amber-400' : 'text-amber-500'}>Script</span>
            </h1>

            {/* Language badge */}
            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border flex items-center space-x-1 font-mono tracking-wider ${
              isDarkMode
                ? 'bg-amber-400/10 text-amber-400 border-amber-400/25'
                : 'bg-amber-100 text-amber-700 border-amber-300'
            }`}>
              <Globe className="w-3 h-3" />
              <span>EN-US</span>
            </span>
          </div>

          {/* Tagline */}
          <p className={`text-xs font-medium tracking-wide mt-0.5 ${
            isDarkMode ? 'text-zinc-400' : 'text-zinc-500'
          }`}>
            Real-Time Voice-to-Text Studio
          </p>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center space-x-3">

        {/* Live / Ready status badge */}
        <div className={`
          hidden sm:flex items-center space-x-2 px-3.5 py-1.5 rounded-full
          text-xs font-bold font-mono uppercase tracking-wider border transition-all duration-300
          ${isListening
            ? 'bg-amber-400 text-black border-amber-300 shadow-glow-yellow'
            : isDarkMode
              ? 'bg-zinc-900 border-zinc-800 text-zinc-400'
              : 'bg-white border-amber-200 text-zinc-500 shadow-sm'
          }
        `}>
          <Radio className={`w-3.5 h-3.5 ${isListening ? 'animate-pulse text-black' : ''}`} />
          <span>{isListening ? 'RECORDING' : 'READY'}</span>
        </div>

        {/* Theme toggle */}
        <button
          onClick={onToggleTheme}
          aria-label="Toggle dark/light theme"
          title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          className={`
            p-2.5 rounded-2xl border shadow-md transition-all duration-200
            hover:bg-amber-400 hover:text-black hover:border-amber-300
            ${isDarkMode
              ? 'bg-zinc-900 border-amber-400/30 text-amber-400'
              : 'bg-white border-amber-300 text-amber-600'
            }
          `}
        >
          {isDarkMode ? (
            <Sun className="w-4 h-4" />
          ) : (
            <Moon className="w-4 h-4" />
          )}
        </button>
      </div>
    </header>
  );
}
