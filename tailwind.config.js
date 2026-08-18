/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        accent: {
          DEFAULT: '#ffe600',
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#facc15',
          500: '#ffe600',
          600: '#ca8a04',
          700: '#a16207',
          800: '#854d0e',
          900: '#713f12',
          950: '#422006',
        },
        obsidian: {
          DEFAULT: '#050505',
          50: '#18181b',
          100: '#121215',
          200: '#0f0f12',
          300: '#09090b',
          400: '#050505',
          500: '#000000',
        }
      },
      fontFamily: {
        heading: ['"Bricolage Grotesque"', 'sans-serif'],
        sans: ['"Elms Sans"', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'Menlo', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'ripple': 'ripple 2s cubic-bezier(0, 0.2, 0.8, 1) infinite',
        'wave-glow': 'wave-glow 2.5s ease-in-out infinite',
      },
      keyframes: {
        ripple: {
          '0%': { transform: 'scale(0.8)', opacity: '0.8' },
          '100%': { transform: 'scale(2.2)', opacity: '0' },
        },
        'wave-glow': {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '0.9' },
        }
      },
      boxShadow: {
        'glass-dark': '0 25px 60px rgba(0, 0, 0, 0.8)',
        'glow-yellow': '0 0 40px rgba(255, 230, 0, 0.35)',
        'glow-mic': '0 0 35px rgba(255, 230, 0, 0.5)',
        'glow-card': '0 0 50px rgba(250, 204, 21, 0.1)',
      }
    },
  },
  plugins: [],
}
