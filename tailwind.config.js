/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/renderer/src/**/*.{js,ts,jsx,tsx}'],
  safelist: ['grid-cols-2', 'grid-cols-3', 'grid-cols-4', 'grid-cols-5'],
  theme: {
    extend: {},
  },
  plugins: [],
}
