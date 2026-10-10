<script setup lang="ts">
/* ============================================================
 * LogStream.vue · 中区 · 实时对线日志
 *  mock 模式：stream.logs.start({ onLog })
 *  real 模式：connectSse(config.sseUrl, onLog, onState)
 *  日志行颜色分级：t-enter/t-send/t-recv/t-shot/t-code/t-sys
 *  自动滚动到底部，保留最近 N 条
 *  状态变化通过 state-change 事件上抛（由 CenterPanel 渲染状态灯）
 * ============================================================ */
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { config } from '@/config';
import { stream } from '@/mock/stream';
import { connectSse } from '@/api/logs';
import type { LogEvent } from '@/types/data';

const MAX_LOG = 90;

const TYPE_LABEL: Record<string, string> = {
  enter: '进入客服',
  send: '发送话术',
  recv: '收到回复',
  shot: '自动截屏',
  code: '取码结果',
  sys: '系统',
};

const emit = defineEmits<{
  'state-change': [state: string];
}>();

const logs = ref<LogEvent[]>([]);
const scrollRef = ref<HTMLElement | null>(null);

let sseHandle: { close: () => void } | null = null;

function appendLog(ev: LogEvent): void {
  logs.value.push(ev);
  if (logs.value.length > MAX_LOG) {
    logs.value.splice(0, logs.value.length - MAX_LOG);
  }
}

function onState(state: string): void {
  emit('state-change', state);
}

function startMock(): void {
  stream.logs.start({
    onLog: (ev) => appendLog(ev),
  });
}

function startReal(): void {
  sseHandle = connectSse(
    config.sseUrl.value,
    (ev) => {
      appendLog({
        time: ev.time,
        deviceId: '—',
        serial: ev.serial,
        type: ev.type,
        app: '',
        level: ev.level,
        msg: ev.msg,
      });
    },
    onState,
  );
}

function stop(): void {
  stream.logs.stop();
  if (sseHandle) {
    sseHandle.close();
    sseHandle = null;
  }
}

onMounted(() => {
  if (config.mode.value === 'real') {
    startReal();
  } else {
    startMock();
  }
});

onBeforeUnmount(stop);

watch(
  () => logs.value.length,
  async () => {
    await nextTick();
    if (scrollRef.value) {
      scrollRef.value.scrollTop = scrollRef.value.scrollHeight;
    }
  },
);

function shortSerial(serial: string, type: string): string {
  if (!serial || serial === '—') return type === 'emulator' ? '模拟器' : '真机';
  if (serial.indexOf('127.0.0.1') === 0) return '模拟·' + serial.split(':')[1];
  const m = serial.match(/192\.168\.\d+\.(\d+)/);
  return (type === 'emulator' ? '模拟·' : '真机·') + (m ? m[1] : serial);
}

function typeLabel(level: string): string {
  return TYPE_LABEL[level] || '事件';
}
</script>

<template>
  <div class="log-wrap">
    <div ref="scrollRef" class="log-scroll">
      <div v-for="(e, i) in logs" :key="i" class="log-row">
        <span class="log-time">{{ e.time }}</span>
        <span class="log-dev" :class="e.type === 'emulator' ? 'd-emu' : 'd-real'">
          {{ shortSerial(e.serial, e.type) }}
        </span>
        <span class="log-type" :class="'t-' + e.level">
          <i></i>{{ typeLabel(e.level) }}
        </span>
        <span class="log-msg">{{ e.msg }}</span>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.log-wrap {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.log-scroll {
  flex: 1;
  overflow-y: auto;
  padding: 0.08rem 0.12rem;
  font-family: 'SFMono-Regular', 'JetBrains Mono', Consolas, 'Courier New',
    monospace;
  font-size: 0.12rem;
  display: flex;
  flex-direction: column;
  gap: 0;
}

.log-row {
  display: flex;
  gap: 0.1rem;
  padding: 0.04rem 0.06rem;
  border-left: 0.02rem solid transparent;
  align-items: baseline;
  animation: rowIn 0.3s ease-out;

  &:hover {
    background: rgba(56, 225, 255, 0.05);
  }
}

@keyframes rowIn {
  from {
    opacity: 0;
    transform: translateY(-0.1rem);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.log-time {
  color: $tx-3;
  flex: 0 0 0.78rem;
  font-size: 0.11rem;
}

.log-dev {
  flex: 0 0 0.92rem;
  font-size: 0.11rem;

  &.d-real {
    color: #cfe2ff;
  }
  &.d-emu {
    color: #93a6c4;
  }
}

.log-type {
  flex: 0 0 0.86rem;
  font-size: 0.11rem;
  display: inline-flex;
  align-items: center;
  gap: 0.05rem;

  i {
    width: 0.06rem;
    height: 0.06rem;
    border-radius: 50%;
  }
}

.log-msg {
  color: $tx-2;
  font-size: 0.115rem;
  min-width: 0;
  word-break: break-all;
}

.t-enter {
  color: $cyan;
  i {
    background: $cyan;
  }
}
.t-send {
  color: #7aaaff;
  i {
    background: #7aaaff;
  }
}
.t-recv {
  color: $green;
  i {
    background: $green;
  }
}
.t-shot {
  color: $purple;
  i {
    background: $purple;
  }
}
.t-code {
  color: $red;
  i {
    background: $red;
    box-shadow: 0 0 0.06rem $red;
  }
}
.t-sys {
  color: $tx-3;
  i {
    background: $tx-3;
  }
}
</style>
