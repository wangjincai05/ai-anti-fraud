import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        // SCSS 全局变量注入：每个 SCSS 文件自动引入设计变量
        additionalData: '@use "@/styles/_variables.scss" as *;',
      },
    },
  },
  server: {
    port: 5173,
  },
  build: {
    target: 'es2018',
    rollupOptions: {
      output: {
        // manualChunks 分包：将第三方库从业务代码中拆出，降低主 bundle 体积
        // 注：Vite 8/Rolldown 的 manualChunks 类型为函数形式（ManualChunksFunction）
        // echarts chunk：echarts 按需引入的 core/charts/components/renderers + 其 canvas 依赖 zrender
        // vendor chunk：vue 主包 + @vue/* 内部子包（runtime-dom/reactivity 等）
        manualChunks(id) {
          if (!id.includes('node_modules/')) return
          if (id.includes('/echarts/') || id.includes('/zrender/')) {
            return 'echarts'
          }
          if (id.includes('/vue/') || id.includes('/@vue/')) {
            return 'vendor'
          }
        },
      },
    },
  },
})
