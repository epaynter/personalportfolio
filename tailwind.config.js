/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class', // Enable dark mode with class strategy
  theme: {
    extend: {
      colors: {
        background: '#ffffff',
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        gray: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)'],
      },
      fontSize: {
        'heading-1': ['3.5rem', { lineHeight: '1.2', letterSpacing: '-0.02em' }],
        'heading-2': ['2.25rem', { lineHeight: '1.3', letterSpacing: '-0.01em' }],
        'heading-3': ['1.875rem', { lineHeight: '1.4', letterSpacing: '-0.01em' }],
        'body': ['1.125rem', { lineHeight: '1.6' }],
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        'medium': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'glow': '0 0 15px 5px rgba(59, 130, 246, 0.5)',
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
      },
      keyframes: {
        blink: {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0 },
        },
        waveform: {
          '0%': { transform: 'scaleY(0.4)' },
          '50%': { transform: 'scaleY(1.1)' },
          '75%': { transform: 'scaleY(0.7)' },
          '100%': { transform: 'scaleY(0.4)' },
        },
        glow: {
          '0%': { opacity: 0.3, filter: 'blur(5px)' },
          '50%': { opacity: 0.7, filter: 'blur(8px)' },
          '100%': { opacity: 0.3, filter: 'blur(5px)' },
        },
        pulse: {
          '0%': { transform: 'scale(1)', opacity: 0.5 },
          '50%': { transform: 'scale(1.2)', opacity: 0.2 },
          '100%': { transform: 'scale(1)', opacity: 0.5 },
        }
      },
      animation: {
        blink: 'blink 1s step-end infinite',
        waveform: 'waveform 2s cubic-bezier(0.4, 0, 0.2, 1) infinite',
        glow: 'glow 3s ease-in-out infinite',
        pulse: 'pulse 2s ease-in-out infinite',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}