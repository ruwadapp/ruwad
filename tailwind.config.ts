import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      // الألوان تُقرأ من متغيرات CSS (قيمها الافتراضية في globals.css = هوية رُوّاد)
      // صيغة قنوات RGB تُبقي مُعدِّلات الشفافية مثل bg-ruwad-blue/10 تعمل كما هي
      colors: {
        ruwad: {
          blue: 'rgb(var(--brand-primary) / <alpha-value>)',
          'blue-light': 'rgb(var(--brand-secondary) / <alpha-value>)',
          lime: 'rgb(var(--brand-accent) / <alpha-value>)',
          navy: 'rgb(var(--brand-navy) / <alpha-value>)',
          gray: 'rgb(var(--brand-gray) / <alpha-value>)',
        },
        primary: {
          DEFAULT: 'rgb(var(--brand-primary) / <alpha-value>)',
          light: 'rgb(var(--brand-secondary) / <alpha-value>)',
          foreground: '#FFFFFF',
        },
        accent: {
          DEFAULT: 'rgb(var(--brand-accent) / <alpha-value>)',
          foreground: 'rgb(var(--brand-navy) / <alpha-value>)',
        },
        dark: {
          DEFAULT: 'rgb(var(--brand-navy) / <alpha-value>)',
          foreground: '#FFFFFF',
        },
      },
      backgroundImage: {
        'ruwad-gradient': 'linear-gradient(135deg, rgb(var(--brand-primary)) 0%, rgb(var(--brand-secondary)) 100%)',
        'ruwad-dark': 'linear-gradient(180deg, rgb(var(--brand-navy)) 0%, #1a1e33 100%)',
      },
      borderRadius: {
        ruwad: '20px',
        'ruwad-sm': '12px',
      },
      fontFamily: {
        arabic: ['Alyamama', 'Noto Sans Arabic', 'sans-serif'],
        latin: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        ruwad: '0 8px 32px rgb(var(--brand-primary) / 0.18)',
        'ruwad-lg': '0 16px 48px rgb(var(--brand-primary) / 0.24)',
        card: '0 2px 16px rgb(var(--brand-navy) / 0.08)',
      },
    },
  },
  plugins: [],
}

export default config
