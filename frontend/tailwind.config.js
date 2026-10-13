/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        obsidian: {
          DEFAULT: '#111318',
          bg: '#111318',
          card: '#171A21',
          elevated: '#1D222B',
          hover: '#242A36',
          border: 'rgba(255, 255, 255, 0.08)',
          subtle: 'rgba(255, 255, 255, 0.04)',
        },
        amber: {
          DEFAULT: '#FFB454',
          hover: '#FFC477',
          active: '#E69A3A',
          muted: '#D4943E',
          light: 'rgba(255, 180, 84, 0.12)',
          subtle: 'rgba(255, 180, 84, 0.06)',
          border: 'rgba(255, 180, 84, 0.28)',
        },
        cream: {
          DEFAULT: '#F4F1EA',
          primary: '#F4F1EA',
          secondary: '#B0B6C2',
          muted: '#858D9B',
        },
        status: {
          success: '#A3E6B0',
          'success-bg': 'rgba(163, 230, 176, 0.12)',
          'success-border': 'rgba(163, 230, 176, 0.3)',
          warning: '#F2CC83',
          'warning-bg': 'rgba(242, 204, 131, 0.12)',
          'warning-border': 'rgba(242, 204, 131, 0.3)',
          error: '#FF8585',
          'error-bg': 'rgba(255, 133, 133, 0.12)',
          'error-border': 'rgba(255, 133, 133, 0.3)',
        },
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
      },
      boxShadow: {
        'glass-sm': '0 2px 8px 0 rgba(0, 0, 0, 0.35)',
        'glass-md': '0 8px 24px -4px rgba(0, 0, 0, 0.45)',
        'glass-lg': '0 16px 40px -8px rgba(0, 0, 0, 0.55)',
        'glass-xl': '0 24px 60px -12px rgba(0, 0, 0, 0.65)',
        'amber-sm': '0 4px 14px 0 rgba(255, 180, 84, 0.22)',
        'amber-md': '0 8px 25px -4px rgba(255, 180, 84, 0.32)',
      },
      backdropBlur: {
        xs: '2px',
        md: '12px',
        lg: '18px',
        xl: '28px',
      },
      keyframes: {
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
        subtlePulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
      },
      animation: {
        shimmer: 'shimmer 2s infinite',
        'subtle-pulse': 'subtlePulse 3s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
