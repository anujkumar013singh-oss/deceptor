import React, { useState, useEffect, useCallback } from 'react';
import { useSpeechRecognition } from './hooks/useSpeechRecognition';
import { useAudioWaveform } from './hooks/useAudioWaveform';
import { Header } from './components/Header';
import { BrowserShell } from './components/BrowserShell';
import { Keyboard, ShieldCheck } from 'lucide-react';

export function App() {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('voicescript-theme');
    if (saved !== null) return saved === 'dark';
    return true; // default to high-contrast black & yellow mode
  });

  const {
    isListening,
    transcript,
    interimTranscript,
    error: speechError,
    isSupported,
    toggleListening,
    clearTranscript,
    startListening,
    clearError,
  } = useSpeechRecognition();

  const { getFrequencyData } = useAudioWaveform(isListening);

  // Sync theme class on <html> element
  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
      localStorage.setItem('voicescript-theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('voicescript-theme', 'light');
    }
  }, [isDarkMode]);

  const toggleTheme = useCallback(() => {
    setIsDarkMode((prev) => !prev);
  }, []);

  // Global Keyboard Shortcut: Space to toggle recording
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA', 'BUTTON', 'SELECT'].includes(document.activeElement?.tagName)) {
        return;
      }
      if (e.code === 'Space') {
        e.preventDefault();
        toggleListening();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleListening]);

  return (
    <div className={`min-h-screen flex flex-col justify-between p-4 md:p-8 transition-colors duration-300 relative overflow-hidden font-sans ${
      isDarkMode
        ? 'bg-black text-white'
        : 'bg-amber-50 text-zinc-900'
    }`}>

      {/* Decorative Ambient Glow Orbs — adapts per mode */}
      <div className={`absolute top-[-10%] left-[-10%] w-[550px] h-[550px] rounded-full blur-[150px] pointer-events-none ${
        isDarkMode ? 'bg-amber-400/10' : 'bg-amber-300/20'
      }`} />
      <div className={`absolute bottom-[-10%] right-[-10%] w-[550px] h-[550px] rounded-full blur-[160px] pointer-events-none ${
        isDarkMode ? 'bg-yellow-500/8' : 'bg-yellow-400/15'
      }`} />

      {/* Header */}
      <div className="w-full flex flex-col items-center relative z-10">
        <Header
          isListening={isListening}
          isDarkMode={isDarkMode}
          onToggleTheme={toggleTheme}
        />

        {/* Main Card */}
        <main className="w-full relative z-10 my-4">
          <BrowserShell
            isListening={isListening}
            onMicClick={toggleListening}
            getFrequencyData={getFrequencyData}
            transcript={transcript}
            interimTranscript={interimTranscript}
            onClearTranscript={clearTranscript}
            error={speechError}
            onRetryError={() => {
              clearError();
              startListening();
            }}
            isSupported={isSupported}
            isDarkMode={isDarkMode}
          />
        </main>
      </div>

      {/* Footer */}
      <footer className={`w-full max-w-3xl mx-auto mt-8 pt-4 border-t flex flex-col sm:flex-row items-center justify-between text-xs gap-3 relative z-10 font-mono ${
        isDarkMode
          ? 'border-zinc-800 text-zinc-400'
          : 'border-amber-200 text-zinc-500'
      }`}>
        <div className="flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-amber-500" />
          <span>100% Client-Side • Privacy-First Voice Recognition</span>
        </div>

        <div className="flex items-center space-x-4">
          <span className={`flex items-center space-x-1.5 px-3 py-1 rounded-lg border ${
            isDarkMode
              ? 'bg-zinc-900 border-zinc-800 text-zinc-300'
              : 'bg-white border-amber-200 text-zinc-600 shadow-sm'
          }`}>
            <Keyboard className="w-3.5 h-3.5 text-amber-500" />
            <span>
              PRESS{' '}
              <kbd className={`font-bold px-1.5 py-0.5 rounded border ${
                isDarkMode
                  ? 'text-amber-400 bg-black border-amber-400/30'
                  : 'text-amber-700 bg-amber-50 border-amber-300'
              }`}>SPACE</kbd>
              {' '}TO RECORD
            </span>
          </span>
          <span className="text-amber-500 font-bold font-heading">VoiceScript</span>
        </div>
      </footer>
    </div>
  );
}

export default App;
