/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ivory: {
          DEFAULT: '#F5F3EE',
          50: '#FAF9F6',
          100: '#F5F3EE',
          200: '#EAE7DF',
          300: '#DED9CE',
          400: '#CBC5B7',
        },
        graphite: {
          DEFAULT: '#20242D',
          950: '#14171E',
          900: '#20242D',
          800: '#2E333F',
          700: '#3F4554',
          600: '#535B6D',
        },
        slate: {
          muted: '#687080',
          light: '#8F97A5',
          border: 'rgba(32, 36, 45, 0.08)',
          subtle: 'rgba(32, 36, 45, 0.04)',
        },
        cobalt: {
          DEFAULT: '#315EFB',
          hover: '#224DE5',
          active: '#183DC9',
          light: '#EDF2FE',
          subtle: '#E2EBFE',
          border: 'rgba(49, 94, 251, 0.25)',
        },
        lime: {
          DEFAULT: '#B9E769',
          text: '#2D4E07',
          dark: '#3A5F0E',
          light: '#F4FCE9',
          border: 'rgba(185, 231, 105, 0.4)',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          glass: 'rgba(255, 255, 255, 0.75)',
          'glass-elevated': 'rgba(255, 255, 255, 0.90)',
          'glass-subtle': 'rgba(255, 255, 255, 0.50)',
        },
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        serif: ['Newsreader', 'Playfair Display', 'Georgia', 'serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
      },
      boxShadow: {
        'glass-sm': '0 2px 8px -2px rgba(32, 36, 45, 0.04), 0 1px 3px -1px rgba(32, 36, 45, 0.02)',
        'glass-md': '0 8px 24px -4px rgba(32, 36, 45, 0.06), 0 2px 6px -1px rgba(32, 36, 45, 0.03)',
        'glass-lg': '0 16px 40px -8px rgba(32, 36, 45, 0.08), 0 4px 12px -2px rgba(32, 36, 45, 0.03)',
        'glass-xl': '0 24px 60px -12px rgba(32, 36, 45, 0.12), 0 8px 24px -4px rgba(32, 36, 45, 0.05)',
        'cobalt-sm': '0 4px 14px 0 rgba(49, 94, 251, 0.22)',
        'cobalt-md': '0 8px 25px -4px rgba(49, 94, 251, 0.32)',
        'card-elevated': '0 20px 45px -10px rgba(32, 36, 45, 0.07), 0 1px 3px rgba(32, 36, 45, 0.04)',
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
          '50%': { opacity: '0.6' },
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
