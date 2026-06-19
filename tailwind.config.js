/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: '#7C3AED',
        'primary-light': '#A78BFA',
        'primary-bg': '#EDE9FE',
        accent: '#EC4899',
        'accent-dark': '#DB2777',
        emergency: '#DC2626',
        surface: '#FFFFFF',
        muted: '#F5F3FF',
        'text-main': '#1F1F2E',
        'text-sub': '#6B7280',
      },
    },
  },
  plugins: [],
};
