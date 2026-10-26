const defaultTheme = require('tailwindcss/defaultTheme')

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx,js,jsx}", "./components/**/*.{ts,tsx,js,jsx}", "./data/**/*.{ts}"],
  theme: {
    extend: {
      colors: {
        miraBlue: "#00289f",

        // Sistema de diseño del panel: misma paleta que el login de coordinadores (components/CoordinadorLogin.tsx).
        navy: '#0A2472',
        primary: '#1E56E8',
        'primary-hover': '#1847C9',
        'primary-light': '#4C7BF0',
        'primary-tint': '#EEF2FE',
        'sidebar-from': '#0A2472',
        'sidebar-to': '#132F94',
        'sidebar-ink': '#A9B6E0',
        'surface-muted': '#F8FAFE',
        ink: '#0A2472',
        'ink-muted': '#5C6784',
        'ink-faint': '#7A85A3',
        border: '#E4E9F5',
        'border-input': '#DDE3F3',
        canvas: '#F4F6FC',
        surface: '#FFFFFF',
        success: '#14915F',
        'success-tint': '#E5F6EE',
        danger: '#D9455F',
        'danger-tint': '#FCE9ED',
        warning: '#D9730D',
        'warning-tint': '#FFF2E3',
        violet: '#5B3FE4',
        'violet-tint': '#F0EDFD',
      },
      fontFamily: {
        // Las variables las define next/font (lib/fonts.ts); fuera del panel se usa el respaldo.
        sans: ['var(--font-jakarta, ui-sans-serif)', ...defaultTheme.fontFamily.sans],
        mono: ['var(--font-jetbrains, ui-monospace)', ...defaultTheme.fontFamily.mono],
      },
      borderRadius: {
        card: '16px',
        section: '20px',
        field: '12px',
      },
      boxShadow: {
        card: '0 1px 2px rgba(10,36,114,0.04), 0 6px 18px -12px rgba(10,36,114,0.10)',
        elevated: '0 18px 34px -14px rgba(0,40,159,0.28)',
        hero: '0 26px 50px -26px rgba(0,40,159,0.75)',
        pop: '0 12px 32px -8px rgba(16,19,26,0.18), 0 2px 6px rgba(16,19,26,0.06)',
        'card-hover': '0 8px 24px -12px rgba(0,40,159,0.18)',
      },
      animation: {
        shimmer: 'shimmer 2s linear infinite',
        riseIn: 'riseIn 240ms cubic-bezier(0.23,1,0.32,1) both',
        growBar: 'growBar 420ms cubic-bezier(0.23,1,0.32,1) both',
        slideIn: 'slideIn 220ms cubic-bezier(0.23,1,0.32,1) both',
        sheen: 'sheen 4.2s ease-in-out infinite',
      },
      keyframes: {
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        riseIn: {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        growBar: {
          from: { transform: 'scaleY(0.02)' },
          to: { transform: 'scaleY(1)' },
        },
        slideIn: {
          from: { opacity: '0', transform: 'translateX(16px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        sheen: {
          from: { transform: 'translateX(-120%) skewX(-18deg)' },
          to: { transform: 'translateX(320%) skewX(-18deg)' },
        },
      },
      transitionTimingFunction: {
        'ease-out-strong': 'cubic-bezier(0.23, 1, 0.32, 1)',
        'ease-in-out-strong': 'cubic-bezier(0.77, 0, 0.175, 1)',
        'panel': 'cubic-bezier(0.22, 1, 0.36, 1)',
      }
    },
  },
  plugins: [],
}
