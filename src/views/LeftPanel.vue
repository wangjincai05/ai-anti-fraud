<script setup lang="ts">
// 反诈大屏 · 左区容器
// 组合 SourceStatsPanel / ApkCategoryChart / ApkDownloadStream
// flex 纵向布局：200px / 150px / grow（对应原型 flex-basis）
import { ref } from 'vue'
import type { SourceKind } from '@/types/data'
import SourceStatsPanel from '@/components/left/SourceStatsPanel.vue'
import ApkCategoryChart from '@/components/left/ApkCategoryChart.vue'
import ApkDownloadStream from '@/components/left/ApkDownloadStream.vue'

const sourceStatsRef = ref<InstanceType<typeof SourceStatsPanel> | null>(null)

function onBumpSource(src: SourceKind): void {
  sourceStatsRef.value?.bumpSource(src)
}
</script>

<template>
  <section class="pane">
    <SourceStatsPanel ref="sourceStatsRef" />
    <ApkCategoryChart />
    <ApkDownloadStream @bump-source="onBumpSource" />
  </section>
</template>

<style scoped lang="scss">
.pane {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  min-height: 0;
  min-width: 0;
  position: relative;
}
</style>
