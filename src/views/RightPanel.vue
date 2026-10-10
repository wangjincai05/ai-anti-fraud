<script setup lang="ts">
/* ============================================================
 * RightPanel.vue · 右区组合
 *  上：取证成果 KPI（EvidenceKpisPanel）
 *  下：转款码实时输出墙（CodeWall，点击转抛 open-detail）
 * ============================================================ */
import EvidenceKpisPanel from '@/components/right/EvidenceKpisPanel.vue';
import CodeWall from '@/components/right/CodeWall.vue';

const emit = defineEmits<{
  'open-detail': [idx: number];
}>();

function onOpenDetail(idx: number): void {
  emit('open-detail', idx);
}
</script>

<template>
  <section class="pane pane-right">
    <div class="panel kpi-panel">
      <div class="panel-head">
        <span class="ph-bar"></span>
        <h3>取 证 成 果</h3>
        <span class="ph-spacer"></span>
        <span class="ph-sub">2026-09-28 批次</span>
      </div>
      <div class="panel-body kpi-body">
        <EvidenceKpisPanel />
      </div>
    </div>

    <div class="panel grow">
      <div class="panel-head">
        <span class="ph-bar"></span>
        <h3>转 款 码 实 时 输 出 墙</h3>
        <span class="ph-spacer"></span>
        <span class="lamp"><i></i>滚动中 · 悬停暂停</span>
      </div>
      <div class="panel-body flush">
        <CodeWall @open-detail="onOpenDetail" />
      </div>
    </div>
  </section>
</template>

<style lang="scss" scoped>
.pane-right {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  min-height: 0;
  min-width: 0;
  position: relative;
}

.panel {
  position: relative;
  background: rgba(12, 22, 40, 0.72);
  border: 0.01rem solid $bg-line;
  display: flex;
  flex-direction: column;
  min-height: 0;
  backdrop-filter: blur(2px);

  &::before,
  &::after {
    content: '';
    position: absolute;
    width: 0.12rem;
    height: 0.12rem;
    pointer-events: none;
  }
  &::before {
    left: -0.01rem;
    top: -0.01rem;
    border-left: 0.02rem solid $cyan;
    border-top: 0.02rem solid $cyan;
  }
  &::after {
    right: -0.01rem;
    bottom: -0.01rem;
    border-right: 0.02rem solid $cyan;
    border-bottom: 0.02rem solid $cyan;
  }

  &.grow {
    flex: 1;
  }
  &.auto {
    flex: 0 0 auto;
  }
}

.kpi-panel {
  flex-basis: 1.4rem;
}

.panel-head {
  flex: 0 0 0.38rem;
  height: 0.38rem;
  padding: 0 0.12rem 0 0.14rem;
  display: flex;
  align-items: center;
  gap: 0.09rem;
  border-bottom: 0.01rem solid $bg-line;
  background: linear-gradient(
    90deg,
    rgba(56, 225, 255, 0.1),
    transparent 70%
  );

  .ph-bar {
    width: 0.04rem;
    height: 0.15rem;
    background: $cyan;
    box-shadow: 0 0 0.08rem $cyan;
  }

  h3 {
    font-size: 0.15rem;
    font-weight: 700;
    letter-spacing: 0.02rem;
    color: $tx-1;
    margin: 0;
  }

  .ph-sub {
    font-size: 0.105rem;
    color: $tx-3;
    font-family: 'SFMono-Regular', 'JetBrains Mono', Consolas, monospace;
    letter-spacing: 0.5px;
  }

  .ph-spacer {
    flex: 1;
  }
}

.panel-body {
  flex: 1;
  min-height: 0;
  position: relative;
  padding: 0.1rem 0.12rem;

  &.flush {
    padding: 0;
  }
}

.kpi-body {
  padding: 0.08rem 0.1rem;
}

.lamp {
  display: inline-flex;
  align-items: center;
  gap: 0.06rem;
  font-size: 0.11rem;
  color: $tx-2;

  i {
    width: 0.07rem;
    height: 0.07rem;
    border-radius: 50%;
    background: $green;
    box-shadow: 0 0 0.07rem $green;
    animation: lampPulse 1.6s ease-in-out infinite;
  }
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
</style>
