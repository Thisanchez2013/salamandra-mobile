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
          // Cor principal da identidade visual
          gold: '#D4AF37',

          // Fundos
          background: '#121212',
          navigation: '#181818',
          card: '#1A1A1A',
          surface: '#242424',
          surfaceLight: '#272727',

          // Bordas
          border: '#303030',
          borderSoft: '#292929',

          // Textos
          text: '#FFFFFF',
          textSecondary: '#E8E8E8',
          textSoft: '#D6D6D6',
          muted: '#999999',
          subtle: '#777777',
          disabled: '#707070',
        },
      },
    },
  },

  colors: {
    salamandra: {
      gold: '#D4AF37',

      background: '#121212',
      navigation: '#181818',
      card: '#1A1A1A',
      surface: '#242424',
      surfaceLight: '#272727',

      border: '#303030',
      borderSoft: '#292929',

      text: '#FFFFFF',
      textSecondary: '#E8E8E8',
      textSoft: '#D6D6D6',
      muted: '#999999',
      brandSubtitle: '#AFAFAF',
      subtle: '#777777',
      disabled: '#707070',
      footer: '#666666',

      error: '#E57373',
      errorBorder: '#C94C4C',
    },
  },

  plugins: [],
};

