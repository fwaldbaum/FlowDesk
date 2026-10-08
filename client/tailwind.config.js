/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: '#0B0F17',
        surface: '#161B26',
        raised: '#1C2230',
        line: '#262D3D',
        'line-strong': '#343C50',
        fg: '#F3F4F6',
        muted: '#9AA3B2',
        subtle: '#687185',
        accent: { DEFAULT: '#4F46E5', hover: '#4338CA', soft: '#818CF8' },
        info: '#3B82F6',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      fontSize: { '2xs': ['11px', '16px'] },
      keyframes: {
        'slide-in': { from: { transform: 'translateX(24px)', opacity: '0' }, to: { transform: 'none', opacity: '1' } },
      },
      animation: { 'slide-in': 'slide-in 160ms cubic-bezier(0.2, 0.8, 0.2, 1)' },
      boxShadow: {
        overlay: '0 12px 32px -8px rgb(0 0 0 / 0.6), 0 0 0 1px rgb(52 60 80 / 0.8)',
      },
    },
  },
  plugins: [],
};
