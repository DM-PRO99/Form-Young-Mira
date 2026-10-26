const defaultTheme = require('tailwindcss/defaultTheme')

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx,js,jsx}", "./components/**/*.{ts,tsx,js,jsx}", "./data/**/*.{ts}"],
  theme: {
    extend: {
      colors: {
        miraBlue: "#00289f",

        // Sistema de diseño del panel administrativo
        primary: '#00289F',
        'primary-hover': '#001B6B',
        'primary-light': '#1140C7',
        'primary-tint': '#EAF0FF',
        'sidebar-from': '#00318C',
        'sidebar-to': '#001348',
        'sidebar-ink': '#A6B0D0',
        'surface-muted': '#FAFBFC',
        ink: '#10131A',
        'ink-muted': '#6B7280',
        'ink-faint': '#8A91A0',
        border: '#E7E9EE',
        'border-input': '#E1E4EB',
        canvas: '#F7F8FA',
        surface: '#FFFFFF',
        success: '#0F7B57',
        'success-tint': '#E6F6EF',
        danger: '#9B2C48',
        'danger-tint': '#FDF2F5',
        warning: '#8A5E12',
        'warning-tint': '#FFF4E0',
        violet: '#5B3E9E',
        'violet-tint': '#F4EFFB',
      },
      fontFamily: {
        // Las variables las define next/font en app/admin/layout.tsx; fuera del panel se usa el respaldo.
        sans: ['var(--font-instrument, ui-sans-serif)', ...defaultTheme.fontFamily.sans],
        mono: ['var(--font-jetbrains, ui-monospace)', ...defaultTheme.fontFamily.mono],
      },
      borderRadius: {
        card: '14px',
        section: '18px',
        field: '10px',
      },
      boxShadow: {
        card: '0 1px 2px rgba(16,19,26,0.04)',
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
