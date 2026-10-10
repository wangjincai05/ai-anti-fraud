/* ============================================================
 * stream.ts · 模拟实时源（无后端时驱动大屏）
 *  迁移自原型 mock/stream.js，全部 TS 类型化
 *   downloads : 左区 APK 下载事件发生器（含"同款不同渠道"与"新增App"两种事件）
 *   logs      : 中区 SSE 日志仿真器（按设备剧本循环，节奏随机）
 * 真实模式下这两个发生器不启动，由 api/devices.js、api/logs.js 接管同一回调面。
 * ============================================================ */
import type { DownloadEvent, LogEvent, SourceKind } from '@/types/data';
import { data } from '@/mock/data';
import { fmt } from '@/utils/format';

const reduceMotion =
  typeof window !== 'undefined' &&
  !!window.matchMedia &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- 工具 ---------- */
function rand(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function hex(n: number): string {
  let s = '';
  const c = '0123456789ABCDEF';
  for (let i = 0; i < n; i++) s += c[Math.floor(Math.random() * 16)];
  return s;
}

/* 仿源头 A 清单里的 6 位随机 App 名（AZFOUe 式） */
function randomAppName(): string {
  const c = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz';
  let s = '';
  for (let i = 0; i < 6; i++) s += c[Math.floor(Math.random() * c.length)];
  return s;
}

function randomPkg(): string {
  const tlds = ['com', 'net', 'cc', 'org', 'info', 'hkq', 'me', 'ugp', 'xvr', 'kul'];
  const seg = () => Math.random().toString(36).slice(2, 2 + Math.floor(rand(4, 9)));
  return pick(tlds) + '.' + seg() + '.' + seg() + seg();
}

let uidSeq = 0;

/* ---------- 左区：下载事件流 ---------- */
export interface DownloadsCb {
  onEvent: (ev: DownloadEvent) => void;
  onDistinct?: (ev: DownloadEvent) => void;
}

let downloadsTimer: ReturnType<typeof setInterval> | null = null;
let sinceNew = 0;

export const downloads = {
  start(cb: DownloadsCb): void {
    downloads.stop();
    const pool = data.APK_POOL;
    const tick = () => {
      sinceNew++;
      const isBrandNew = sinceNew >= 14; // 约每 14 个下载事件出 1 个"不同App"
      let ev: DownloadEvent;
      if (isBrandNew) {
        sinceNew = 0;
        const name = randomAppName();
        ev = {
          uid: ++uidSeq,
          app: name,
          pkg: randomPkg(),
          category: pick([
            '刷单返利类',
            '网络交友-约炮引流',
            '虚假服务',
            '冒充电商物流客服',
            '虚假网络投资理财',
          ]),
          source: 'B',
          md5: hex(32),
          sizeMB: +rand(3.5, 42).toFixed(1),
          time: fmt.hms(),
          isNew: true,
          variant: false,
        };
        cb.onDistinct && cb.onDistinct(ev);
      } else {
        const base = pick(pool);
        const variant = Math.random() < 0.62; // 多数为同款不同渠道（重签名新MD5）
        ev = {
          uid: ++uidSeq,
          app: base.app,
          pkg: base.pkg,
          category: base.category,
          source: (Math.random() < 0.3 ? 'A' : base.source) as SourceKind,
          md5: variant ? hex(32) : base.md5,
          sizeMB: variant
            ? +(base.sizeMB * (1 + rand(-0.025, 0.025))).toFixed(1)
            : base.sizeMB,
          time: fmt.hms(),
          isNew: false,
          variant: variant,
        };
      }
      cb.onEvent && cb.onEvent(ev);
    };
    /* 先补一批历史，随后持续产出 */
    for (let i = 0; i < 6; i++) tick();
    downloadsTimer = setInterval(tick, reduceMotion ? 2600 : 1100);
  },
  stop(): void {
    if (downloadsTimer) {
      clearInterval(downloadsTimer);
      downloadsTimer = null;
    }
  },
};

/* ---------- 中区：日志仿真（SSE 形态） ---------- */
export interface LogsCb {
  onLog: (ev: LogEvent) => void;
}

interface LogState {
  idx: number;
  nextAt: number;
}

let logsTimer: ReturnType<typeof setInterval> | null = null;
let logsState: Record<string, LogState> = {};

export const logs = {
  start(cb: LogsCb): void {
    logs.stop();
    const ids = data.DEVICES.map((d) => d.deviceId);
    ids.forEach((id, i) => {
      logsState[id] = { idx: 0, nextAt: Date.now() + 600 + i * 900 };
    });
    logsTimer = setInterval(() => {
      const now = Date.now();
      ids.forEach((id) => {
        const st = logsState[id];
        if (!st || now < st.nextAt) return;
        const dev = data.DEVICES.find((d) => d.deviceId === id);
        if (!dev) return;
        const script = data.SCRIPTS[id] || [];
        if (!script.length) return;
        const line = script[st.idx % script.length];
        cb.onLog && cb.onLog({
          time: fmt.hms(),
          deviceId: id,
          serial: dev.adbSerial,
          type: dev.type,
          app: dev.currentApp,
          level: line.t,
          msg: line.m,
        });
        st.idx++;
        /* 一轮结束：长停顿后重播（模拟新一轮对线） */
        if (st.idx % script.length === 0) st.nextAt = now + rand(9000, 16000);
        else st.nextAt = now + (reduceMotion ? 3600 : rand(1300, 3100));
      });
    }, reduceMotion ? 1500 : 650);
  },
  stop(): void {
    if (logsTimer) {
      clearInterval(logsTimer);
      logsTimer = null;
    }
  },
};

export const stream = { downloads, logs };
