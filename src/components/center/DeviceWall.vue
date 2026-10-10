<script setup lang="ts">
/* ============================================================
 * DeviceWall.vue · 中区 · 6 台设备准实时画面墙
 *  mock 模式：从 data.DEVICES 读列表 + shots 轮播
 *  real 模式：getDevices(baseUrl) + getScreenshot 轮询
 *  每台卡片：phone-frame + screen + meta（型号/电池/当前App）
 *  flicker 动画（截图刷新时）
 * ============================================================ */
import { onBeforeUnmount, onMounted, reactive, ref } from 'vue';
import { config } from '@/config';
import { data } from '@/mock/data';
import type { Device as MockDevice } from '@/types/data';
import { getDevices, getScreenshot } from '@/api/devices';
import type { Device as ApiDevice } from '@/api/types';

/** 卡片视图模型（统一 mock 驼峰与 real 下划线两种字段命名） */
interface CardView {
  deviceId: string;
  adbSerial: string;
  type: string;
  model: string;
  battery: number;
  currentApp: string;
  shots: string[];
  online: boolean;
}

const cards = ref<CardView[]>([]);
const shots = reactive<Record<string, string>>({});
const refreshing = reactive<Record<string, boolean>>({});
const summary = ref('真机 0 · 模拟器 0');

let mockTimer: ReturnType<typeof setInterval> | null = null;
let realTimer: ReturnType<typeof setInterval> | null = null;
let realPolling = false;
const mockIdx: Record<string, number> = {};
const blobUrls = new Set<string>();

function fromMock(d: MockDevice): CardView {
  return {
    deviceId: d.deviceId,
    adbSerial: d.adbSerial,
    type: d.type,
    model: d.model,
    battery: d.battery,
    currentApp: d.currentApp,
    shots: d.shots.slice(),
    online: true,
  };
}

function fromReal(d: ApiDevice): CardView {
  const shotList = Array.isArray(d.shots) ? (d.shots as string[]) : [];
  return {
    deviceId: String(d.device_id ?? '—'),
    adbSerial: String(d.adb_serial ?? '—'),
    type: String(d.device_type ?? 'real_device'),
    model: String(d.model ?? ''),
    battery: d.battery_level != null ? Number(d.battery_level) : 100,
    currentApp: String(d.currentApp ?? ''),
    shots: shotList,
    online: d.is_online !== false,
  };
}

function refreshSummary(): void {
  let real = 0;
  let emu = 0;
  cards.value.forEach((c) => {
    if (c.type === 'emulator') emu++;
    else real++;
  });
  summary.value = '真机 ' + real + ' · 模拟器 ' + emu;
}

function triggerFlicker(id: string): void {
  refreshing[id] = true;
  window.setTimeout(() => {
    refreshing[id] = false;
  }, 450);
}

function setShot(id: string, url: string | null): void {
  const old = shots[id];
  if (old && blobUrls.has(old)) {
    URL.revokeObjectURL(old);
    blobUrls.delete(old);
  }
  if (url) {
    if (/^blob:/.test(url)) blobUrls.add(url);
    shots[id] = url;
    triggerFlicker(id);
  } else {
    delete shots[id];
  }
}

function tickMockShots(): void {
  cards.value.forEach((c) => {
    if (!c.shots.length) return;
    const idx = (mockIdx[c.deviceId] ?? 0) % c.shots.length;
    mockIdx[c.deviceId] = idx + 1;
    setShot(c.deviceId, c.shots[idx]);
  });
}

function startMock(): void {
  cards.value = data.DEVICES.map(fromMock);
  refreshSummary();
  tickMockShots();
  mockTimer = setInterval(tickMockShots, config.screenshotInterval);
}

async function startReal(): Promise<void> {
  try {
    const list = await getDevices(config.baseUrl.value);
    cards.value = list.map(fromReal);
    refreshSummary();
  } catch (e) {
    console.warn('[DeviceWall] 设备列表获取失败', e);
    cards.value = [];
    refreshSummary();
    return;
  }
  await pollRealShots();
  realTimer = setInterval(() => {
    void pollRealShots();
  }, config.screenshotInterval);
}

async function pollRealShots(): Promise<void> {
  if (realPolling) return;
  realPolling = true;
  try {
    await Promise.all(
      cards.value.map(async (c) => {
        try {
          const url = await getScreenshot(config.baseUrl.value, c.deviceId);
          setShot(c.deviceId, url);
        } catch (e) {
          console.warn('[DeviceWall] 截图获取失败 ' + c.deviceId, e);
        }
      }),
    );
  } finally {
    realPolling = false;
  }
}

function stop(): void {
  if (mockTimer) {
    clearInterval(mockTimer);
    mockTimer = null;
  }
  if (realTimer) {
    clearInterval(realTimer);
    realTimer = null;
  }
  realPolling = false;
  blobUrls.forEach((u) => URL.revokeObjectURL(u));
  blobUrls.clear();
}

const isEmu = (t: string) => t === 'emulator';
const batteryPct = (b: number) => Math.min(100, b || 100) + '%';
const batteryLow = (b: number) => (b || 100) < 30;
const hasShot = (id: string) => !!shots[id];

onMounted(() => {
  if (config.mode.value === 'real') {
    void startReal();
  } else {
    startMock();
  }
});

onBeforeUnmount(stop);
</script>

<template>
  <div class="device-wall">
    <div v-for="d in cards" :key="d.deviceId" class="phone">
      <div class="phone-frame">
        <div class="phone-screen" :class="{ refreshing: refreshing[d.deviceId] }">
          <img v-if="hasShot(d.deviceId)" :src="shots[d.deviceId]" alt="" />
          <div class="flicker"></div>
          <div v-if="!hasShot(d.deviceId)" class="phone-placeholder">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6">
              <rect x="6" y="2" width="12" height="20" rx="2" />
              <line x1="11" y1="18" x2="13" y2="18" />
            </svg>
            <span class="ph-text">在线暂无画面<br />HTTP 444 · 等待 Agent 推送</span>
          </div>
          <div class="phone-live"><i></i>LIVE</div>
          <div class="phone-apptag">{{ d.currentApp || '等待装机…' }}</div>
        </div>
      </div>
      <div class="phone-meta">
        <div class="pm1">
          <span class="tag" :class="isEmu(d.type) ? 'tag-info' : 'tag-a'">
            {{ isEmu(d.type) ? '模拟器' : '真机' }}
          </span>{{ d.model }}
        </div>
        <div class="pm2">
          <span>{{ d.adbSerial }}</span>
          <span class="sp"></span>
          <span class="batt" :class="{ low: batteryLow(d.battery) }">
            <i><b :style="{ width: batteryPct(d.battery) }"></b></i>
            {{ d.battery != null ? d.battery + '%' : '—' }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.device-wall {
  height: 100%;
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 0.1rem;
  padding: 0.1rem 0.12rem;
  overflow: hidden;
}

.phone {
  display: flex;
  flex-direction: column;
  min-height: 0;
  min-width: 0;
}

.phone-frame {
  position: relative;
  flex: 1;
  min-height: 0;
  border: 0.01rem solid rgba(120, 170, 230, 0.35);
  border-radius: 0.1rem;
  background: #02050b;
  overflow: hidden;
  box-shadow: inset 0 0 0 0.03rem #0a1322, 0 0 0.14rem rgba(20, 60, 110, 0.45);

  &::before {
    content: '';
    position: absolute;
    top: 0.04rem;
    left: 50%;
    transform: translateX(-50%);
    width: 0.22rem;
    height: 0.03rem;
    border-radius: 0.03rem;
    background: #26344a;
    z-index: 4;
  }
}

.phone-screen {
  position: absolute;
  inset: 0.1rem 0.04rem 0.04rem;
  overflow: hidden;
  border-radius: 0.02rem;
  background: #0a1018;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: top;
    display: block;
  }

  .flicker {
    position: absolute;
    inset: 0;
    background: #fff;
    opacity: 0;
    pointer-events: none;
  }

  &.refreshing .flicker {
    animation: flick 0.45s ease-out;
  }
}

@keyframes flick {
  0% {
    opacity: 0.18;
  }
  100% {
    opacity: 0;
  }
}

.phone-placeholder {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.08rem;
  color: $tx-3;
  font-size: 0.1rem;
  text-align: center;
  padding: 0.08rem;

  svg {
    width: 0.26rem;
    height: 0.26rem;
    opacity: 0.5;
  }
}

.phone-live {
  position: absolute;
  top: 0.14rem;
  left: 0.08rem;
  z-index: 3;
  display: flex;
  align-items: center;
  gap: 0.04rem;
  font-size: 0.09rem;
  background: rgba(0, 0, 0, 0.55);
  color: $green;
  padding: 0.02rem 0.05rem;
  border-radius: 0.02rem;

  i {
    width: 0.05rem;
    height: 0.05rem;
    border-radius: 50%;
    background: $red;
    animation: lampPulse 1s infinite;
  }
}

.phone-apptag {
  position: absolute;
  bottom: 0.06rem;
  left: 0.06rem;
  right: 0.06rem;
  z-index: 3;
  font-size: 0.095rem;
  color: $tx-1;
  background: rgba(4, 10, 20, 0.72);
  padding: 0.03rem 0.06rem;
  border-left: 0.02rem solid $red;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.phone-meta {
  flex: 0 0 0.44rem;
  padding-top: 0.06rem;
  display: flex;
  flex-direction: column;
  gap: 0.02rem;

  .pm1 {
    display: flex;
    align-items: center;
    gap: 0.05rem;
    font-size: 0.11rem;
    font-weight: 700;
    color: $tx-1;
    white-space: nowrap;
    overflow: hidden;
  }

  .pm2 {
    display: flex;
    align-items: center;
    gap: 0.06rem;
    font-size: 0.095rem;
    color: $tx-3;
  }

  .sp {
    flex: 1;
  }
}

.tag {
  display: inline-flex;
  align-items: center;
  height: 0.18rem;
  padding: 0 0.06rem;
  font-size: 0.105rem;
  border-radius: 0.02rem;
  letter-spacing: 0.5px;
  white-space: nowrap;
}

.tag-a {
  background: $cyan-dim;
  color: $cyan;
  border: 0.01rem solid rgba(56, 225, 255, 0.4);
}

.tag-info {
  background: rgba(108, 132, 163, 0.14);
  color: #a9bfd9;
  border: 0.01rem solid rgba(108, 132, 163, 0.32);
}

.batt {
  display: inline-flex;
  align-items: center;
  gap: 0.03rem;

  i {
    width: 0.12rem;
    height: 0.07rem;
    border: 0.01rem solid $tx-3;
    border-radius: 0.01rem;
    position: relative;
    display: inline-block;

    b {
      position: absolute;
      left: 0.01rem;
      top: 0.01rem;
      bottom: 0.01rem;
      background: $green;
      border-radius: 0.01rem;
    }

    &::before {
      content: '';
      position: absolute;
      right: -0.03rem;
      top: 0.02rem;
      width: 0.02rem;
      height: 0.03rem;
      background: $tx-3;
    }
  }

  &.low i b {
    background: $red;
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
