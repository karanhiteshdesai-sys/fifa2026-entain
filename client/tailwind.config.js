/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        entain: {
          dark: '#1a1a2e',
          navy: '#2a1545',
          blue: '#6b21a8',
          accent: '#b829e3',
          gold: '#ffd700',
          green: '#00c853',
          red: '#ff5252',
          purple: '#b829e3',
        }
      }
    }
  },
  plugins: []
};
