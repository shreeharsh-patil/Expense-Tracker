/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./frontend/templates/**/*.html",
    "./frontend/static/**/*.js"
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#4f46e5', // Modern Indigo
          dim: '#3730a3',
          light: '#6366f1',
        },
        ink: '#0f172a', // Slate-900
        body: '#334155', // Slate-700
        muted: '#64748b', // Slate-500
        hairline: '#e2e8f0', // Slate-200
        'border-strong': '#cbd5e1', // Slate-300
        canvas: '#f8fafc', // Slate-50
        'surface-soft': '#ffffff',
        'surface-strong': '#f1f5f9',
        'surface-dark': '#181d26',
        'surface-dark-elevated': '#1d1f25',
        'signature-coral': '#aa2d00',
        'signature-forest': '#0a2e0e',
        'signature-cream': '#f5e9d4',
        'signature-peach': '#fcab79',
        'signature-mint': '#a8d8c4',
        'signature-yellow': '#f4d35e',
        'signature-mustard': '#d9a441',
        'link-blue': '#6366f1', // Indigo-500
        'link-blue-active': '#4f46e5',
        accent: {
          yellow: '#fbbf24',
          red: '#ef4444',
          green: '#10b981',
          orange: '#f97316',
          blue: '#3b82f6',
        },
        dark: {
          bg: '#030712', // Dark obsidian
          card: '#0b0f19', // Glass-like card
          elevated: '#111827',
          border: '#1f2937',
          text: '#f9fafb',
          mute: '#9ca3af',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['Fragment Mono', 'monospace'],
      },
      borderRadius: {
        'card': '16px',
        'btn': '12px',
        'pill': '9999px',
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        'section': '96px',
      },
      boxShadow: {
        'premium': '0 10px 30px -10px rgba(79, 70, 229, 0.1)',
        'premium-dark': '0 10px 30px -10px rgba(0, 0, 0, 0.5)',
      }
    }
  },
  plugins: [
    require('@tailwindcss/forms')
  ],
}
