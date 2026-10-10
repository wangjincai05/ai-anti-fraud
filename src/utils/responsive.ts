// ===================================================================
// 反诈大屏 · rem 响应式适配核心
// 设计基准：1920 × 1080，1rem = 100px
// 计算公式：scale = min(vw / 1920, vh / 1080)；font-size = scale * 100
// 取 min 保证内容不被裁剪（宽高均能完整呈现）
// ===================================================================

/** 设计稿宽度（px） */
export const DESIGN_WIDTH = 1920
/** 设计稿高度（px） */
export const DESIGN_HEIGHT = 1080
/** 设计基准 1rem 对应 px（1920×1080 下根 font-size = 100px） */
export const REM_BASE = 100

let currentScale = 1
let rafId: number | null = null

/** 计算当前缩放比（相对设计稿） */
function calcScale(): number {
  const vw = window.innerWidth
  const vh = window.innerHeight
  return Math.min(vw / DESIGN_WIDTH, vh / DESIGN_HEIGHT)
}

/** 应用根 font-size */
function applyRootFont(): void {
  currentScale = calcScale()
  document.documentElement.style.fontSize = `${currentScale * REM_BASE}px`
}

/** resize 回调（requestAnimationFrame 节流，避免高频抖动） */
const onResize = (): void => {
  if (rafId !== null) return
  rafId = requestAnimationFrame(() => {
    rafId = null
    applyRootFont()
  })
}

/**
 * 初始化响应式适配系统
 * - 立即设置根 font-size
 * - 监听 window resize（rAF 节流）
 * - 返回清理函数，用于卸载时移除监听
 */
export function setupResponsive(): () => void {
  applyRootFont()
  window.addEventListener('resize', onResize, { passive: true })
  return () => {
    if (rafId !== null) {
      cancelAnimationFrame(rafId)
      rafId = null
    }
    window.removeEventListener('resize', onResize)
  }
}

/**
 * 获取当前缩放比（相对设计稿 1920×1080）
 * - 1920×1080 返回 1
 * - 3840×2160 返回 2
 * 用于 JS 计算尺寸（如 canvas 像素、ECharts 容器）
 */
export function getScale(): number {
  return currentScale
}
