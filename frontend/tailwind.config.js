
export default {
  content: [
  './index.html',
  './src/**/*.{js,ts,jsx,tsx}'
],
  theme: {
    extend: {
      colors: {
        qore: {
          dark: '#1B4332',
          medium: '#2D6A4F',
          light: '#D8F3DC',
          highlight: '#B7E4C7',
          text: '#1A1A2E',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
