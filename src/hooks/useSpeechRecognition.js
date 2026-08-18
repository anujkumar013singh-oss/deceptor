import { useState, useEffect, useRef, useCallback } from 'react';

export function useSpeechRecognition() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState(null);
  const [isSupported, setIsSupported] = useState(true);

  const recognitionRef = useRef(null);
  const shouldBeListeningRef = useRef(false);
  const restartTimerRef = useRef(null);

  // Check browser support on mount
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSupported(false);
      setError('unsupported');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        setError(null);
      };

      recognition.onresult = (event) => {
        let newFinal = '';
        let currentInterim = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const result = event.results[i];
          if (result.isFinal) {
            newFinal += result[0].transcript;
          } else {
            currentInterim += result[0].transcript;
          }
        }

        if (newFinal) {
          setTranscript((prev) => {
            // Add space if previous transcript doesn't end with space or punctuation
            const needsSpace = prev.length > 0 && !/\s$/.test(prev);
            return prev + (needsSpace ? ' ' : '') + newFinal;
          });
        }
        setInterimTranscript(currentInterim);
      };

      recognition.onerror = (event) => {
        console.warn('SpeechRecognition error:', event.error);
        if (event.error === 'no-speech') {
          // Silent ignore for continuous speech listening, keep trying
          return;
        }

        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          setError('permission-denied');
          shouldBeListeningRef.current = false;
          setIsListening(false);
        } else if (event.error === 'network') {
          setError('network');
        } else {
          setError(event.error);
        }
      };

      recognition.onend = () => {
        // Auto-restart if user intends to stay listening
        if (shouldBeListeningRef.current) {
          restartTimerRef.current = setTimeout(() => {
            if (shouldBeListeningRef.current && recognitionRef.current) {
              try {
                recognitionRef.current.start();
              } catch (e) {
                console.log('Restart start ignored (already active):', e);
              }
            }
          }, 150);
        } else {
          setIsListening(false);
          setInterimTranscript('');
        }
      };

      recognitionRef.current = recognition;
    } catch (err) {
      console.error('Failed to initialize SpeechRecognition:', err);
      setIsSupported(false);
      setError('unsupported');
    }

    return () => {
      if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
      if (recognitionRef.current) {
        shouldBeListeningRef.current = false;
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // ignore cleanup errors
        }
      }
    };
  }, []);

  const startListening = useCallback(() => {
    if (!isSupported || !recognitionRef.current) {
      setError('unsupported');
      return;
    }

    setError(null);
    shouldBeListeningRef.current = true;

    try {
      recognitionRef.current.start();
    } catch (err) {
      // If already started, ignore error
      if (err.name !== 'InvalidStateError') {
        console.error('Error starting SpeechRecognition:', err);
      }
    }
  }, [isSupported]);

  const stopListening = useCallback(() => {
    shouldBeListeningRef.current = false;
    setIsListening(false);
    setInterimTranscript('');

    if (restartTimerRef.current) clearTimeout(restartTimerRef.current);

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (err) {
        console.error('Error stopping SpeechRecognition:', err);
      }
    }
  }, []);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  const clearTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    isListening,
    transcript,
    interimTranscript,
    error,
    isSupported,
    startListening,
    stopListening,
    toggleListening,
    clearTranscript,
    clearError,
    setTranscript,
  };
}
