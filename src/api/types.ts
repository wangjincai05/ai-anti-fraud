/* ============================================================
 * api/types.ts · API 层共享最小类型
 *   若 src/types/data.ts 已提供更完整定义，可改用其导出。
 * ============================================================ */

/**
 * 设备信息（对应 GET /api/v1/devices 返回项）
 * 字段命名与后端契约保持下划线风格。
 */
export interface Device {
  device_id: string;
  adb_serial?: string;
  device_type?: string;
  os_version?: string;
  model?: string;
  product?: string;
  battery_level?: number;
  is_online?: boolean;
  screen_width?: number;
  screen_height?: number;
  currentApp?: string;
  shots?: string[];
  /** 允许后端额外字段透传，避免未知字段阻断类型断言 */
  [key: string]: unknown;
}

/**
 * 实时日志事件（SSE onmessage 归一后下发）
 *  type  : 设备种类（emulator / real_device）
 *  level : 动作归一（enter / send / recv / shot / code / sys）
 */
export interface LogEvent {
  time: string;
  serial: string;
  type: string;
  level: string;
  msg: string;
}
