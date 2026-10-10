<script setup lang="ts">
/* ============================================================
 * MainGrid.vue · 反诈大屏主区三栏布局
 *  左：来源/校准/下载流（LeftPanel）
 *  中：AI 客服对线画面墙 + 实时日志（CenterPanel）
 *  右：取证 KPI + 转款码墙（RightPanel）
 *  栏间两个流向箭头（.flow-arrow fa-1/fa-2），
 *    位置与 .grid 列比例（24.2% / 1fr / 29.2%）对齐
 * RightPanel 的 open-detail 事件透传给上层 App
 * 样式：复用全局 _layout.scss 的 .grid / .flow-arrow 规则
 * ============================================================ */
import LeftPanel from './LeftPanel.vue'
import CenterPanel from './CenterPanel.vue'
import RightPanel from './RightPanel.vue'

const emit = defineEmits<{
  'open-detail': [idx: number]
}>()

function onDetail(idx: number): void {
  emit('open-detail', idx)
}
</script>

<template>
  <div class="grid">
    <LeftPanel />
    <CenterPanel />
    <RightPanel @open-detail="onDetail" />

    <!-- 栏间流向箭头：左 → 中 -->
    <div class="flow-arrow fa-1" aria-hidden="true">
      <span class="fa-line"></span>
      <span class="fa-tri"></span>
    </div>
    <!-- 栏间流向箭头：中 → 右 -->
    <div class="flow-arrow fa-2" aria-hidden="true">
      <span class="fa-line"></span>
      <span class="fa-tri"></span>
    </div>
  </div>
</template>
