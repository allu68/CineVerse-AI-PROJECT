/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fff0f9',
          100: '#ffddf5',
          200: '#ffbbeb',
          300: '#ff87da',
          400: '#ff44bf',
          500: '#ff10a0',
          600: '#f0007a',
          700: '#cc005e',
          800: '#a8004e',
          900: '#8c0044',
        },
        cinema: {
          dark: '#070711',
          darker: '#040408',
          card: '#0f0f1a',
          border: '#1e1e2e',
          surface: '#13131f',
          muted: '#2a2a3d',
        },
        accent: {
          gold: '#f5c518',
          purple: '#8b5cf6',
          cyan: '#06b6d4',
          rose: '#f43f5e',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'Inter', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'hero-gradient': 'linear-gradient(to right, rgba(7,7,17,0.95) 40%, rgba(7,7,17,0.4) 100%)',
        'card-gradient': 'linear-gradient(to top, rgba(7,7,17,1) 0%, rgba(7,7,17,0.7) 50%, transparent 100%)',
      },
      animation: {
        'shimmer': 'shimmer 1.8s infinite',
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.9)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 20px rgba(255,16,160,0.3)' },
          '100%': { boxShadow: '0 0 40px rgba(255,16,160,0.7)' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
};
