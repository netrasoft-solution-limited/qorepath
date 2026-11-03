
export default {
  content: [
  './index.html',
  './src/**/*.{js,ts,jsx,tsx}'
],
  theme: {
    extend: {
      colors: {
        // NetraNova brand, sampled from the logo (navy wordmark, royal/sky blue "N").
        // Token names kept from the original theme so every existing class picks these up.
        qore: {
          dark: '#0A1F5C',
          medium: '#0B5CF0',
          light: '#E6F0FF',
          highlight: '#8CCBFF',
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
