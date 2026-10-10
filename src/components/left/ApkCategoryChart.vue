<script setup lang="ts">
// 反诈大屏 · 左区 · APK 分类分布条形图（ECharts 暗色）
// 按需引入：BarChart + GridComponent + TooltipComponent + CanvasRenderer
// 数据来自 data.CATEGORIES，配置参考原型 funnel.js 的 AF.charts.categories
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { init, use } from 'echarts/core'
import { BarChart } from 'echarts/charts'
import { GridComponent, TooltipComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import type { ECharts } from 'echarts/core'
import { data } from '@/mock/data'

use([BarChart, GridComponent, TooltipComponent, CanvasRenderer])

const chartEl = ref<HTMLDivElement | null>(null)
let chart: ECharts | null = null

function buildOption() {
  const cats = data.CATEGORIES
  const AXIS = '#6c84a3'
  return {
    animationDuration: 800,
    grid: { left: 128, right: 34, top: 4, bottom: 4, containLabel: false },
    tooltip: {
      backgroundColor: '#0c1628',
      borderColor: 'rgba(92,168,255,.4)',
      textStyle: { color: '#e8f1ff', fontSize: 12 },
    },
    xAxis: { type: 'value', show: false },
    yAxis: {
      type: 'category',
      inverse: true,
      data: cats.map((c) => c.name),
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: AXIS, fontSize: 10.5 },
    },
    series: [
      {
        type: 'bar',
        barWidth: 8,
        data: cats.map((c, i) => ({
          value: c.value,
          itemStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 1,
              y2: 0,
              colorStops: [
                { offset: 0, color: 'rgba(56,225,255,.18)' },
                { offset: 1, color: i < 2 ? '#38e1ff' : '#46a8ff' },
              ],
            },
            borderRadius: [0, 2, 2, 0],
          },
        })),
        label: {
          show: true,
          position: 'right',
          color: '#7fb8e8',
          fontSize: 10,
          fontFamily: 'Consolas',
        },
        splitLine: { show: false },
      },
    ],
  }
}

onMounted(() => {
  if (!chartEl.value) return
  chart = init(chartEl.value, null, { renderer: 'canvas' })
  chart.setOption(buildOption())
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  if (chart) {
    chart.dispose()
    chart = null
  }
})

function handleResize(): void {
  if (chart) chart.resize()
}
</script>

<template>
  <div class="panel auto cat-panel">
    <div class="panel-head">
      <span class="ph-bar"></span>
      <h3>APK 分 类 分 布</h3>
      <span class="ph-spacer"></span>
      <span class="ph-sub">近24h 入库样本</span>
    </div>
    <div class="panel-body">
      <div ref="chartEl" class="chart-box"></div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.panel {
  position: relative;
  background: rgba(12, 22, 40, 0.72);
  border: 0.01rem solid $bg-line;
  display: flex;
  flex-direction: column;
  min-height: 0;
  backdrop-filter: blur(2px);
}

.panel::before,
.panel::after {
  content: '';
  position: absolute;
  width: 0.12rem;
  height: 0.12rem;
  pointer-events: none;
}

.panel::before {
  left: -0.01rem;
  top: -0.01rem;
  border-left: 0.02rem solid $cyan;
  border-top: 0.02rem solid $cyan;
}

.panel::after {
  right: -0.01rem;
  bottom: -0.01rem;
  border-right: 0.02rem solid $cyan;
  border-bottom: 0.02rem solid $cyan;
}

.panel.auto {
  flex: 0 0 auto;
}

.panel-head {
  flex: 0 0 0.38rem;
  height: 0.38rem;
  padding: 0 0.12rem 0 0.14rem;
  display: flex;
  align-items: center;
  gap: 0.09rem;
  border-bottom: 0.01rem solid $bg-line;
  background: linear-gradient(90deg, rgba(56, 225, 255, 0.1), transparent 70%);
}

.panel-head .ph-bar {
  width: 0.04rem;
  height: 0.15rem;
  background: $cyan;
  box-shadow: 0 0 0.08rem $cyan;
}

.panel-head h3 {
  font-size: 0.15rem;
  font-weight: 700;
  letter-spacing: 0.02rem;
  color: $tx-1;
}

.panel-head .ph-sub {
  font-size: 0.105rem;
  color: $tx-3;
  font-family: 'SFMono-Regular', 'JetBrains Mono', Consolas, 'Courier New', monospace;
  letter-spacing: 0.005rem;
}

.panel-head .ph-spacer {
  flex: 1;
}

.panel-body {
  flex: 1;
  min-height: 0;
  position: relative;
  padding: 0.1rem 0.12rem;
  min-height: 120px;
}

.cat-panel {
  flex: 0 0 1.5rem;
}

.chart-box {
  width: 100%;
  height: 100%;
  min-height: 0;
}
</style>
