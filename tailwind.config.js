/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'brand-bg': '#0A0F1E',
        'brand-surface': '#111827',
        'brand-primary': '#4F8EF7',
        'brand-secondary': '#A78BFA',
        'brand-success': '#10B981',
        'brand-warning': '#F59E0B',
        'brand-error': '#EF4444',
        'brand-text-primary': '#F9FAFB',
        'brand-text-secondary': '#9CA3AF',
      },
      fontFamily: {
        syne: ['Syne', 'sans-serif'],
        inter: ['Inter', 'sans-serif'],
      },
      backgroundImage: {
        'primary-gradient': 'linear-gradient(135deg, #4F8EF7 0%, #A78BFA 100%)',
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.4)',
      },
    },
  },
  plugins: [],
}
