/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: '#090A0F',
        surface: {
          DEFAULT: '#12141C',
          card: '#181B26',
          hover: '#1A1D28',
          subtle: '#0F1118'
        },
        border: {
          DEFAULT: '#232736',
          subtle: '#1C1F2B',
          glow: 'rgba(99, 102, 241, 0.25)'
        },
        primary: {
          DEFAULT: '#6366F1',
          hover: '#4F46E5',
          light: '#818CF8',
          glow: 'rgba(99, 102, 241, 0.35)'
        },
        secondary: {
          DEFAULT: '#38BDF8',
          hover: '#0EA5E9',
          glow: 'rgba(56, 189, 248, 0.3)'
        },
        success: {
          DEFAULT: '#10B981',
          hover: '#059669',
          subtle: 'rgba(16, 185, 129, 0.15)'
        },
        warning: {
          DEFAULT: '#F59E0B',
          hover: '#D97706',
          subtle: 'rgba(245, 158, 11, 0.15)'
        },
        error: {
          DEFAULT: '#F43F5E',
          hover: '#E11D48',
          subtle: 'rgba(244, 63, 94, 0.15)'
        },
        muted: {
          DEFAULT: '#64748B',
          light: '#94A3B8',
          dark: '#334155'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace', 'Consolas'],
      },
      boxShadow: {
        'glow-primary': '0 0 25px -5px rgba(99, 102, 241, 0.3)',
        'glow-sky': '0 0 25px -5px rgba(56, 189, 248, 0.3)',
        'card-dark': '0 4px 20px -2px rgba(0, 0, 0, 0.5)',
      }
    },
  },
  plugins: [],
}
