/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** 设备接口基础地址（必填，http(s):// 开头） */
  readonly VITE_API_BASE_URL: string;
  /** SSE 日志端点（可选；留空则由 BASE_URL + VITE_SSE_PATH_SUFFIX 派生） */
  readonly VITE_SSE_URL: string;
  /** 设备接口路径前缀 */
  readonly VITE_API_PREFIX: string;
  /** SSE 路径后缀（VITE_SSE_URL 为空时派生用） */
  readonly VITE_SSE_PATH_SUFFIX: string;
  /** 截图轮询间隔（毫秒） */
  readonly VITE_SCREENSHOT_INTERVAL: string;
  /** 默认运行模式 mock | real */
  readonly VITE_DEFAULT_MODE: string;
  /** 预留鉴权 Token（当前未启用） */
  readonly VITE_API_TOKEN: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}
