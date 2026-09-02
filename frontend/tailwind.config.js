/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT:  '#7F00B2',
          dark:     '#660099',
          light:    '#9C27FF',
          lighter:  '#C77DFF',
          subtle:   'rgba(159,39,255,0.12)',
        },
        cyan:  { brand: '#00D4FF' },
        blue:  { brand: '#0066FF', light: '#4D9DFF' },
        surface: {
          DEFAULT: '#121212',
          2:       '#1E1E1E',
          3:       '#2A2A2A',
        },
        status: {
          success: '#22C55E',
          warning: '#F59E0B',
          error:   '#EF4444',
          info:    '#3B82F6',
          muted:   '#6B7280',
        },
      },
      fontFamily: {
        sans: ['"Segoe UI"', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #660099 0%, #7F00B2 30%, #9C27FF 70%, #C77DFF 100%)',
      },
    },
  },
  plugins: [],
};
