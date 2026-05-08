/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        entain: {
          dark: '#1a1a2e',
          navy: '#16213e',
          blue: '#0f3460',
          accent: '#00d4aa',
          gold: '#ffd700',
          green: '#00c853',
          red: '#ff5252',
        }
      }
    }
  },
  plugins: []
};
