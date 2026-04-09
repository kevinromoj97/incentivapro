import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './features/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: '',
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: { '2xl': '1400px' },
    },
    extend: {
      colors: {
        // BBVA México Design System
        primary: {
          DEFAULT: '#004481',
          dark: '#002F5F',
          light: '#1973B8',
          foreground: '#FFFFFF',
        },
        accent: {
          DEFAULT: '#5AC4BE',
          foreground: '#002F5F',
        },
        background: '#F5F7FA',
        surface: '#FFFFFF',
        'text-primary': '#1A1A2E',
        'text-secondary': '#6B7280',
        success: { DEFAULT: '#10B981', light: '#D1FAE5' },
        warning: { DEFAULT: '#F59E0B', light: '#FEF3C7' },
        danger:  { DEFAULT: '#EF4444', light: '#FEE2E2' },
        border: '#E5E7EB',
        muted: { DEFAULT: '#F3F4F6', foreground: '#6B7280' },
        // shadcn compatibility
        card: { DEFAULT: '#FFFFFF', foreground: '#1A1A2E' },
        popover: { DEFAULT: '#FFFFFF', foreground: '#1A1A2E' },
        secondary: { DEFAULT: '#F3F4F6', foreground: '#1A1A2E' },
        destructive: { DEFAULT: '#EF4444', foreground: '#FFFFFF' },
        input: '#E5E7EB',
        ring: '#004481',
      },
      borderRadius: {
        lg: '0.625rem',
        md: '0.5rem',
        sm: '0.375rem',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 3px 0 rgba(0,0,0,.07), 0 1px 2px -1px rgba(0,0,0,.07)',
        'card-hover': '0 4px 12px 0 rgba(0,0,0,.10)',
        modal: '0 20px 60px -10px rgba(0,0,0,.18)',
      },
      keyframes: {
        'accordion-down': { from: { height: '0' }, to: { height: 'var(--radix-accordion-content-height)' } },
        'accordion-up': { from: { height: 'var(--radix-accordion-content-height)' }, to: { height: '0' } },
        'fade-in': { from: { opacity: '0', transform: 'translateY(8px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'fade-in': 'fade-in 0.4s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}

export default config
