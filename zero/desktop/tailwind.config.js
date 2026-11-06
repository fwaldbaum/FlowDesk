/** @type {import('tailwindcss').Config} */
export default {
  content: ['./renderer/index.html', './renderer/src/**/*.{js,jsx}'],
  darkMode: 'media',
  theme: {
    extend: {
      colors: {
        blue: { DEFAULT: '#2563EB', soft: '#EAF1FF', deep: '#1D4ED8' },
        ink: 'rgb(var(--ink) / <alpha-value>)',
        sub: 'rgb(var(--sub) / <alpha-value>)',
        mute: 'rgb(var(--mute) / <alpha-value>)',
        line: 'rgb(var(--line) / <alpha-value>)',
        canvas: 'rgb(var(--canvas) / <alpha-value>)',
        card: 'rgb(var(--card) / <alpha-value>)',
        raised: 'rgb(var(--raised) / <alpha-value>)',
      },
      fontFamily: {
        display: ['"Geist Variable"', '"Inter Variable"', 'system-ui', 'sans-serif'],
        sans: ['"Inter Variable"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(11,27,63,.04), 0 12px 32px -18px rgba(11,27,63,.25)',
        lift: '0 24px 60px -28px rgba(37,99,235,.45)',
      },
    },
  },
  plugins: [],
};
