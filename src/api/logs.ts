/* ============================================================
 * logs.ts · 实时日志适配层（real 模式 SSE 封装）
 *   connectSse(sseUrl, onLog, onState?) → { close }
 *   使用浏览器原生 EventSource，连接中断自动重连。
 *   约定事件字段（待后端实时日志接口对齐）：
 *     { time, device_id|serial, type, content|msg }
 *   type 归一：enter / send / recv / shot / code / sys
 * ★ SSE 必须直连后端；经未开流式的反代会被整体缓冲（长时间无消息）。
 * ============================================================ */

import type { LogEvent } from './types';

/** 原始日志动作 → 归一类型映射（保留原型 TYPE_MAP） */
const TYPE_MAP: Record<string, string> = {
  '进入客服': 'enter', 'enter': 'enter', 'login': 'enter',
  '发送话术': 'send', 'send': 'send', 'sent': 'send',
  '收到回复': 'recv', 'recv': 'recv', 'reply': 'recv', 'receive': 'recv',
  '截图': 'shot', 'shot': 'shot', 'screenshot': 'shot',
  '取码结果': 'code', 'code': 'code', 'paycode': 'code',
  'sys': 'sys', 'system': 'sys', 'info': 'sys'
};

function normType(t: unknown): string {
  if (typeof t !== 'string') return 'sys';
  return TYPE_MAP[t] || TYPE_MAP[t.toLowerCase()] || 'sys';
}

/** 当前时间 HH:MM:SS（后端未带 time 时兜底） */
function hms(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return p(d.getHours()) + ':' + p(d.getMinutes()) + ':' + p(d.getSeconds());
}

/**
 * 连接实时日志 SSE 流。
 * @param sseUrl   SSE 端点直连地址
 * @param onLog    日志回调（归一后的 LogEvent）
 * @param onState  状态回调：'connected' | 'reconnecting' | 'closed'
 * @returns        关闭句柄，调用 close() 释放底层 EventSource
 */
export function connectSse(
  sseUrl: string,
  onLog: (ev: LogEvent) => void,
  onState?: (state: string) => void
): { close: () => void } {
  let es: EventSource | null = null;

  try {
    es = new EventSource(sseUrl);
  } catch (e) {
    // URL 非法等构造失败：通知关闭并返回空句柄，保持调用契约
    onState?.('closed');
    return { close: () => {} };
  }

  es.onopen = () => onState?.('connected');

  es.onerror = () => {
    // EventSource 会自动重连；若被反代缓冲，表象是长时间无消息而非 error
    onState?.('reconnecting');
  };

  es.onmessage = (ev: MessageEvent) => {
    let d: Record<string, unknown> = {};
    try {
      d = JSON.parse(ev.data) as Record<string, unknown>;
    } catch {
      d = { content: ev.data };
    }

    const rawId = d.device_id ?? d.serial ?? d.device ?? '—';
    const serial = typeof rawId === 'string' ? rawId : String(rawId);
    const type =
      serial.indexOf('127.0.0.1') === 0 ? 'emulator' : 'real_device';

    onLog({
      time: typeof d.time === 'string' ? d.time : hms(),
      serial,
      type,
      level: normType(d.type ?? d.event),
      msg: String(d.content ?? d.msg ?? d.text ?? ev.data)
    });
  };

  return {
    close: () => {
      if (es) {
        es.close();
        es = null;
      }
    }
  };
}
