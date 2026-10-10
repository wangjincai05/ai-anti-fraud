<script setup lang="ts">
// 反诈大屏 · 数据源设置弹窗
// 模式切换 / Base URL / SSE 地址，变更即持久化（config.save）
// 迁移自原型 settings.js，px → rem（1rem=100px）
import { ref, watch } from 'vue'
import { config, type Mode } from '@/config'

const props = defineProps<{
  visible: boolean
}>()

defineEmits<{
  (e: 'close'): void
}>()

const baseUrl = ref(config.baseUrl.value)
const sseUrl = ref(config.sseUrl.value)

// 每次打开时从 config 同步最新值
watch(
  () => props.visible,
  (v) => {
    if (v) {
      baseUrl.value = config.baseUrl.value
      sseUrl.value = config.sseUrl.value
    }
  },
)

function setMode(m: Mode): void {
  if (config.mode.value === m) return
  config.mode.value = m
  config.save()
}

function onBaseUrlChange(): void {
  config.baseUrl.value = baseUrl.value.trim().replace(/\/+$/, '')
  // Base URL 变更自动派生 SSE 地址（与原型一致）
  config.sseUrl.value = config.baseUrl.value + '/api/logs'
  sseUrl.value = config.sseUrl.value
  baseUrl.value = config.baseUrl.value
  config.save()
}

function onSseUrlChange(): void {
  config.sseUrl.value = sseUrl.value.trim()
  sseUrl.value = config.sseUrl.value
  config.save()
}
</script>

<template>
  <Teleport to="body">
    <template v-if="visible">
      <div class="overlay" @click="$emit('close')"></div>
      <div
        class="modal settings-modal"
        role="dialog"
        aria-modal="true"
        aria-label="数据源设置"
      >
        <div class="modal-head">
          <h3>数 据 源 设 置</h3>
          <span class="sp"></span>
          <button class="modal-close" aria-label="关闭" @click="$emit('close')">✕</button>
        </div>
        <div class="modal-body">
          <div class="field">
            <label>数据模式</label>
            <div class="seg">
              <button
                :class="{ active: config.mode.value === 'mock' }"
                @click="setMode('mock')"
              >模拟数据（演示）</button>
              <button
                :class="{ active: config.mode.value === 'real' }"
                @click="setMode('real')"
              >真实接口（中控）</button>
            </div>
          </div>

          <div class="field">
            <label>设备中控 Base URL（CatDevicePlatform）</label>
            <input
              v-model="baseUrl"
              type="text"
              spellcheck="false"
              @change="onBaseUrlChange"
            />
          </div>

          <div class="field">
            <label>实时日志 SSE 地址</label>
            <input
              v-model="sseUrl"
              type="text"
              spellcheck="false"
              @change="onSseUrlChange"
            />
          </div>

          <div class="warn-box">
            真实接口注意：① 中控需允许浏览器跨域（CORS）；② 截图接口
            <code>GET /api/v1/devices/&#123;id&#125;/screenshot</code>
            返回 PNG，<code>444</code> 表示在线暂无图像；③
            <b>SSE 严禁经过未开启流式（StreamBody/ImmediateHeaderFlush）的反向代理</b>
            ——否则会被缓冲到 EOF 才转发，前端 8 秒收不到一条，请直连后端地址。
          </div>
        </div>
      </div>
    </template>
  </Teleport>
</template>

<style scoped lang="scss">
$font-mono: 'SFMono-Regular', 'JetBrains Mono', Consolas, 'Courier New', monospace;
$line-strong: rgba(92, 168, 255, 0.42);

.overlay {
  position: fixed;
  inset: 0;
  z-index: 50;
  background: rgba(3, 7, 14, 0.72);
  backdrop-filter: blur(0.03rem);
  animation: fade-in 0.2s ease-out;
}

@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes modal-in {
  from {
    opacity: 0;
    transform: translate(-50%, -48%) scale(0.97);
  }
  to {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
}

.modal {
  position: fixed;
  z-index: 51;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  max-width: 94vw;
  max-height: 88vh;
  background: linear-gradient(180deg, #0d1a2e, #0a1322);
  border: 0.01rem solid $line-strong;
  box-shadow: 0 0.24rem 0.8rem rgba(0, 0, 0, 0.6), 0 0 0.4rem rgba(56, 225, 255, 0.08);
  animation: modal-in 0.2s ease-out;
}

.modal::before,
.modal::after {
  content: '';
  position: absolute;
  width: 0.16rem;
  height: 0.16rem;
}

.modal::before {
  left: -0.01rem;
  top: -0.01rem;
  border-left: 0.02rem solid $cyan;
  border-top: 0.02rem solid $cyan;
}

.modal::after {
  right: -0.01rem;
  bottom: -0.01rem;
  border-right: 0.02rem solid $cyan;
  border-bottom: 0.02rem solid $cyan;
}

.modal-head {
  flex: 0 0 0.52rem;
  height: 0.52rem;
  display: flex;
  align-items: center;
  gap: 0.12rem;
  padding: 0 0.18rem;
  border-bottom: 0.01rem solid $bg-line;
  background: linear-gradient(90deg, rgba(56, 225, 255, 0.12), transparent 65%);
}

.modal-head h3 {
  margin: 0;
  font-size: 0.17rem;
  font-weight: 700;
  letter-spacing: 0.02rem;
  color: $tx-1;
}

.modal-head .sp {
  flex: 1;
}

.modal-close {
  width: 0.3rem;
  height: 0.3rem;
  border: 0.01rem solid $bg-line;
  background: transparent;
  color: $tx-2;
  cursor: pointer;
  border-radius: 0.02rem;
  font-size: 0.16rem;
  line-height: 1;
  padding: 0;
}

.modal-close:hover {
  color: $red;
  border-color: $red;
}

.modal-body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 0.16rem 0.18rem;
}

.settings-modal {
  width: 5.6rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.07rem;
  margin-bottom: 0.16rem;
}

.field > label {
  font-size: 0.12rem;
  color: $tx-2;
  letter-spacing: 0.01rem;
}

.field input[type='text'] {
  height: 0.38rem;
  background: #07101e;
  border: 0.01rem solid $bg-line;
  color: $tx-1;
  padding: 0 0.12rem;
  font-family: $font-mono;
  font-size: 0.13rem;
  border-radius: 0.02rem;
  outline: none;
}

.field input[type='text']:focus {
  border-color: $cyan;
}

.seg {
  display: flex;
  border: 0.01rem solid $bg-line;
  border-radius: 0.02rem;
  overflow: hidden;
  width: fit-content;
}

.seg button {
  height: 0.36rem;
  padding: 0 0.22rem;
  background: transparent;
  border: none;
  color: $tx-2;
  cursor: pointer;
  font-size: 0.13rem;
  letter-spacing: 0.01rem;
}

.seg button.active {
  background: rgba(56, 225, 255, 0.16);
  color: $cyan;
}

.warn-box {
  border: 0.01rem solid rgba(255, 176, 32, 0.4);
  background: rgba(255, 176, 32, 0.14);
  padding: 0.1rem 0.12rem;
  font-size: 0.115rem;
  color: #ffd08a;
  line-height: 1.8;
}

.warn-box code {
  font-family: $font-mono;
  color: $amber;
}

.warn-box b {
  color: $amber;
}
</style>
