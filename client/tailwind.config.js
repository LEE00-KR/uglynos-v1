/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fef7e7',
          100: '#fdecc3',
          200: '#fbd98b',
          300: '#f8c14f',
          400: '#f5a623',
          500: '#e88b0c',
          600: '#cc6708',
          700: '#a8480b',
          800: '#893910',
          900: '#712f11',
        },
        game: {
          earth: '#8B4513',
          wind: '#228B22',
          fire: '#DC143C',
          water: '#1E90FF',
        },
      },
      fontFamily: {
        game: ['DungGeunMo', 'monospace'],
      },
    },
  },
  plugins: [],
};
