/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        slate: {
          950: '#070b14',
          900: '#0f172a',
          850: '#131d33',
          800: '#1e293b',
          700: '#334155',
        },
        violet: {
          500: '#8b5cf6',
          600: '#7c3aed',
          400: '#a78bfa',
        },
        cyan: {
          400: '#22d3ee',
          500: '#06b6d4',
          600: '#0891b2',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['Fira Code', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
};
