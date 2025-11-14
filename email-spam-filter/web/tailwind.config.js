/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class', // 👈 enables toggling via 'dark' class
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef2ff',
          100: '#e0e7ff',
          500: '#6366f1', // indigo tone
          700: '#4338ca',
        },
      },
    },
  },
  plugins: [],
};
