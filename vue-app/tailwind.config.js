/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Obsidian Minimal 风格 - 温暖灰度
        dark: {
          50: '#fafafa',   // 主背景 - 温暖米白
          100: '#f5f5f5',  // 次级背景
          200: '#ebebeb',  // 边框/分隔线
          300: '#d4d4d4',  // 禁用态
          400: '#a3a3a3',  // 占位符文字
          500: '#737373',  // 次要文字
          600: '#525252',  // 正文文字
          700: '#404040',  // 标题文字
          800: '#262626',  // 强调文字
          900: '#1a1a1a',  // 侧边栏深色背景
          950: '#0a0a0a'   // 最深色
        },
        // 主题色 - 温暖的深褐/琥珀色调
        primary: {
          DEFAULT: '#78716c', // stone-500 温暖灰棕
          hover: '#57534e',   // stone-600
          light: '#a8a29e',   // stone-400
          50: '#fafaf9',
          100: '#f5f5f4'
        },
        // 强调色 - 柔和的琥珀/棕色
        accent: {
          DEFAULT: '#b45309', // amber-700
          light: '#d97706',   // amber-600
          muted: '#92400e'    // amber-800
        },
        success: '#65a30d',   // lime-600 更温暖的绿
        error: '#dc2626',     // red-600
        warning: '#ca8a04'    // yellow-600
      },
      fontFamily: {
        sans: ['Figtree', 'Source Sans 3', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        display: ['DM Sans', 'Figtree', 'sans-serif']
      },
      animation: {
        'pulse-slow': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 1s linear infinite'
      }
    },
  },
  plugins: [],
}


