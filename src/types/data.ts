/* ============================================================
 * data.ts · 反诈大屏数据类型定义
 *  对应原型 data.js 全部数据结构的强类型契约
 * ============================================================ */

/** 下载源标识：A=源头A SFTP，B=源头B HOST 爬取 */
export type SourceKind = 'A' | 'B';

/** 转款码 / 截图等带标签的图片资源 */
export interface NamedImage {
  src: string;
  label: string;
}

/** 右区 · 转款码记录（codes.jsonl 两种形态 + 台账.csv 归一化） */
export interface CodeRecord {
  recId?: string | null;
  taskId: string;
  app: string;
  pkg: string;
  md5: string;
  category: string;
  device?: string;
  counterparty?: string;
  payee: string;
  codeType: string;
  amount: string;
  channel?: string;
  url?: string;
  fingerprint?: string;
  flow?: string;
  finalReply?: string;
  time: string;
  codeImages?: NamedImage[];
  shots?: NamedImage[];
  batch?: string;
}

/** 中区 · 设备信息（字段对齐 GET /api/v1/devices） */
export interface Device {
  deviceId: string;
  adbSerial: string;
  type: string;
  osVersion: string;
  model: string;
  product: string;
  battery: number;
  screenW: number;
  screenH: number;
  currentApp: string;
  shots: string[];
}

/** 左区 · APK 池样本 */
export interface ApkPoolItem {
  app: string;
  pkg: string;
  md5: string;
  category: string;
  source: SourceKind;
  sizeMB: number;
}

/** v4 实测常量（证据等级：A=完整自然日逐行实测 B=分层抽样） */
export interface V4Stats {
  urlsPerDay: number;
  featuresPerDay: number;
  entriesPerDay: number;
  pagesPerDay: number;
  pagesRange: [number, number];
  distinctMainstream: number;
  todayDownloads: number;
}

/** 漏斗层级条目 */
export interface FunnelItem {
  name: string;
  value: number;
  grade: 'A' | 'B';
}

/** 近 24h 入库样本类别分布条目 */
export interface CategoryItem {
  name: string;
  value: number;
}

/** 收款渠道分布条目（用于环图） */
export interface ChannelItem {
  name: string;
  value: number;
  color: string;
}

/** 下载源下载量统计条目 */
export interface SourceStat {
  name: string;
  cumulative: number;
  today: number;
  color: string;
}

/** 二维码累计统计基线 */
export interface QrStats {
  cumTotalBase: number;
  cumDedupBase: number;
}

/** 中区日志剧本单行 */
export interface ScriptLine {
  t: string;
  m: string;
}

/** 左区 · 下载事件（仿真器产出） */
export interface DownloadEvent {
  uid: number;
  app: string;
  pkg: string;
  category: string;
  source: SourceKind;
  md5: string;
  sizeMB: number;
  time: string;
  isNew: boolean;
  variant?: boolean;
}

/** 中区 · SSE 日志事件（仿真器产出） */
export interface LogEvent {
  time: string;
  deviceId: string;
  serial: string;
  type: string;
  app: string;
  level: string;
  msg: string;
}

/** 全量数据集汇总 */
export interface AppData {
  CODES: CodeRecord[];
  DEVICES: Device[];
  APK_POOL: ApkPoolItem[];
  V4: V4Stats;
  FUNNEL: FunnelItem[];
  CATEGORIES: CategoryItem[];
  CHANNELS: ChannelItem[];
  SOURCE_STATS: Record<SourceKind, SourceStat>;
  QR_STATS: QrStats;
  SCRIPTS: Record<string, ScriptLine[]>;
}
