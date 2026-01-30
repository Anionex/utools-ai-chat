import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  base: './', // 使用相对路径，适配 uTools 插件环境
  build: {
    outDir: '..', // 输出到项目根目录
    emptyOutDir: false, // 重要：不清空目录，避免删除源代码
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html')
      }
    },
    // 禁用代码分割，确保所有代码打包到一个文件
    cssCodeSplit: false,
    chunkSizeWarningLimit: 1000
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  }
})


