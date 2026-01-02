/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'bg-dark': '#0a0a0c',
        'accent-blue': '#00d2ff',
        'accent-teal': '#3aedc8',
        'glass-bg': 'rgba(255, 255, 255, 0.05)',
        'glass-border': 'rgba(255, 255, 255, 0.1)',
      },
      backgroundImage: {
        'body-gradient': 'radial-gradient(circle at top right, #1a1a2e, #0a0a0c)',
      },
    },
  },
  plugins: [],
}
