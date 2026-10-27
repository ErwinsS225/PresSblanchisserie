import daisyui from 'daisyui';

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'] },
      colors: { ink: '#182230', canvas: '#f6f8fb' },
      boxShadow: { soft: '0 10px 30px rgba(24,34,48,.06)' },
      keyframes: {
        pop: { '0%': { transform: 'scale(.72)', opacity: '0' }, '70%': { transform: 'scale(1.13)', opacity: '1' }, '100%': { transform: 'scale(1)', opacity: '1' } },
        'slide-in': { '0%': { transform: 'translateY(8px)', opacity: '0' }, '100%': { transform: 'translateY(0)', opacity: '1' } }
      },
      animation: { pop: 'pop .25s cubic-bezier(.2,.8,.2,1)', 'slide-in': 'slide-in .22s ease-out' }
    }
  },
  daisyui: { themes: ['light'], logs: false },
  plugins: [daisyui]
};
