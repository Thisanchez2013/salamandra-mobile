/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
  ],

  presets: [require('nativewind/preset')],

  theme: {
    extend: {
      colors: {
        salamandra: {
          gold: '#D4AF37',
          background: '#121212',
          card: '#1C1C1C',
          border: '#333333',
          text: '#FFFFFF',
          muted: '#999999',
        },
      },
    },
  },

  plugins: [],
};