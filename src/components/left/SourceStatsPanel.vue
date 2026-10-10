<script setup lang="ts">
// 反诈大屏 · 左区 · 下载源统计面板
// 双源卡片（A/B）累计 + 当日，初始从 data.SOURCE_STATS 读
// srcStats 响应式状态，bumpSource(src) 更新累计+当日 + 刷新对比条
import { computed, reactive } from 'vue'
import { data } from '@/mock/data'
import type { SourceKind } from '@/types/data'
import { fmt } from '@/utils/format'

interface SrcState {
  name: string
  cumulative: number
  today: number
  color: string
}

const srcStats = reactive<Record<SourceKind, SrcState>>({
  A: { ...data.SOURCE_STATS.A },
  B: { ...data.SOURCE_STATS.B },
})

const cumA = computed(() => fmt.num(srcStats.A.cumulative))
const cumB = computed(() => fmt.num(srcStats.B.cumulative))
const todayA = computed(() => fmt.num(srcStats.A.today))
const todayB = computed(() => fmt.num(srcStats.B.today))

const ratioA = computed(() => {
  const total = srcStats.A.today + srcStats.B.today
  return total ? Math.round((srcStats.A.today / total) * 100) : 50
})
const ratioB = computed(() => 100 - ratioA.value)

/** 下载完成时调用：累计 +1，当日 +1，刷新对比条（响应式自动驱动） */
function bumpSource(src: SourceKind): void {
  const s = srcStats[src] || srcStats.B
  s.cumulative++
  s.today++
}

defineExpose({ bumpSource })
</script>

<template>
  <div class="panel auto src-panel">
    <div class="panel-head">
      <span class="ph-bar"></span>
      <h3>下 载 源 统 计</h3>
      <span class="ph-spacer"></span>
      <span class="lamp"><i></i>实时</span>
    </div>
    <div class="panel-body">
      <div class="src-grid">
        <div class="src-card a">
          <div class="src-name"><i :style="{ background: srcStats.A.color }"></i>{{ srcStats.A.name }}</div>
          <div class="src-cum">{{ cumA }}</div>
          <div class="src-cum-label">累计下载（次）</div>
          <div class="src-today">
            <b>{{ todayA }}</b><span>当日下载</span>
          </div>
        </div>
        <div class="src-card b">
          <div class="src-name"><i :style="{ background: srcStats.B.color }"></i>{{ srcStats.B.name }}</div>
          <div class="src-cum">{{ cumB }}</div>
          <div class="src-cum-label">累计下载（次）</div>
          <div class="src-today">
            <b>{{ todayB }}</b><span>当日下载</span>
          </div>
        </div>
      </div>
      <div class="src-ratio">
        <span class="sr-label">今日占比</span>
        <div class="sr-bar">
          <i :style="{ background: srcStats.A.color, flexBasis: ratioA + '%' }"></i>
          <i :style="{ background: srcStats.B.color, flexBasis: ratioB + '%' }"></i>
        </div>
        <span class="sr-pct">A {{ ratioA }}%</span>
        <span class="sr-pct">B {{ ratioB }}%</span>
      </div>
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

.panel.grow {
  flex: 1;
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
}

.panel-body.flush {
  padding: 0;
}

.lamp {
  display: inline-flex;
  align-items: center;
  gap: 0.06rem;
  font-size: 0.11rem;
  color: $tx-2;
}

.lamp i {
  width: 0.07rem;
  height: 0.07rem;
  border-radius: 50%;
  background: $green;
  box-shadow: 0 0 0.07rem $green;
  animation: lampPulse 1.6s ease-in-out infinite;
}

.lamp.amber i {
  background: $amber;
  box-shadow: 0 0 0.07rem $amber;
}

@keyframes lampPulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.35;
  }
}

.src-panel {
  flex: 0 0 2rem;
}

.src-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.08rem;
  height: calc(100% - 0.3rem);
}

.src-card {
  border: 0.01rem solid $bg-line;
  padding: 0.08rem 0.1rem;
  display: flex;
  flex-direction: column;
  gap: 0.02rem;
  background: rgba(16, 30, 54, 0.66);
  position: relative;
}

.src-card.a {
  background: linear-gradient(180deg, rgba(56, 225, 255, 0.07), transparent);
  border-color: rgba(56, 225, 255, 0.28);
}

.src-card.b {
  background: linear-gradient(180deg, rgba(255, 176, 32, 0.07), transparent);
  border-color: rgba(255, 176, 32, 0.28);
}

.src-card::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 0.02rem;
  background: $cyan;
}

.src-card.b::before {
  background: $amber;
}

.src-name {
  display: flex;
  align-items: center;
  gap: 0.06rem;
  font-size: 0.11rem;
  color: $tx-2;
  font-weight: 600;
}

.src-name i {
  width: 0.07rem;
  height: 0.07rem;
  border-radius: 50%;
  box-shadow: 0 0 0.06rem currentColor;
}

.src-cum {
  font-family: 'SFMono-Regular', 'JetBrains Mono', Consolas, 'Courier New', monospace;
  font-size: 0.23rem;
  font-weight: 700;
  color: $cyan;
  font-variant-numeric: tabular-nums;
  line-height: 1.05;
  margin-top: 0.04rem;
}

.src-card.b .src-cum {
  color: $amber;
}

.src-cum-label {
  font-size: 0.095rem;
  color: $tx-3;
}

.src-today {
  display: flex;
  align-items: baseline;
  gap: 0.06rem;
  margin-top: auto;
  padding-top: 0.04rem;
  border-top: 0.01rem dashed $bg-line;
}

.src-today b {
  font-family: 'SFMono-Regular', 'JetBrains Mono', Consolas, 'Courier New', monospace;
  font-size: 0.16rem;
  font-weight: 700;
  color: $tx-1;
  font-variant-numeric: tabular-nums;
}

.src-today span {
  font-size: 0.1rem;
  color: $tx-3;
}

.src-ratio {
  display: flex;
  align-items: center;
  gap: 0.08rem;
  height: 0.3rem;
  margin-top: 0.06rem;
  font-size: 0.105rem;
  color: $tx-3;
  font-family: 'SFMono-Regular', 'JetBrains Mono', Consolas, 'Courier New', monospace;
}

.sr-label {
  flex: 0 0 auto;
}

.sr-bar {
  flex: 1;
  display: flex;
  height: 0.08rem;
  border-radius: 0.04rem;
  overflow: hidden;
  background: rgba(86, 132, 184, 0.12);
}

.sr-bar i {
  flex: 0 0 50%;
  height: 100%;
  transition: flex-basis 0.6s ease;
}

.sr-pct {
  flex: 0 0 auto;
}
</style>
