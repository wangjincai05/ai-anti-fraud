// ===================================================================
// 反诈大屏 · 时钟 composable
// 每秒刷新时钟，返回响应式 time / date 文本
// 使用 fmt.hms() 与 fmt.fullDate() 格式化
// ===================================================================

import { onBeforeUnmount, onMounted, ref, type Ref } from 'vue'
import { fmt } from '@/utils/format'

export interface ClockRefs {
  time: Ref<string>
  date: Ref<string>
}

/**
 * 每秒刷新的时钟
 * onMounted 启动 setInterval(1000)，onBeforeUnmount 清理
 * @returns { time, date } 响应式 ref
 */
export function useClock(): ClockRefs {
  const time = ref(fmt.hms())
  const date = ref(fmt.fullDate())

  let timer: ReturnType<typeof setInterval> | null = null

  const tick = (): void => {
    const d = new Date()
    time.value = fmt.hms(d)
    date.value = fmt.fullDate(d)
  }

  onMounted(() => {
    tick()
    timer = setInterval(tick, 1000)
  })

  onBeforeUnmount(() => {
    if (timer !== null) {
      clearInterval(timer)
      timer = null
    }
  })

  return { time, date }
}
