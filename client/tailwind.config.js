/** @type {import('tailwindcss').Config} */
import colors from 'tailwindcss/colors';

export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gray: {
          ...colors.neutral,
          700: '#222222',
          800: '#111111',
          900: '#000000',
          950: '#000000',
        },
      }
    },
  },
  plugins: [],
}

