/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        graphite: {
          DEFAULT: '#222831',
          bg: '#222831',
          secondary: '#272F39',
          elevated: '#303946',
          card: '#36414F',
          hover: '#3D4958',
          border: 'rgba(255, 255, 255, 0.10)',
          subtle: 'rgba(255, 255, 255, 0.05)',
        },
        electric: {
          DEFAULT: '#6C8CFF',
          hover: '#8AA2FF',
          active: '#5876E8',
          muted: '#7E9BF5',
          light: 'rgba(108, 140, 255, 0.14)',
          subtle: 'rgba(108, 140, 255, 0.08)',
          border: 'rgba(108, 140, 255, 0.35)',
          secondary: '#B4A0FF',
        },
        lavender: {
          DEFAULT: '#B4A0FF',
          light: 'rgba(180, 160, 255, 0.14)',
          border: 'rgba(180, 160, 255, 0.35)',
        },
        cool: {
          DEFAULT: '#F4F6FA',
          primary: '#F4F6FA',
          secondary: '#C0C8D4',
          muted: '#98A4B5',
        },
        status: {
          success: '#8BD7B0',
          'success-bg': 'rgba(139, 215, 176, 0.14)',
          'success-border': 'rgba(139, 215, 176, 0.35)',
          warning: '#F0C477',
          'warning-bg': 'rgba(240, 196, 119, 0.14)',
          'warning-border': 'rgba(240, 196, 119, 0.35)',
          error: '#F18A91',
          'error-bg': 'rgba(241, 138, 145, 0.14)',
          'error-border': 'rgba(241, 138, 145, 0.35)',
        },
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
      },
      boxShadow: {
        'glass-sm': '0 2px 8px 0 rgba(15, 20, 28, 0.35)',
        'glass-md': '0 8px 24px -4px rgba(15, 20, 28, 0.45)',
        'glass-lg': '0 16px 40px -8px rgba(12, 16, 23, 0.55)',
        'glass-xl': '0 24px 60px -12px rgba(10, 14, 20, 0.65)',
        'electric-sm': '0 4px 14px 0 rgba(108, 140, 255, 0.28)',
        'electric-md': '0 8px 28px -4px rgba(108, 140, 255, 0.42)',
        'card-elevated': '0 10px 30px -5px rgba(15, 20, 28, 0.45), 0 0 0 1px rgba(255, 255, 255, 0.08)',
        'card-strong': '0 16px 40px -8px rgba(12, 16, 23, 0.55), 0 0 0 1px rgba(255, 255, 255, 0.10)',
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
