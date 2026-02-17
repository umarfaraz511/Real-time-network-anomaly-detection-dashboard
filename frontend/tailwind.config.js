/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        mono:    ['"JetBrains Mono"', 'monospace'],
        display: ['"Orbitron"', 'sans-serif'],
        body:    ['"Rajdhani"', 'sans-serif'],
      },
      animation: {
        'pulse-red': 'pulseRed 1.5s ease-in-out infinite',
        'fadeIn':    'fadeIn 0.4s ease-out',
        'slideUp':   'slideUp 0.3s ease-out',
      },
      keyframes: {
        pulseRed: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(255, 59, 92, 0.4)' },
          '50%':      { boxShadow: '0 0 0 8px rgba(255, 59, 92, 0)' },
        },
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}