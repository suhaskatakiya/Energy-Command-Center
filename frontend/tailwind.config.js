/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          darkest: '#090d16',
          dark: '#0f172a',
          card: '#1e293b',
          border: '#334155',
          glow: '#38bdf8',
        },
        risk: {
          low: '#10b981',      // Emerald Green
          medium: '#f59e0b',   // Amber Yellow
          high: '#f97316',     // Orange
          critical: '#ef4444', // Red
          optimal: '#06b6d4',  // Cyan/Optimized
        }
      },
      boxShadow: {
        'glow-sky': '0 0 15px rgba(56, 189, 248, 0.25)',
        'glow-green': '0 0 15px rgba(16, 185, 129, 0.25)',
        'glow-red': '0 0 15px rgba(239, 68, 68, 0.25)',
        'glow-orange': '0 0 15px rgba(249, 115, 22, 0.25)',
        'glow-amber': '0 0 15px rgba(245, 158, 11, 0.25)',
      }
    },
  },
  plugins: [],
}
