/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        navy: '#050c1a',
        cyan: {
          DEFAULT: '#00e5ff',
          dim: 'rgba(0,229,255,0.15)',
          border: 'rgba(0,229,255,0.3)',
        },
        surface: '#0a1628',
        'surface-2': '#0f1f38',
        'muted-text': '#7a9bbf',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
