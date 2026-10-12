<script setup lang="ts">
// 反诈大屏 · 顶栏组件
// 品牌徽标 + 标题 + 时钟 + 设置按钮
// 样式参考原型 .topbar / .brand / .clock / .icon-btn，px → rem（1rem=100px）
import { useClock } from '@/composables/useClock'

defineEmits<{
  (e: 'open-settings'): void
}>()

const { time, date } = useClock()
</script>

<template>
  <header class="topbar">
    <div class="brand">
      <div class="brand-badge"></div>
      <div>
        <div class="brand-title">涉诈 APP 全链路智能取证系统</div>
        <div class="brand-sub">ANTI-FRAUD · AI AGENT OPS CONSOLE</div>
      </div>
    </div>
    <div class="screen-title">
      <h1>反 诈 A I 客 服 实 战 大 屏</h1>
      <div class="title-en">Download · Confrontation · Payment Code Interception</div>
    </div>
    <div class="topbar-right">
      <div class="clock">
        <div class="clock-time">{{ time }}</div>
        <div class="clock-date">{{ date }}</div>
      </div>
    </div>
  </header>
</template>

<style scoped lang="scss">
.topbar {
  height: 0.88rem;
  flex: 0 0 0.88rem;
  position: relative;
  display: grid;
  grid-template-columns: 5.2rem 1fr 5.2rem;
  align-items: center;
  padding: 0 0.22rem;
  background:
    linear-gradient(180deg, rgba(20, 42, 74, 0.85), rgba(10, 20, 38, 0.55)),
    linear-gradient(90deg, transparent, rgba(56, 225, 255, 0.08), transparent);
  border: 0.01rem solid $bg-line;
  border-top: 0.02rem solid $cyan-soft;
  clip-path: polygon(0 0, calc(100% - 0.26rem) 0, 100% 0.26rem, 100% 100%, 0.26rem 100%, 0 calc(100% - 0.26rem));
}

.topbar::after {
  content: '';
  position: absolute;
  left: 50%;
  bottom: -0.01rem;
  transform: translateX(-50%);
  width: 56%;
  height: 0.02rem;
  background: linear-gradient(90deg, transparent, $cyan, transparent);
  opacity: 0.7;
}

.brand {
  display: flex;
  align-items: center;
  gap: 0.14rem;
}

.brand-badge {
  width: 0.46rem;
  height: 0.46rem;
  position: relative;
  flex: 0 0 0.46rem;
  border: 0.015rem solid $cyan;
  border-radius: 50%;
  display: grid;
  place-items: center;
  box-shadow: 0 0 0.14rem rgba(56, 225, 255, 0.35), inset 0 0 0.1rem rgba(56, 225, 255, 0.22);
}

.brand-badge::before {
  content: '';
  width: 0.14rem;
  height: 0.14rem;
  background: $cyan;
  clip-path: polygon(50% 0, 100% 38%, 82% 100%, 18% 100%, 0 38%);
  box-shadow: 0 0 0.08rem $cyan;
}

.brand-title {
  font-size: 0.15rem;
  letter-spacing: 0.02rem;
  color: $tx-2;
  font-weight: 600;
}

.brand-sub {
  font-size: 0.11rem;
  color: $tx-3;
  letter-spacing: 0.01rem;
  margin-top: 0.03rem;
  font-family: 'SFMono-Regular', 'JetBrains Mono', Consolas, 'Courier New', monospace;
}

.screen-title {
  text-align: center;
  align-self: stretch;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.screen-title h1 {
  font-size: 0.32rem;
  font-weight: 800;
  letter-spacing: 0.08rem;
  background: linear-gradient(180deg, #ffffff 30%, #8fdcff 85%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  text-shadow: 0 0 0.26rem rgba(56, 225, 255, 0.25);
}

.screen-title .title-en {
  font-size: 0.1rem;
  letter-spacing: 0.05rem;
  color: $tx-3;
  margin-top: 0.02rem;
  font-family: 'SFMono-Regular', 'JetBrains Mono', Consolas, 'Courier New', monospace;
  text-transform: uppercase;
}

.topbar-right {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.18rem;
}

.clock {
  text-align: right;
}

.clock-time {
  font-family: 'SFMono-Regular', 'JetBrains Mono', Consolas, 'Courier New', monospace;
  font-size: 0.26rem;
  font-weight: 700;
  color: $cyan;
  letter-spacing: 0.02rem;
  font-variant-numeric: tabular-nums;
}

.clock-date {
  font-size: 0.11rem;
  color: $tx-3;
  margin-top: 0.01rem;
  letter-spacing: 0.01rem;
}

.icon-btn {
  width: 0.36rem;
  height: 0.36rem;
  border: 0.01rem solid rgba(92, 168, 255, 0.42);
  background: rgba(56, 225, 255, 0.08);
  color: $cyan;
  border-radius: 0.04rem;
  cursor: pointer;
  display: grid;
  place-items: center;
  transition: background 0.15s;
  padding: 0;
}

.icon-btn:hover {
  background: rgba(56, 225, 255, 0.22);
}

.icon-btn svg {
  width: 0.18rem;
  height: 0.18rem;
}
</style>
