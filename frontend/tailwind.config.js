/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        steel: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#090d16'
        },
        navy: {
          800: '#0f2438',
          900: '#0a192f',
          950: '#06101e'
        },
        brand: {
          blue: '#0284c7', // industrial cyan-blue for hydraulic fluidics
          navy: '#0f2942',
          amber: '#d97706',
          green: '#059669',
          red: '#dc2626'
        }
      },
      borderRadius: {
        'panel': '8px',
        'subtle': '6px'
      }
    },
  },
  plugins: [],
}
