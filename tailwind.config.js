/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: 'var(--color-paper)',
        ink: 'var(--color-ink)',
        muted: 'var(--color-muted)',
        panel: 'var(--color-panel)',
        tile: 'var(--color-tile)',
        dojo: 'var(--color-dojo)',
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
