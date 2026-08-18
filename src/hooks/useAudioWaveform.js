import { useState, useEffect, useRef, useCallback } from 'react';

export function useAudioWaveform(isListening) {
  const [audioPermission, setAudioPermission] = useState('prompt'); // 'granted', 'denied', 'prompt'
  const [audioError, setAudioError] = useState(null);
  
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const dataArrayRef = useRef(null);

  // Initialize Audio Context and AnalyserNode
  const initAudio = useCallback(async () => {
    if (mediaStreamRef.current && audioContextRef.current) {
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }
      return true;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      const audioContext = new AudioContextClass();
      const analyser = audioContext.createAnalyser();
      
      analyser.fftSize = 128; // 64 frequency bins
      analyser.smoothingTimeConstant = 0.8;

      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount);

      setAudioPermission('granted');
      setAudioError(null);
      return true;
    } catch (err) {
      console.warn('Audio visualization permission/stream error:', err);
      setAudioPermission('denied');
      setAudioError(err.message || 'Microphone access denied for waveform');
      return false;
    }
  }, []);

  // Sync audio context state with isListening prop
  useEffect(() => {
    if (isListening) {
      initAudio();
    } else {
      if (audioContextRef.current && audioContextRef.current.state === 'running') {
        audioContextRef.current.suspend().catch(() => {});
      }
    }
  }, [isListening, initAudio]);

  // Clean up media stream on unmount
  useEffect(() => {
    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, []);

  // Utility to read current frequency frame
  const getFrequencyData = useCallback((outputArray) => {
    if (analyserRef.current && dataArrayRef.current && isListening) {
      analyserRef.current.getByteFrequencyData(dataArrayRef.current);
      if (outputArray) {
        outputArray.set(dataArrayRef.current);
      }
      return dataArrayRef.current;
    }
    return null;
  }, [isListening]);

  return {
    audioPermission,
    audioError,
    getFrequencyData,
    initAudio,
  };
}
