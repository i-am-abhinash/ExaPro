/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        midnight: {
          DEFAULT: '#090D16',
          bg: '#090D16',
          secondary: '#0E1422',
          nav: 'rgba(15, 21, 35, 0.78)',
          primary: 'rgba(28, 38, 60, 0.48)',
          elevated: 'rgba(39, 51, 78, 0.58)',
          interactive: 'rgba(75, 94, 143, 0.22)',
          border: 'rgba(255, 255, 255, 0.10)',
          subtle: 'rgba(255, 255, 255, 0.05)',
        },
        aurora: {
          DEFAULT: '#8295FF',
          hover: '#A1AFFF',
          active: '#687DF5',
          light: 'rgba(130, 149, 255, 0.15)',
          subtle: 'rgba(130, 149, 255, 0.08)',
          border: 'rgba(130, 149, 255, 0.35)',
        },
        // Semantic aliases matching prompt requirements
        graphite: {
          DEFAULT: '#090D16',
          bg: '#090D16',
          secondary: '#0E1422',
          elevated: 'rgba(39, 51, 78, 0.58)',
          card: 'rgba(28, 38, 60, 0.48)',
          hover: 'rgba(75, 94, 143, 0.28)',
          border: 'rgba(255, 255, 255, 0.10)',
          subtle: 'rgba(255, 255, 255, 0.05)',
        },
        electric: {
          DEFAULT: '#8295FF',
          hover: '#A1AFFF',
          active: '#687DF5',
          muted: '#8295FF',
          light: 'rgba(130, 149, 255, 0.15)',
          subtle: 'rgba(130, 149, 255, 0.08)',
          border: 'rgba(130, 149, 255, 0.35)',
          secondary: '#B4A0FF',
        },
        cool: {
          DEFAULT: '#E9EDFF',
          primary: '#E9EDFF',
          secondary: '#AAB5CD',
          muted: '#7886A3',
        },
        status: {
          success: '#83D9B0',
          'success-bg': 'rgba(131, 217, 176, 0.14)',
          'success-border': 'rgba(131, 217, 176, 0.35)',
          warning: '#F0C779',
          'warning-bg': 'rgba(240, 199, 121, 0.14)',
          'warning-border': 'rgba(240, 199, 121, 0.35)',
          error: '#FF8998',
          'error-bg': 'rgba(255, 137, 152, 0.14)',
          'error-border': 'rgba(255, 137, 152, 0.35)',
        },
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
      },
      boxShadow: {
        'glass-sm': '0 4px 16px -2px rgba(4, 7, 14, 0.40)',
        'glass-md': '0 10px 30px -4px rgba(4, 7, 14, 0.50)',
        'glass-lg': '0 18px 48px -6px rgba(4, 7, 14, 0.65)',
        'glass-xl': '0 24px 60px -10px rgba(4, 7, 14, 0.75)',
        'aurora-sm': '0 4px 16px 0 rgba(130, 149, 255, 0.28)',
        'aurora-md': '0 8px 30px -2px rgba(130, 149, 255, 0.40)',
        'electric-sm': '0 4px 16px 0 rgba(130, 149, 255, 0.28)',
        'electric-md': '0 8px 30px -2px rgba(130, 149, 255, 0.40)',
      },
      backdropBlur: {
        xs: '4px',
        sm: '8px',
        md: '16px',
        lg: '22px',
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
        slowAura: {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '50%': { transform: 'translate(20px, -20px) scale(1.05)' },
        },
      },
      animation: {
        shimmer: 'shimmer 2s infinite',
        'subtle-pulse': 'subtlePulse 3s ease-in-out infinite',
        'slow-aura': 'slowAura 22s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
