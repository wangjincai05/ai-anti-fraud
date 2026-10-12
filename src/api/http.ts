/* ============================================================
 * http.ts · 请求层统一配置
 *   JSON_HEADERS：所有接口统一请求头
 *   （content-type: application/json; charset=utf-8）
 *   说明：SSE 走浏览器原生 EventSource，无法自定义请求头，不在此列。
 * ============================================================ */

/** 统一 JSON 请求头：所有 fetch 接口共用 */
export const JSON_HEADERS: Record<string, string> = {
  'Content-Type': 'application/json; charset=utf-8'
};
