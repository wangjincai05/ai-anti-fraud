// ===================================================================
// 反诈大屏 · 断点监测 composable
// 暴露响应式标志：isLowRes（< 1920px）、is4K（>= 3840px）
// 用于在低分辨率下降级样式、4K 下启用高清资源
// ===================================================================

import { onBeforeUnmount, onMounted, ref, type Ref } from 'vue'

/** 低分辨率阈值：视口宽度 < 1920px 视为低分（降级） */
export const LOW_RES_BREAKPOINT = 1920
/** 4K 阈值：视口宽度 >= 3840px 视为 4K */
export const RES_4K_BREAKPOINT = 3840

/** 内部计算断点状态 */
function computeFlags(): { isLowRes: boolean; is4K: boolean } {
  const vw = window.innerWidth
  return {
    isLowRes: vw < LOW_RES_BREAKPOINT,
    is4K: vw >= RES_4K_BREAKPOINT,
  }
}

/**
 * 断点监测 composable
 * 在组件 onMounted 时挂载 resize 监听，onBeforeUnmount 时清理
 * @returns { isLowRes, is4K } 响应式 ref
 */
export function useBreakpoint(): { isLowRes: Ref<boolean>; is4K: Ref<boolean> } {
  const initial =
    typeof window !== 'undefined' ? computeFlags() : { isLowRes: false, is4K: false }
  const isLowRes = ref(initial.isLowRes)
  const is4K = ref(initial.is4K)

  let rafId: number | null = null

  const update = (): void => {
    const flags = computeFlags()
    isLowRes.value = flags.isLowRes
    is4K.value = flags.is4K
  }

  const onResize = (): void => {
    if (rafId !== null) return
    rafId = requestAnimationFrame(() => {
      rafId = null
      update()
    })
  }

  onMounted(() => {
    update()
    window.addEventListener('resize', onResize, { passive: true })
  })

  onBeforeUnmount(() => {
    if (rafId !== null) {
      cancelAnimationFrame(rafId)
      rafId = null
    }
    window.removeEventListener('resize', onResize)
  })

  return { isLowRes, is4K }
}
