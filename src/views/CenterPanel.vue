<script setup lang="ts">
/* ============================================================
 * CenterPanel.vue · 中区组合
 *  上：AI 客服对线画面墙（DeviceWall）
 *  下：实时对线日志（LogStream，SSE 状态灯由本面板渲染）
 * ============================================================ */
import { computed, ref } from 'vue';
import { config } from '@/config';
import DeviceWall from '@/components/center/DeviceWall.vue';
import LogStream from '@/components/center/LogStream.vue';

const logState = ref<string>('connected');

function onStateChange(state: string): void {
  logState.value = state;
}

const lampClass = computed(() => {
  if (logState.value === 'reconnecting') return 'amber';
  if (logState.value === 'closed') return 'off';
  return '';
});

const lampText = computed(() => {
  if (logState.value === 'reconnecting') return '重连中…';
  if (logState.value === 'closed') return '已断开';
  return '已连接';
});

const sseLabel = computed(() =>
  config.mode.value === 'real' ? 'SSE · ' + config.sseUrl.value : 'SSE · /api/logs',
);
</script>

<template>
  <section class="pane pane-center">
    <div class="panel wall-panel">
      <div class="panel-head">
        <span class="ph-bar"></span>
        <h3>AI 客 服 对 线 画 面 墙</h3>
        <span class="ph-spacer"></span>
        <span class="lamp"><i></i>内存缓存 · 毫秒级</span>
      </div>
      <div class="panel-body flush static">
        <DeviceWall />
      </div>
    </div>

    <div class="panel grow">
      <div class="panel-head">
        <span class="ph-bar"></span>
        <h3>实 时 对 线 日 志</h3>
        <span class="ph-spacer"></span>
        <span class="ph-sub">{{ sseLabel }}</span>
        <span style="width: 0.1rem"></span>
        <span class="lamp" :class="lampClass"><i></i>{{ lampText }}</span>
      </div>
      <div class="panel-body flush">
        <LogStream @state-change="onStateChange" />
      </div>
    </div>
  </section>
</template>

<style lang="scss" scoped>
.pane-center {
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

.wall-panel {
  flex-basis: 4.08rem;
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
  &.static {
    position: static;
  }
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

  &.off i {
    background: #5a6b82;
    box-shadow: none;
    animation: none;
  }
  &.amber i {
    background: $amber;
    box-shadow: 0 0 0.07rem $amber;
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
