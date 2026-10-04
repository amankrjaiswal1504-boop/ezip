/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        steel: {
          950: '#1C1F22',
          900: '#23262B',
          700: '#3D434A',
          500: '#5C6670',
          300: '#9AA3AB',
          100: '#E4E1D8',
          50: '#F1EFE8',
        },
        rust: {
          700: '#8A3A21',
          600: '#A44A2A',
          500: '#BD5B35',
          100: '#F1DDCE',
        },
        patina: {
          700: '#37503D',
          600: '#4C6B54',
          500: '#5E7F66',
          100: '#DCE6DE',
        },
      },
      keyframes: {
        'widget-in': {
          '0%': { opacity: '0', transform: 'translateY(12px) scale(0.9)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        'chat-in': {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'widget-in': 'widget-in 300ms ease-out both',
        'chat-in': 'chat-in 200ms ease-out both',
      },
      fontFamily: {
        head: ['"Space Grotesk"', 'sans-serif'],
        body: ['"Inter"', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
