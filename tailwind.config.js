/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#0B1020',
        surface: '#111A2E',
        surfaceElevated: '#16213A',
        primary: '#6D5EF8',
        secondary: '#2ED3B7',
        highlight: '#FFB020',
        textPrimary: '#EAF0FF',
        textMuted: '#A8B3CF',
        border: '#243252',
        success: '#3EE08F',
        warning: '#FFB020',
        error: '#FF4D6D',
        info: '#5BC0FF',
      },
    },
  },
  plugins: [],
}
