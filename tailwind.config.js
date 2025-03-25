/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './app/**/*.{js,ts,jsx,tsx}',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  safelist: [
    // Generate color combinations dynamically
    { pattern: /bg-(blue|green|red|purple|teal|amber|indigo|slate|gray|zinc|stone)-(400|500|600|700|800|900)/ },
    { pattern: /border-(blue|green|red|purple|teal|amber|indigo|slate|gray|zinc|stone)-(400|500|600|700|800|900)/ },
    { pattern: /text-(blue|green|red|purple|teal|amber|indigo|slate|gray|zinc|stone)-(400|500|600|700|800|900)/ },
    { pattern: /from-(blue|green|red|purple|teal|amber|indigo|slate|gray|zinc|stone)-(800|900)/ },
    { pattern: /to-(blue|green|red|purple|teal|amber|indigo|slate|gray|zinc|stone)-(800|900)/ },
  ],
  theme: {
    extend: {
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'pulse': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin': 'spin 1s linear infinite',
        'bounce': 'bounce 1s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
        spin: {
          'from': { transform: 'rotate(0deg)' },
          'to': { transform: 'rotate(360deg)' },
        },
        bounce: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
    },
  },
  plugins: [],
} 