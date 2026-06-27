/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        fern: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
          950: '#052e16'
        },
        bark: {
          50: '#faf6f0',
          100: '#f2e9d9',
          200: '#e5d1b0',
          300: '#d4b37e',
          400: '#c49756',
          500: '#b8803b',
          600: '#9e6730',
          700: '#834f2a',
          800: '#6b4127',
          900: '#583723',
          950: '#301c11'
        }
      },
      fontFamily: {
        sans: ['"Noto Sans SC"', 'system-ui', '-apple-system', 'sans-serif']
      }
    }
  },
  plugins: []
};
