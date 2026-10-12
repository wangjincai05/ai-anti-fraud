/* ============================================================
 * env.ts · 环境变量加载与启动校验
 *  从 Vite 构建期内联的 import.meta.env.VITE_* 读取请求层配置，
 *  统一为强类型 AppEnv；validateEnv() 在应用启动时校验必填项。
 *  优先级：localStorage 运行时覆盖 > 环境变量（构建期默认）。
 * ============================================================ */

export type Mode = 'mock' | 'real';

export interface AppEnv {
  /** 设备接口基础地址 */
  apiUrl: string;
  /** SSE 端点（已派生：VITE_SSE_URL 或 baseUrl + suffix） */
  sseUrl: string;
  /** 设备接口路径前缀 */
  apiPrefix: string;
  /** SSE 路径后缀 */
  sseSuffix: string;
  /** 截图轮询间隔（毫秒） */
  screenshotInterval: number;
  /** 默认运行模式 */
  defaultMode: Mode;
  /** 预留鉴权 Token（当前未启用） */
  apiToken: string;
}

function str(v: unknown, def = ''): string {
  return typeof v === 'string' && v.length > 0 ? v : def;
}

function normalizeMode(v: unknown): Mode {
  return v === 'real' ? 'real' : 'mock';
}

const rawApiUrl = str(import.meta.env.VITE_API_BASE_URL);
const rawSseUrl = str(import.meta.env.VITE_SSE_URL);
const sseSuffix = str(import.meta.env.VITE_SSE_PATH_SUFFIX, '/api/logs');

/** SSE 派生：显式 VITE_SSE_URL 优先，否则 baseUrl + suffix */
function deriveSse(baseUrl: string): string {
  if (rawSseUrl) return rawSseUrl;
  return baseUrl.replace(/\/+$/, '') + sseSuffix;
}

export const env: AppEnv = {
  apiUrl: rawApiUrl,
  sseUrl: deriveSse(rawApiUrl),
  apiPrefix: str(import.meta.env.VITE_API_PREFIX, '/api/v1/devices'),
  sseSuffix,
  screenshotInterval: 150,
  defaultMode: normalizeMode(import.meta.env.VITE_DEFAULT_MODE),
  apiToken: str(import.meta.env.VITE_API_TOKEN),
};

export interface ValidationResult {
  ok: boolean;
  errors: string[];
}

/**
 * 启动校验：缺失/非法必填项时返回 errors 列表。
 * 调用方（main.ts）负责 console.error 提示；不抛错以避免仪表盘整屏空白。
 */
export function validateEnv(): ValidationResult {
  const errors: string[] = [];

  if (!env.apiUrl) {
    errors.push('VITE_API_BASE_URL 未配置（设备接口基础地址，必填）');
  }

  if (!env.apiPrefix) {
    errors.push('VITE_API_PREFIX 未配置（设备接口路径前缀）');
  }
  if (!env.sseSuffix) {
    errors.push('VITE_SSE_PATH_SUFFIX 未配置（SSE 路径后缀）');
  }
  if (!(env.screenshotInterval > 0)) {
    errors.push(`VITE_SCREENSHOT_INTERVAL 必须为正整数，当前值：${env.screenshotInterval}`);
  }
  // VITE_SSE_URL / VITE_API_TOKEN 可选，不校验

  return { ok: errors.length === 0, errors };
}
