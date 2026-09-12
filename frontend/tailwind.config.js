export default {
  content: [
  './index.html',
  './src/**/*.{js,ts,jsx,tsx}'
],
  theme: {
    extend: {
      colors: {
        canvas: '#F5F5F3',
        surface: '#FFFFFF',
        subtle: '#FAFAF9',
        line: '#E5E5E1',
        'line-strong': '#D3D3CD',
        ink: {
          DEFAULT: '#17171A',
          soft: '#3F3F45',
          muted: '#6B6B72',
          faint: '#9C9CA3',
        },
        accent: {
          DEFAULT: '#1D5B4F',
          hover: '#164A40',
          soft: '#E8F0ED',
        },
        status: {
          draft: '#71717A',
          submitted: '#1D4ED8',
          correction: '#B45309',
          approved: '#15803D',
          none: '#A1A1AA',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1rem' }],
      },
      boxShadow: {
        card: '0 1px 2px rgba(16,16,20,0.05)',
        pop: '0 16px 40px -12px rgba(16,16,20,0.22)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 220ms cubic-bezier(0.23, 1, 0.32, 1) both',
      },
    },
  },
  plugins: [],
}
