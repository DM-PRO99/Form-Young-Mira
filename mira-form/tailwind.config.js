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
      },
      fontFamily: {
        sans: ['Instrument Sans', ...defaultTheme.fontFamily.sans],
        mono: ['JetBrains Mono', ...defaultTheme.fontFamily.mono],
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
      },
      animation: {
        shimmer: 'shimmer 2s linear infinite',
        riseIn: 'riseIn 320ms cubic-bezier(0.22,1,0.36,1) both',
        growBar: 'growBar 620ms cubic-bezier(0.22,1,0.36,1) both',
        slideIn: 'slideIn 240ms cubic-bezier(0.22,1,0.36,1) both',
        sheen: 'sheen 4.2s ease-in-out infinite',
      },
      keyframes: {
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        riseIn: {
          from: { opacity: '0', transform: 'perspective(1400px) translateY(14px) rotateX(6deg) scale(.985)' },
          to: { opacity: '1', transform: 'perspective(1400px) translateY(0) rotateX(0) scale(1)' },
        },
        growBar: {
          from: { transform: 'perspective(900px) scaleY(.02) rotateX(28deg)' },
          to: { transform: 'perspective(900px) scaleY(1) rotateX(0)' },
        },
        slideIn: {
          from: { opacity: '0', transform: 'perspective(1600px) translateX(56px) rotateY(-14deg)' },
          to: { opacity: '1', transform: 'perspective(1600px) translateX(0) rotateY(0)' },
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
