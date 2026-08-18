import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Check, Trash2, Download, Sparkles } from 'lucide-react';
import { copyToClipboard, downloadTranscript, calculateMetrics } from '../utils/exportUtils';

// Font size options: logically increasing from Small → Medium → Large
// Each maps to a specific text size + line height combo
const FONT_SIZES = [
  { key: 'sm', label: 'S', textClass: 'text-sm', leadingClass: 'leading-relaxed' },
  { key: 'md', label: 'M', textClass: 'text-base', leadingClass: 'leading-relaxed' },
  { key: 'lg', label: 'L', textClass: 'text-lg', leadingClass: 'leading-loose' },
];

export function TranscriptPanel({
  transcript,
  interimTranscript,
  isListening,
  onClear,
  isDarkMode = true,
}) {
  const [copied, setCopied] = useState(false);
  const [fontSize, setFontSize] = useState('md');
  const scrollRef = useRef(null);

  // Auto-scroll to bottom on text updates
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcript, interimTranscript]);

  const handleCopy = async () => {
    const fullText = (transcript + (interimTranscript ? ' ' + interimTranscript : '')).trim();
    if (!fullText) return;
    const success = await copyToClipboard(fullText);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }
  };

  const handleDownload = (format) => {
    const fullText = (transcript + (interimTranscript ? ' ' + interimTranscript : '')).trim();
    if (!fullText) return;
    downloadTranscript(fullText, 'voicescript-transcript', format);
  };

  const fullText = (transcript + (interimTranscript ? ' ' + interimTranscript : '')).trim();
  const metrics = calculateMetrics(fullText);
  const hasContent = Boolean(fullText);

  // Resolve current font size classes
  const currentSize = FONT_SIZES.find((f) => f.key === fontSize) || FONT_SIZES[1];

  return (
    <div className="w-full flex flex-col mt-4 font-sans">
      {/* Transcript Card */}
      <div
        className={`
          relative w-full rounded-2xl p-4 md:p-6 transition-all duration-300 flex flex-col min-h-[260px] max-h-[420px]
          ${isDarkMode
            ? 'bg-zinc-950 border border-zinc-800 text-zinc-100'
            : 'bg-amber-50 border border-amber-200 text-zinc-900 shadow-inner'
          }
        `}
      >
        {/* ── Toolbar ─────────────────────────────────────────── */}
        <div className={`flex items-center justify-between pb-3 mb-3 border-b ${
          isDarkMode ? 'border-zinc-800' : 'border-amber-200'
        }`}>

          {/* Live status indicator */}
          <div className={`flex items-center space-x-2 text-xs font-bold font-mono tracking-wider uppercase ${
            isDarkMode ? 'text-amber-400' : 'text-amber-600'
          }`}>
            <span className={`w-2 h-2 rounded-full ${
              isListening
                ? 'bg-amber-400 animate-ping'
                : isDarkMode ? 'bg-zinc-600' : 'bg-amber-200'
            }`} />
            <span>{isListening ? 'LIVE STREAM' : 'READY'}</span>
          </div>

          {/* Right-side action buttons */}
          <div className="flex items-center gap-1.5">

            {/* ── Font Size Selector (S / M / L) ── */}
            <div className={`hidden sm:flex items-center rounded-lg p-0.5 border ${
              isDarkMode
                ? 'bg-zinc-900 border-zinc-800'
                : 'bg-white border-amber-200'
            }`}>
              {FONT_SIZES.map((size) => (
                <button
                  key={size.key}
                  onClick={() => setFontSize(size.key)}
                  title={`Font size: ${size.key}`}
                  className={`
                    w-7 h-6 flex items-center justify-center rounded font-heading font-bold transition-all duration-150
                    ${size.key === 'sm' ? 'text-[10px]' : size.key === 'md' ? 'text-[12px]' : 'text-[14px]'}
                    ${fontSize === size.key
                      ? 'bg-amber-400 text-black shadow-sm'
                      : isDarkMode
                        ? 'text-zinc-400 hover:text-white'
                        : 'text-zinc-400 hover:text-zinc-700'
                    }
                  `}
                >
                  {/* Show visually growing A for intuitive sizing */}
                  A
                </button>
              ))}
            </div>

            {/* ── Clear Button ── */}
            <button
              onClick={onClear}
              disabled={!hasContent}
              aria-label="Clear Transcript"
              title="Clear transcript"
              className={`
                flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold border transition-all duration-200
                ${!hasContent
                  ? 'opacity-30 cursor-not-allowed border-transparent ' + (isDarkMode ? 'text-zinc-600' : 'text-zinc-400')
                  : isDarkMode
                    ? 'text-zinc-400 border-zinc-800 hover:text-amber-400 hover:border-amber-400/40 hover:bg-zinc-900'
                    : 'text-zinc-500 border-amber-200 hover:text-amber-700 hover:border-amber-400 hover:bg-amber-100'
                }
              `}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden md:inline font-mono tracking-wider">CLR</span>
            </button>

            {/* ── Download Button ── */}
            {hasContent && (
              <button
                onClick={() => handleDownload('txt')}
                title="Download transcript as .txt"
                className={`
                  p-1.5 rounded-xl border text-xs font-bold transition-all duration-200
                  ${isDarkMode
                    ? 'text-zinc-400 border-zinc-800 hover:text-amber-400 hover:border-amber-400/40 hover:bg-zinc-900'
                    : 'text-zinc-500 border-amber-200 hover:text-amber-700 hover:border-amber-400 hover:bg-amber-100'
                  }
                `}
              >
                <Download className="w-3.5 h-3.5" />
              </button>
            )}

            {/* ── Copy Button (Primary CTA) ── */}
            <motion.button
              whileHover={{ scale: hasContent ? 1.04 : 1 }}
              whileTap={{ scale: hasContent ? 0.95 : 1 }}
              onClick={handleCopy}
              disabled={!hasContent}
              aria-label="Copy Transcript to Clipboard"
              className={`
                flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-extrabold font-heading uppercase tracking-wider shadow-md transition-all duration-200
                ${!hasContent
                  ? isDarkMode
                    ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                    : 'bg-amber-100 text-zinc-400 cursor-not-allowed'
                  : copied
                    ? 'bg-emerald-500 text-white shadow-emerald-500/30'
                    : 'bg-amber-400 hover:bg-yellow-300 text-black shadow-glow-yellow'
                }
              `}
            >
              <AnimatePresence mode="wait" initial={false}>
                {copied ? (
                  <motion.span
                    key="copied"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="flex items-center gap-1"
                  >
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                    COPIED!
                  </motion.span>
                ) : (
                  <motion.span
                    key="copy"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="flex items-center gap-1"
                  >
                    <Copy className="w-3.5 h-3.5 stroke-[2.5]" />
                    COPY
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          </div>
        </div>

        {/* ── Scrollable Transcript Text ───────────────────────── */}
        <div
          ref={scrollRef}
          className={`flex-1 overflow-y-auto custom-scrollbar pr-2 my-1 whitespace-pre-wrap transition-all duration-200 ${
            currentSize.textClass
          } ${currentSize.leadingClass}`}
        >
          {hasContent ? (
            <p className="tracking-normal">
              {/* Final confirmed words */}
              <span className={isDarkMode ? 'text-zinc-100' : 'text-zinc-900'}>
                {transcript}
              </span>

              {/* Live interim words — highlighted yellow badge, inherits font size */}
              {interimTranscript && (
                <span className={`inline ml-1.5 font-bold italic px-1.5 py-0.5 rounded animate-pulse ${
                  isDarkMode
                    ? 'text-black bg-amber-400'
                    : 'text-amber-900 bg-amber-200'
                }`}>
                  {interimTranscript}
                </span>
              )}
            </p>
          ) : (
            <div className="h-full min-h-[160px] flex flex-col items-center justify-center text-center p-6 select-none">
              <Sparkles className={`w-10 h-10 mb-3 animate-pulse ${isDarkMode ? 'text-amber-400/50' : 'text-amber-400'}`} />
              <p className={`font-heading font-bold text-lg mb-1 ${isDarkMode ? 'text-zinc-300' : 'text-zinc-700'}`}>
                Start speaking…
              </p>
              <p className={`text-sm leading-relaxed ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
                Your live transcript will appear here in real time.
              </p>
              <p className={`text-xs mt-1 font-mono ${isDarkMode ? 'text-zinc-600' : 'text-zinc-400'}`}>
                Click the mic above or press <kbd className={`px-1 rounded font-bold ${
                  isDarkMode ? 'bg-zinc-800 text-amber-400' : 'bg-amber-100 text-amber-700 border border-amber-200'
                }`}>Space</kbd> to record · English (en-US)
              </p>
            </div>
          )}
        </div>

        {/* ── Metrics Bar ──────────────────────────────────────── */}
        <div className={`pt-2.5 mt-2 border-t flex items-center justify-between text-xs font-mono ${
          isDarkMode
            ? 'border-zinc-800 text-zinc-500'
            : 'border-amber-200 text-zinc-400'
        }`}>
          <div className="flex items-center gap-4">
            <span>
              <strong className={`font-bold ${isDarkMode ? 'text-amber-400' : 'text-amber-600'}`}>
                {metrics.wordCount}
              </strong>{' '}
              WORDS
            </span>
            <span>
              <strong className={`font-bold ${isDarkMode ? 'text-amber-400' : 'text-amber-600'}`}>
                {metrics.charCount}
              </strong>{' '}
              CHARS
            </span>
          </div>
          <span>
            EST.{' '}
            <strong className={`font-bold ${isDarkMode ? 'text-amber-400' : 'text-amber-600'}`}>
              {metrics.readingTime}
            </strong>
          </span>
        </div>
      </div>
    </div>
  );
}
