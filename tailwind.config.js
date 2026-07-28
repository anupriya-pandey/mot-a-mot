/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1E4ED8',
          hover: '#1A44C2',
          light: '#EEF2FF',
        },
        accent: {
          red: '#C0392B',
        },
        success: '#16A34A',
        warning: '#EA580C',
        error: '#DC2626',
        background: '#F8F9FA',
        surface: '#FFFFFF',
        'text-primary': '#111827',
        'text-secondary': '#6B7280',
        border: '#E5E7EB',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        button: '12px',
        card: '16px',
        input: '12px',
      },
      boxShadow: {
        card: '0 1px 3px 0 rgb(0 0 0 / 0.08), 0 1px 2px -1px rgb(0 0 0 / 0.08)',
      },
      maxWidth: {
        content: '720px',
      },
      spacing: {
        xs: '4px',
        s: '8px',
        m: '16px',
        l: '24px',
        xl: '32px',
        xxl: '48px',
      },
      transitionDuration: {
        interaction: '200ms',
      },
    },
  },
  plugins: [],
};
