/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: '#F2F1EB',
        paperHover: '#E5E4DE',
        ink: '#0D0D0D',
        safety: '#FF5722',
        soroban: '#00D1FF',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderWidth: {
        strict: '1.5px',
      },
    },
  },
  plugins: [],
}