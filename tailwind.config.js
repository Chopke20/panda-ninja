/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: '#F3F1EC',
        ink: '#2A2926',
        muted: '#6B6860',
        dojo: '#2C3A4A',
        belt: '#C44536',
        gold: '#E0B84D',
        check: '#3F8F62',
        timeline: {
          green: '#3F8F62',
          amber: '#D4A017',
          red: '#C45C4A',
        },
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      minHeight: {
        tile: '72px',
      },
    },
  },
  plugins: [],
};
