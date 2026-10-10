/* ============================================================
 * format.ts · 纯函数工具：时间 / 数字 / 文本 / DOM
 *  迁移自原型 core/format.js，全部 TS 类型化
 * ============================================================ */

const WEEK = ['日', '一', '二', '三', '四', '五', '六'];

/** 不足两位前补 0 */
export function pad(n: number): string {
  return (n < 10 ? '0' : '') + n;
}

/** 时:分:秒 */
export function hms(d: Date = new Date()): string {
  return pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
}

/** 中文全日期（含星期） */
export function fullDate(d: Date = new Date()): string {
  return (
    d.getFullYear() +
    '年' +
    pad(d.getMonth() + 1) +
    '月' +
    pad(d.getDate()) +
    '日 星期' +
    WEEK[d.getDay()]
  );
}

/** 千分位分隔 */
export function num(n: number): string {
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/** MD5 截取前 8 位用于短展示 */
export function md5Short(m: string): string {
  return m ? m.slice(0, 8) : '--------';
}

/** HTML 转义 */
export function escape(s: string | null | undefined): string {
  return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!;
  });
}

/** 数字滚动动画（easeOutCubic） */
export function countUp(el: HTMLElement, from: number, to: number, dur: number = 800): void {
  let start: number | null = null;
  const frame = (ts: number) => {
    if (start === null) start = ts;
    const p = Math.min(1, (ts - start) / dur);
    const eased = 1 - Math.pow(1 - p, 3);
    el.textContent = num(Math.round(from + (to - from) * eased));
    if (p < 1) requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}

/** 命名空间对象（兼容 fmt.xxx 调用形态） */
export const fmt = {
  pad,
  hms,
  fullDate,
  num,
  md5Short,
  escape,
  countUp,
};

/** 根据账号类型文本归类渠道（用于标签配色 / 环图） */
export function channelKind(codeType: string): 'dual' | 'ali' | 'game' | 'wx' {
  const t = codeType || '';
  if (t.indexOf('双码') >= 0) return 'dual';
  if (t.indexOf('支付宝') >= 0 && t.indexOf('微信') >= 0) return 'dual';
  if (t.indexOf('游戏充值') >= 0) return 'game';
  if (t.indexOf('支付宝') >= 0) return 'ali';
  return 'wx';
}
