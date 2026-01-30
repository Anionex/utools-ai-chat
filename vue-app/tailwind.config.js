/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // 自定义深色主题颜色
        dark: {
          50: '#f8f9fa',
          100: '#f1f1f1',
          200: '#e0e0e0',
          300: '#aaa',
          400: '#999',
          500: '#666',
          600: '#555',
          700: '#4d4d4d',
          800: '#3d3d3d',
          900: '#2d2d2d',
          950: '#1e1e1e'
        },
        // 主题色
        primary: {
          DEFAULT: '#666',
          hover: '#888',
          light: '#999'
        },
        success: '#4caf50',
        error: '#f44336',
        warning: '#ff9800'
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif']
      },
      animation: {
        'pulse-slow': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 1s linear infinite'
      }
    },
  },
  plugins: [],
}


