<script setup lang="ts">
/* ============================================================
 * EvidenceKpisPanel.vue · 右区 · 4 个取证 KPI
 *  累计二维码数 / 累计去重二维码数 / 今日二维码数 / 今日去重二维码数
 *  今日总数 = data.CODES.length
 *  今日去重 = 按 URL 去重（split('|')、空URL计1条）
 *  累计 = data.QR_STATS.cumTotalBase + 今日 / cumDedupBase + 今日去重
 *  fmt.countUp 动画
 * ============================================================ */
import { onMounted, ref } from 'vue';
import { data } from '@/mock/data';
import { fmt } from '@/utils/format';

function computeTodayDedup(): number {
  const seen: Record<string, boolean> = {};
  let n = 0;
  data.CODES.forEach((c) => {
    const urls = (c.url || '')
      .split('|')
      .map((s) => s.trim())
      .filter(Boolean);
    if (!urls.length) {
      n++;
      return;
    }
    urls.forEach((u) => {
      if (!seen[u]) {
        seen[u] = true;
        n++;
      }
    });
  });
  return n;
}

const todayTotal = data.CODES.length;
const todayDedup = computeTodayDedup();
const cumTotal = data.QR_STATS.cumTotalBase + todayTotal;
const cumDedup = data.QR_STATS.cumDedupBase + todayDedup;

const cumTotalEl = ref<HTMLElement | null>(null);
const cumDedupEl = ref<HTMLElement | null>(null);
const todayTotalEl = ref<HTMLElement | null>(null);
const todayDedupEl = ref<HTMLElement | null>(null);

onMounted(() => {
  if (cumTotalEl.value) fmt.countUp(cumTotalEl.value, 0, cumTotal, 900);
  if (cumDedupEl.value) fmt.countUp(cumDedupEl.value, 0, cumDedup, 900);
  if (todayTotalEl.value) fmt.countUp(todayTotalEl.value, 0, todayTotal, 900);
  if (todayDedupEl.value) fmt.countUp(todayDedupEl.value, 0, todayDedup, 900);
});
</script>

<template>
  <div class="r-kpis">
    <div class="r-kpi k1">
      <b ref="cumTotalEl">0</b><span>累计二维码数</span>
    </div>
    <div class="r-kpi k2">
      <b ref="cumDedupEl">0</b><span>累计去重二维码数</span>
    </div>
    <div class="r-kpi k3">
      <b ref="todayTotalEl">0</b><span>今日二维码数</span>
    </div>
    <div class="r-kpi k4">
      <b ref="todayDedupEl">0</b><span>今日去重二维码数</span>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.r-kpis {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.08rem;
  height: 100%;
}

.r-kpi {
  border: 0.01rem solid $bg-line;
  padding: 0.07rem 0.09rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 0.03rem;
  background: $bg-panel-2;

  b {
    font-family: 'SFMono-Regular', 'JetBrains Mono', Consolas, monospace;
    font-size: 0.22rem;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
    line-height: 1;
    color: $tx-1;
  }

  span {
    font-size: 0.1rem;
    color: $tx-3;
  }

  &.k1 b {
    color: $red;
  }
  &.k2 b {
    color: $amber;
  }
  &.k3 b {
    color: $green;
  }
  &.k4 b {
    color: $tx-2;
  }
}
</style>
