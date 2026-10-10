/* ============================================================
 * devices.ts · 设备画面适配层（real 模式 API 封装）
 *   getDevices       GET /api/v1/devices
 *   getScreenshot    GET /api/v1/devices/{id}/screenshot?t=
 *                    444 = 在线但暂无图 → 返回 null
 *   getUiTree        GET /api/v1/devices/{id}/ui_tree
 * ============================================================ */

import type { Device } from './types';

const API_PREFIX = '/api/v1/devices';

function joinUrl(baseUrl: string, path: string, query = ''): string {
  return baseUrl.replace(/\/+$/, '') + API_PREFIX + path + query;
}

/**
 * 获取设备列表
 * @param baseUrl 中控基础地址，如 http://192.168.1.10:8000
 */
export async function getDevices(baseUrl: string): Promise<Device[]> {
  const res = await fetch(joinUrl(baseUrl, ''));
  if (!res.ok) {
    throw new Error('设备列表获取失败：HTTP ' + res.status + '（请检查中控地址/CORS）');
  }
  const list = (await res.json()) as Device[];
  return Array.isArray(list) ? list : [];
}

/**
 * 获取设备截图（PNG blob URL）
 * @param t        防缓存时间戳；不传则自动取 Date.now()
 * @returns        blob: URL（调用方用完应 URL.revokeObjectURL 释放）
 *                  在线但暂无图（HTTP 444）返回 null
 */
export async function getScreenshot(
  baseUrl: string,
  deviceId: string,
  t?: number
): Promise<string | null> {
  const ts = typeof t === 'number' ? t : Date.now();
  const url = joinUrl(baseUrl, '/' + encodeURIComponent(deviceId) + '/screenshot', '?t=' + ts);
  const res = await fetch(url);
  if (res.status === 444) return null; // 在线但暂无图
  if (!res.ok) {
    throw new Error('截图获取失败：HTTP ' + res.status);
  }
  const blob = await res.blob();
  return URL.createObjectURL(blob);
}

/**
 * 获取设备 UI 树（控件层级）
 */
export async function getUiTree(baseUrl: string, deviceId: string): Promise<any> {
  const url = joinUrl(baseUrl, '/' + encodeURIComponent(deviceId) + '/ui_tree');
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error('UI 树获取失败：HTTP ' + res.status);
  }
  return res.json();
}
