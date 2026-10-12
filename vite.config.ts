import { fileURLToPath, URL } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'

// 禁用 Node 进程级代理变量，避免 dev server proxy 转发时走系统代理
// （如 Clash 127.0.0.1:7897 未启动时会导致 ECONNREFUSED）
delete process.env.HTTP_PROXY;
delete process.env.HTTPS_PROXY;
delete process.env.ALL_PROXY;

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // 读取环境变量（含非 VITE_ 前缀，用于 dev server 端口 PORT）
  const env = loadEnv(mode, process.cwd(), '')

  return {
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
      port: Number(env.PORT) || 5173,
      proxy: {
        '/catdevice': {
          target: 'http://192.168.0.103:8080',
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/catdevice/, ''),
        },
      },
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
  }
})
