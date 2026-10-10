<script setup lang="ts">
/* ============================================================
 * App.vue · 反诈大屏根视图
 *  viewport + stage 容器：
 *    - rem 响应式适配为主（responsive.ts 设置根 font-size）
 *    - transform scale 兜底作为补充适配（--app-scale 默认 1）
 *  组合：AppHeader + MainGrid + DetailModal（同步）+ SettingsModal（懒加载）
 *  DetailModal 同步导入：避免懒加载延迟诱发的二次点击关闭竞态
 *  SettingsModal 用 defineAsyncComponent + v-if：首屏不加载该弹窗代码
 * ============================================================ */
import { defineAsyncComponent, ref } from 'vue'
import AppHeader from '@/components/AppHeader.vue'
import MainGrid from '@/views/MainGrid.vue'
import DetailModal from '@/components/DetailModal.vue'
import { useModal } from '@/composables/useModal'

// 弹窗状态：useModal 提供 isOpen + open/close，并自动监听 ESC 关闭
const { isOpen: detailOpen, open: openDetail, close: closeDetail } = useModal()
const { isOpen: settingsOpen, open: openSettings, close: closeSettings } = useModal()

// 点击的码墙卡片索引
const detailIdx = ref(0)

function onOpenDetail(idx: number): void {
  detailIdx.value = idx
  openDetail()
}

// 弹窗懒加载：defineAsyncComponent 分块打包，配合 v-if 推迟首次渲染
const SettingsModal = defineAsyncComponent(() => import('@/components/SettingsModal.vue'))
</script>

<template>
  <div id="viewport">
    <div id="stage">
      <AppHeader @open-settings="openSettings" />
      <MainGrid @open-detail="onOpenDetail" />
      <DetailModal
        v-if="detailOpen"
        :visible="detailOpen"
        :code-idx="detailIdx"
        @close="closeDetail"
      />
      <SettingsModal
        v-if="settingsOpen"
        :visible="settingsOpen"
        @close="closeSettings"
      />
    </div>
  </div>
</template>

<style scoped lang="scss">
// transform scale 兜底：rem 适配为主（responsive.ts 设置根 font-size），
// --app-scale 默认 1，必要时可由 JS 设置以补充缩放
#stage {
  transform: translate(-50%, -50%) scale(var(--app-scale, 1));
}
</style>
