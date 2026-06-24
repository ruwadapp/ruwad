import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ruwad: {
          blue: '#3A4EFB',
          'blue-light': '#33A4FA',
          lime: '#E3FF3B',
          navy: '#252943',
          gray: '#DEE0ED',
        },
        primary: {
          DEFAULT: '#3A4EFB',
          light: '#33A4FA',
          foreground: '#FFFFFF',
        },
        accent: {
          DEFAULT: '#E3FF3B',
          foreground: '#252943',
        },
        dark: {
          DEFAULT: '#252943',
          foreground: '#FFFFFF',
        },
      },
      backgroundImage: {
        'ruwad-gradient': 'linear-gradient(135deg, #3A4EFB 0%, #33A4FA 100%)',
        'ruwad-dark': 'linear-gradient(180deg, #252943 0%, #1a1e33 100%)',
      },
      borderRadius: {
        ruwad: '20px',
        'ruwad-sm': '12px',
      },
      fontFamily: {
        arabic: ['Tajawal', 'Noto Sans Arabic', 'sans-serif'],
        latin: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        ruwad: '0 8px 32px rgba(58, 78, 251, 0.18)',
        'ruwad-lg': '0 16px 48px rgba(58, 78, 251, 0.24)',
        card: '0 2px 16px rgba(37, 41, 67, 0.08)',
      },
    },
  },
  plugins: [],
}

export default config
