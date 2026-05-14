/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        entain: {
          dark: '#1a1a2e',
          navy: '#351a52',
          blue: '#6b21a8',
          accent: '#b829e3',
          gold: '#ffd700',
          green: '#00c853',
          red: '#ff5252',
          purple: '#b829e3',
        }
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translate(-50%, 20px)' },
          '100%': { opacity: '1', transform: 'translate(-50%, 0)' },
        },
      },
    }
  },
  plugins: []
};
