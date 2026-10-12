/* ============================================================
 * config.ts · 运行配置（模拟 / 真实接口开关，localStorage 持久化）
 *  默认值来自环境变量（src/env.ts），localStorage 运行时覆盖优先。
 *   - mode/baseUrl/sseUrl 用 Vue ref 包装（响应式）
 *   - screenshotInterval 来自 VITE_SCREENSHOT_INTERVAL
 *   - save() 写 localStorage
 *   - 事件总线 bus（on/emit/off）TS 类型化
 *
 * 真实接口对接约定（源自 02-中区/CatDevicePlatform接口文档.md）：
 *   GET  {baseUrl}{apiPrefix}                       设备列表
 *   GET  {baseUrl}{apiPrefix}/{id}/screenshot?t=    实时截图 PNG
 *   GET  {baseUrl}{apiPrefix}/{id}/ui_tree          UI 控件树
 *   SSE  {sseUrl}                                   text/event-stream 日志长连接
 * ============================================================ */
import { ref, type Ref } from 'vue';
import { env, type Mode } from '@/env';

export type { Mode };

const LS_MODE = 'af-screen-mode';
const LS_BASE = 'af-screen-base-url';
const LS_SSE = 'af-screen-sse-url';

export interface AppConfig {
  mode: Ref<Mode>;
  baseUrl: Ref<string>;
  sseUrl: Ref<string>;
  screenshotInterval: number;
  save(): void;
}

function readMode(): Mode {
  const saved = localStorage.getItem(LS_MODE);
  if (saved === 'real' || saved === 'mock') return saved;
  return env.defaultMode;
}

export const config: AppConfig = {
  mode: ref(readMode()),
  baseUrl: ref(
    (localStorage.getItem(LS_BASE) || env.apiUrl).replace(/\/+$/, ''),
  ),
  sseUrl: ref(
    localStorage.getItem(LS_SSE) || env.sseUrl,
  ),
  screenshotInterval: 150,
  save() {
    localStorage.setItem(LS_MODE, config.mode.value);
    localStorage.setItem(LS_BASE, config.baseUrl.value);
    localStorage.setItem(LS_SSE, config.sseUrl.value);
  },
};

/* —— 极简事件总线：streams / panels / app 解耦 —— */
type BusHandler = (payload: unknown) => void;

export interface Bus {
  on(evt: string, fn: BusHandler): void;
  emit(evt: string, payload?: unknown): void;
  off(evt: string, fn?: BusHandler): void;
}

const busHandlers: Record<string, BusHandler[]> = {};

export const bus: Bus = {
  on(evt, fn) {
    (busHandlers[evt] = busHandlers[evt] || []).push(fn);
  },
  emit(evt, payload) {
    (busHandlers[evt] || []).forEach((fn) => {
      try {
        fn(payload);
      } catch (e) {
        console.error(e);
      }
    });
  },
  off(evt, fn) {
    if (!fn) {
      delete busHandlers[evt];
      return;
    }
    busHandlers[evt] = (busHandlers[evt] || []).filter((f) => f !== fn);
  },
};
