/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        echo: {
          bg: '#0B0E14',
          surface: '#111827',
          elevated: '#1A2332',
          border: '#1E293B',
          text: '#E2E8F0',
          muted: '#94A3B8',
          accent: '#38BDF8',
          accentHover: '#0EA5E9',
          success: '#22C55E',
          warning: '#F59E0B',
          danger: '#EF4444',
          info: '#6366F1',
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'],
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
