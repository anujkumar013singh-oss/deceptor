import React, { useEffect, useRef } from 'react';

export function WaveformVisualizer({ isListening, getFrequencyData, isDarkMode = true }) {
  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);
  const phaseRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let width = canvas.width;
    let height = canvas.height;

    // Handle high DPI Retina displays
    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      width = canvas.width;
      height = canvas.height;
      ctx.scale(dpr, dpr);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const freqArray = new Uint8Array(64);

    const render = () => {
      const rect = canvas.getBoundingClientRect();
      const displayWidth = rect.width;
      const displayHeight = rect.height;

      ctx.clearRect(0, 0, displayWidth, displayHeight);

      // Determine number of bars based on screen width
      const barCount = displayWidth < 480 ? 32 : displayWidth < 768 ? 48 : 64;
      const gap = 3.5;
      const totalGaps = (barCount - 1) * gap;
      const barWidth = Math.max(2.5, (displayWidth - totalGaps) / barCount);
      const centerY = displayHeight / 2;

      // Get real audio frequency data if listening
      let audioData = null;
      if (isListening && getFrequencyData) {
        audioData = getFrequencyData(freqArray);
      }

      phaseRef.current += isListening ? 0.09 : 0.035;

      const centerIndex = Math.floor(barCount / 2);
      const micAvoidRadius = displayWidth < 480 ? 3 : 5;

      for (let i = 0; i < barCount; i++) {
        let barHeight = 4; // minimum height

        if (isListening && audioData) {
          // Map frequency data bin to bar
          const dataIdx = Math.floor((i / barCount) * audioData.length);
          const rawValue = audioData[dataIdx] || 0;
          const amp = rawValue / 255;
          barHeight = Math.max(6, amp * (displayHeight * 0.75));
        } else {
          // Idle state: gentle breathing sine animation
          const distFromCenter = Math.abs(i - centerIndex);
          const wave1 = Math.sin(phaseRef.current + i * 0.15) * 7;
          const wave2 = Math.cos(phaseRef.current * 0.7 + i * 0.1) * 5;
          const baseAmp = Math.max(0, 12 - distFromCenter * 0.2);
          barHeight = Math.max(4, 8 + wave1 + wave2 + baseAmp);
        }

        // Dampen height near center to keep visual balance under the overlapping mic button
        const distFromMid = Math.abs(i - centerIndex);
        if (distFromMid < micAvoidRadius) {
          const factor = distFromMid / micAvoidRadius;
          barHeight *= 0.25 + 0.75 * factor;
        }

        const x = i * (barWidth + gap);
        const y = centerY - barHeight / 2;

        // Gradient styling: Black & Yellow
        const gradient = ctx.createLinearGradient(0, y, 0, y + barHeight);

        if (isListening) {
          gradient.addColorStop(0, '#ffe600');   // vibrant electric yellow
          gradient.addColorStop(0.5, '#facc15'); // yellow-400
          gradient.addColorStop(1, '#ca8a04');   // yellow-600 amber
        } else {
          if (isDarkMode) {
            gradient.addColorStop(0, 'rgba(250, 204, 21, 0.55)');
            gradient.addColorStop(1, 'rgba(39, 39, 42, 0.3)');
          } else {
            gradient.addColorStop(0, 'rgba(202, 138, 4, 0.65)');
            gradient.addColorStop(1, 'rgba(161, 98, 7, 0.25)');
          }
        }

        ctx.fillStyle = gradient;
        ctx.beginPath();
        const radius = Math.min(barWidth / 2, 3);
        ctx.roundRect(x, y, barWidth, barHeight, radius);
        ctx.fill();
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isListening, getFrequencyData, isDarkMode]);

  return (
    <div className="w-full h-28 md:h-36 relative flex items-center justify-center overflow-hidden px-4">
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
      />
    </div>
  );
}
