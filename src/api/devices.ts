/* ============================================================
 * devices.ts · 设备画面适配层（real 模式 API 封装）
 *   getDevices       GET /api/v1/devices
 *   getFrameUrl      GET /api/v1/devices/{id}/frame?t={shot_at}
 *                    帧槽缓存 JPEG 直链（只读），供 <img src> 直接绑定
 *   getUiTree        GET /api/v1/devices/{id}/ui_tree
 * ============================================================ */

import type { Device } from './types';
import { env } from '@/env';
import { JSON_HEADERS } from './http';

function joinUrl(baseUrl: string, path: string, query = ''): string {
  return baseUrl.replace(/\/+$/, '') + env.apiPrefix + path + query;
}

/**
 * 获取设备列表
 * @param baseUrl 中控基础地址，如 https://smart-agent.work/apps/catdevice
 *                 开发环境配合 vite server.proxy 用相对前缀（如 catdevice）
 */
export async function getDevices(baseUrl: string): Promise<Device[]> {
  const url = joinUrl(baseUrl, '');
  const res = await fetch(url, { headers: JSON_HEADERS });
  if (!res.ok) {
    throw new Error('设备列表获取失败：HTTP ' + res.status + '（请检查中控地址/CORS）');
  }
  const list = (await res.json()) as Device[];
  return Array.isArray(list) ? list : [];
}

/**
 * 设备帧槽画面 URL（缓存 JPEG，只读）
 * 直接作为 <img src> 绑定；t 取 shot_at，同帧 URL 不变，浏览器缓存自动去重
 */
export function getFrameUrl(baseUrl: string, deviceId: string, shotAt: number): string {
  return joinUrl(baseUrl, '/' + encodeURIComponent(deviceId) + '/frame', '?t=' + shotAt);
}

/**
 * 获取设备 UI 树（控件层级）
 */
export async function getUiTree(baseUrl: string, deviceId: string): Promise<any> {
  const url = joinUrl(baseUrl, '/' + encodeURIComponent(deviceId) + '/ui_tree');
  const res = await fetch(url, { headers: JSON_HEADERS });
  if (!res.ok) {
    throw new Error('UI 树获取失败：HTTP ' + res.status);
  }
  return res.json();
}
