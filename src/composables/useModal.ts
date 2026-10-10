// ===================================================================
// 反诈大屏 · 弹窗状态管理 composable
// 提供 isOpen 响应式开关 + open/close 方法
// 支持 ESC 键关闭（visible 时挂载 document keydown 监听）
// overlay 点击关闭由调用方将 close 接至弹窗 @close 事件实现
// ===================================================================

import { onBeforeUnmount, ref, watch, type Ref } from 'vue'

export interface UseModalReturn {
  isOpen: Ref<boolean>
  open: () => void
  close: () => void
}

/**
 * 弹窗状态管理
 * - isOpen：是否打开
 * - open / close：开关
 * - 打开期间监听 ESC 自动关闭；组件卸载时清理监听
 */
export function useModal(): UseModalReturn {
  const isOpen = ref(false)

  const open = (): void => {
    isOpen.value = true
  }

  const close = (): void => {
    isOpen.value = false
  }

  const onKeydown = (e: KeyboardEvent): void => {
    if (e.key === 'Escape' && isOpen.value) {
      close()
    }
  }

  watch(
    isOpen,
    (opened) => {
      if (opened) {
        document.addEventListener('keydown', onKeydown)
      } else {
        document.removeEventListener('keydown', onKeydown)
      }
    },
    { immediate: true },
  )

  onBeforeUnmount(() => {
    document.removeEventListener('keydown', onKeydown)
  })

  return { isOpen, open, close }
}
