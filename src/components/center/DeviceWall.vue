<script setup lang="ts">
/* ============================================================
 * DeviceWall.vue · 中区 · 设备准实时画面墙
 *  数据：getDevices(baseUrl) 增量轮询 + /frame 帧槽直链（shot_at 变化才换 src）
 *  卡片：thumbwrap 机身框（刘海 + 手势条 + 金属渐变边框，9:19.5 比例）
 *  轮播：5 台可见 + prev/next 翻页过渡
 *  参考原型：index.html L137-143（设备集群视图）
 * ============================================================ */
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue';
import { config } from '@/config';
import { getDevices, getFrameUrl } from '@/api/devices';
import type { Device as ApiDevice } from '@/api/types';

/** 卡片视图模型（对齐 GET /api/v1/devices 字段，驼峰化） */
interface CardView {
  deviceId: string;
  type: string; // 'real_device' | 'emulator'
  osVersion: string;
  model: string;
  battery: number;
  screenW: number;
  screenH: number;
  lastSeen: number; // unix 秒，心跳时间
  shotAt: number; // 帧时间戳，增量刷新判定
  online: boolean;
}

const cards = ref<CardView[]>([]);
const shots = reactive<Record<string, string>>({});
const refreshing = reactive<Record<string, boolean>>({});
const kpiOnline = ref(0);
const kpiSplit = ref('0 / 0');
const previewDevice = ref<string | null>(null);
const selectedDeviceIndex = ref(0);
const carouselStart = ref(0);
const transitionName = ref('phone-next');
const maxVisibleDevices = 5;

/** 抽屉当前预览设备视图模型（由 previewDevice 派生，供标题/标签/规格渲染） */
const previewCard = computed<CardView | null>(() => {
  const id = previewDevice.value;
  if (!id) return null;
  return cards.value.find((c) => c.deviceId === id) ?? null;
});

let realTimer: ReturnType<typeof setInterval> | null = null;
let realPolling = false;

function num(v: unknown, def = 0): number {
  return typeof v === 'number' && !Number.isNaN(v) ? v : def;
}

function fromReal(d: ApiDevice): CardView {
  return {
    deviceId: String(d.device_id ?? '—'),
    type: String(d.device_type ?? 'real_device'),
    osVersion: String(d.os_version ?? ''),
    model: String(d.model ?? ''),
    battery: d.battery_level != null ? Number(d.battery_level) : 100,
    screenW: num(d.screen_width),
    screenH: num(d.screen_height),
    lastSeen: num(d.last_seen),
    shotAt: num(d.shot_at),
    online: d.is_online !== false,
  };
}

function refreshSummary(): void {
  const online = cards.value.filter((c) => c.online).length;
  const real = cards.value.filter((c) => c.type !== 'emulator').length;
  const emu = cards.value.length - real;
  kpiOnline.value = online;
  kpiSplit.value = real + ' / ' + emu;
}

/** 新帧赋值：换 src 并进入 pending（透明闪烁），直到 img load/error */
function setShot(id: string, url: string): void {
  shots[id] = url;
  refreshing[id] = true;
}

function onShotLoad(id: string): void {
  refreshing[id] = false;
}

/** 加载失败（无帧/非图片响应）：回退「暂无画面」占位，下一个新帧自动重试 */
function onShotError(id: string): void {
  refreshing[id] = false;
  delete shots[id];
}

function selectDevice(index: number): void {
  if (!cards.value.length) return;
  const total = cards.value.length;
  selectedDeviceIndex.value = (index + total) % total;
  if (total <= maxVisibleDevices) {
    carouselStart.value = 0;
    return;
  }
  const maxStart = total - maxVisibleDevices;
  const preferredStart = selectedDeviceIndex.value - Math.floor(maxVisibleDevices / 2);
  carouselStart.value = Math.min(Math.max(0, preferredStart), maxStart);
}

function moveDevice(step: number): void {
  const total = cards.value.length;
  if (total <= 1) return;

  transitionName.value = step > 0 ? 'phone-next' : 'phone-prev';

  // 设备数 ≤ 可见数：全部可见，只移动选中高亮
  if (total <= maxVisibleDevices) {
    selectedDeviceIndex.value = (selectedDeviceIndex.value + step + total) % total;
    return;
  }

  // 整页翻转：每次推进 maxVisibleDevices 步
  const maxStart = total - maxVisibleDevices;
  let newStart = carouselStart.value + step * maxVisibleDevices;

  if (newStart > maxStart) newStart = maxStart;
  if (newStart < 0) newStart = 0;

  // 到边界未移动 → 循环回绕
  if (newStart === carouselStart.value) {
    newStart = step > 0 ? 0 : maxStart;
  }

  carouselStart.value = newStart;
  selectedDeviceIndex.value = newStart;
}

async function startReal(): Promise<void> {
  try {
    const list = await getDevices(config.baseUrl.value);
    cards.value = list.map(fromReal);
    if (cards.value.length) selectDevice(0);
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

/**
 * 增量轮询：每轮重拉 /devices，patch 既有卡片字段、追加新设备、移除离线设备；
 * 仅当某设备 shot_at 变化才换 /frame 直链 src（浏览器按帧缓存，不重复下载）。
 */
async function pollRealShots(): Promise<void> {
  if (realPolling) return;
  realPolling = true;
  try {
    let list: ApiDevice[];
    try {
      list = await getDevices(config.baseUrl.value);
    } catch (e) {
      console.warn('[DeviceWall] 设备列表轮询失败', e);
      return;
    }

    const next = list.map(fromReal);
    const oldMap = new Map(cards.value.map((c) => [c.deviceId, c]));
    // patch：保留旧 shotAt（用于变化检测），其它字段更新
    cards.value = next.map((n) => {
      const old = oldMap.get(n.deviceId);
      return old ? { ...n, shotAt: old.shotAt } : n;
    });
    if (cards.value.length && selectedDeviceIndex.value >= cards.value.length) {
      selectDevice(0);
    }
    refreshSummary();

    for (const c of cards.value) {
      const fresh = next.find((x) => x.deviceId === c.deviceId);
      const sa = fresh ? fresh.shotAt : 0;
      setShot(c.deviceId, getFrameUrl(config.baseUrl.value, c.deviceId, sa));
    }
  } finally {
    realPolling = false;
  }
}

function stop(): void {
  if (realTimer) {
    clearInterval(realTimer);
    realTimer = null;
  }
  realPolling = false;
}

const isEmu = (t: string) => t === 'emulator';
const hasShot = (id: string) => !!shots[id];
const tagClass = (d: CardView) => (d.online ? (isEmu(d.type) ? 'emu' : 'real') : 'off');
const tagLabel = (d: CardView) => (d.online ? (isEmu(d.type) ? '虚拟机' : '真机') : '离线');
const hbTime = (ts: number) => (ts ? new Date(ts * 1000).toLocaleTimeString() : '—');

const visibleCards = () => {
  if (!cards.value.length) return [] as CardView[];
  const total = cards.value.length;
  if (total <= maxVisibleDevices) return cards.value.slice();
  return cards.value.slice(carouselStart.value, carouselStart.value + maxVisibleDevices);
};

function openLightbox(id: string): void {
  previewDevice.value = id;
}

function closeLightbox(): void {
  previewDevice.value = null;
}

onMounted(() => {
  void startReal();
});

onBeforeUnmount(stop);
</script>

<template>
  <div class="device-wall">
    <div class="kpis">
      <div class="kpi">
        <div class="l">在线设备</div>
        <div class="v b">{{ kpiOnline || '–' }}</div>
      </div>
      <div class="kpi">
        <div class="l">真机 / 虚拟机</div>
        <div class="v">{{ kpiSplit || '–' }}</div>
      </div>
    </div>

    <div v-if="!cards.length" class="device-empty">等待设备数据…</div>
    <div v-else class="device-carousel">
      <button
        v-if="cards.length > 1"
        class="carousel-btn prev"
        aria-label="上一批设备"
        @click="moveDevice(-1)"
      >
        ‹
      </button>

      <TransitionGroup
        :name="transitionName"
        tag="div"
        class="visible-grid"
        :style="{ gridTemplateColumns: `repeat(${Math.min(cards.length, maxVisibleDevices)}, minmax(0, 1fr))` }"
      >
        <div v-for="d in visibleCards()" :key="d.deviceId" class="card">
          <div
            class="thumbwrap"
            :class="{
              active: d.deviceId === cards[selectedDeviceIndex]?.deviceId,
              refreshing: refreshing[d.deviceId],
            }"
            @click="openLightbox(d.deviceId)"
          >
            <img
              v-if="hasShot(d.deviceId)"
              class="thumb"
              :class="{ pending: refreshing[d.deviceId] }"
              :src="shots[d.deviceId]"
              alt=""
              @load="onShotLoad(d.deviceId)"
              @error="onShotError(d.deviceId)"
            />
            <div v-else class="ph">暂无画面</div>
            <div class="flicker"></div>
          </div>
          <div class="meta">
            <div class="id">
              <span class="j-did">{{ d.deviceId }}</span>
              <span class="tag" :class="tagClass(d)">{{ tagLabel(d) }}</span>
            </div>
            <div class="row">
              <span class="j-spec">{{ d.osVersion }} · {{ d.model }}</span>
              <span class="j-batt">🔋{{ d.battery }}%</span>
            </div>
            <div class="row">
              <span class="j-res">{{ d.screenW }}×{{ d.screenH }}</span>
              <span class="j-hb">心跳 {{ hbTime(d.lastSeen) }}</span>
            </div>
          </div>
        </div>
      </TransitionGroup>

      <button
        v-if="cards.length > 1"
        class="carousel-btn next"
        aria-label="下一批设备"
        @click="moveDevice(1)"
      >
        ›
      </button>
    </div>
  </div>

  <Teleport to="body">
    <Transition name="drawer-slide">
      <aside v-if="previewDevice" class="device-drawer">
        <button class="drawer-close" aria-label="关闭" @click="closeLightbox()">✕</button>
        <h2 class="drawer-title">{{ previewDevice }}</h2>
        <div v-if="previewCard" class="drawer-sub">
          <span class="tag" :class="tagClass(previewCard)">{{ tagLabel(previewCard) }}</span>
          <span>{{ previewCard.osVersion }} · {{ previewCard.model }}</span>
          <span>🔋{{ previewCard.battery }}%</span>
          <span>{{ previewCard.screenW }}×{{ previewCard.screenH }}</span>
        </div>
        <div class="drawer-shotwrap" :class="{ ph: !hasShot(previewDevice) }">
          <img
            v-if="hasShot(previewDevice)"
            :src="shots[previewDevice]"
            :alt="`${previewDevice} 截图预览`"
            @load="onShotLoad(previewDevice)"
            @error="onShotError(previewDevice)"
          />
          <div v-else class="drawer-shotph">暂无画面</div>
        </div>
      </aside>
    </Transition>
  </Teleport>
</template>

<style lang="scss" scoped>
.device-wall {
  position: relative;
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 0.1rem 0.12rem;
  overflow: hidden;
}

/* ---- KPI 条（对齐 index.html .kpis） ---- */
.kpis {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.1rem;
  margin-bottom: 0.1rem;
  flex: 0 0 auto;
}

.kpi {
  background: rgba(12, 22, 40, 0.72);
  border: 0.01rem solid $bg-line;
  border-radius: 0.06rem;
  padding: 0.08rem 0.12rem;

  .l {
    color: $tx-3;
    font-size: 0.1rem;
  }

  .v {
    font-size: 0.2rem;
    font-weight: 700;
    margin-top: 0.02rem;
    color: $tx-1;
  }

  .v.b {
    color: $cyan;
  }
}

/* ---- 轮播容器 ---- */
.device-carousel {
  position: relative;
  flex: 1;
  min-height: 0;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 0.38rem;
}

.visible-grid {
  position: relative;
  display: grid;
  width: 100%;
  height: 100%;
  gap: 0.08rem;
  align-items: stretch;
}

.device-empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: $tx-3;
  font-size: 0.12rem;
}

/* ---- 卡片（机身框 thumbwrap + meta） ---- */
.card {
  display: flex;
  flex-direction: column;
  min-height: 0;
  min-width: 0;
  width: 100%;
  max-width: 2.4rem;
  height: 100%;
  margin: 0 auto;
  cursor: pointer;
  transition: transform 0.15s ease;

  &:hover {
    transform: translateY(-0.03rem);
  }
}

.thumbwrap {
  position: relative;
  flex: 1;
  min-height: 1.8rem;
  padding: 0.05rem;
  border-radius: 0.16rem;
  border: 0.01rem solid #3a465a;
  background: linear-gradient(160deg, #2b3646, #182030);
  box-shadow: 0 0.08rem 0.2rem rgba(0, 0, 0, 0.45), inset 0 0 0 0.03rem rgba(0, 0, 0, 0.5);
  overflow: hidden;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;

  .card:hover &,
  &.active {
    border-color: $cyan;
    box-shadow: 0 0 0 0.02rem rgba(56, 225, 255, 0.55), 0 0 0.16rem rgba(56, 225, 255, 0.25),
      0 0.08rem 0.2rem rgba(0, 0, 0, 0.45), inset 0 0 0 0.03rem rgba(0, 0, 0, 0.5);
  }

  /* 顶部刘海（听筒/前摄） */
  &::after {
    content: '';
    position: absolute;
    top: 0.06rem;
    left: 50%;
    transform: translateX(-50%);
    width: 0.22rem;
    height: 0.03rem;
    border-radius: 0.03rem;
    background: #05080d;
    opacity: 0.85;
    z-index: 2;
  }

  /* 底部手势条（全面屏导航条） */
  &::before {
    content: '';
    position: absolute;
    bottom: 0.06rem;
    left: 50%;
    transform: translateX(-50%);
    width: 0.3rem;
    height: 0.025rem;
    border-radius: 0.02rem;
    background: rgba(255, 255, 255, 0.7);
    z-index: 2;
  }

  &.refreshing .flicker {
    animation: flick 0.45s ease-out;
  }
}

.thumb {
  width: 100%;
  height: 100%;
  aspect-ratio: 9 / 19.5;
  object-fit: cover;
  object-position: top;
  display: block;
  border-radius: 0.1rem;
  background: #05080d;
  opacity: 1;
  transition: opacity 0.16s ease;

  &.pending {
    opacity: 0.55;
  }
}

.ph {
  position: absolute;
  inset: 0.05rem;
  border-radius: 0.1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #05080d;
  color: $tx-3;
  font-size: 0.1rem;
  text-align: center;
}

.flicker {
  position: absolute;
  inset: 0.05rem;
  border-radius: 0.1rem;
  background: #fff;
  opacity: 0;
  pointer-events: none;
}

@keyframes flick {
  0% {
    opacity: 0.18;
  }
  100% {
    opacity: 0;
  }
}

/* ---- 卡片 meta ---- */
.meta {
  flex: 0 0 auto;
  padding-top: 0.06rem;
  display: flex;
  flex-direction: column;
  gap: 0.02rem;

  .id {
    font-weight: 600;
    font-size: 0.11rem;
    color: $tx-1;
    display: flex;
    align-items: center;
    gap: 0.05rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    color: $tx-3;
    font-size: 0.095rem;
    margin-top: 0.02rem;
  }
}

.tag {
  display: inline-flex;
  align-items: center;
  padding: 0 0.06rem;
  height: 0.16rem;
  font-size: 0.095rem;
  border-radius: 0.03rem;
  letter-spacing: 0.5px;
  white-space: nowrap;

  &.real {
    background: $green-dim;
    color: $green;
  }

  &.emu {
    background: $amber-dim;
    color: $amber;
  }

  &.off {
    background: $red-dim;
    color: $red;
  }
}

/* ---- 轮播按钮 ---- */
.carousel-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 0.28rem;
  height: 0.5rem;
  border: 0.01rem solid rgba(128, 170, 230, 0.45);
  background: rgba(5, 15, 25, 0.8);
  color: $tx-1;
  font-size: 0.28rem;
  cursor: pointer;
  z-index: 5;

  &.prev {
    left: 0.04rem;
  }

  &.next {
    right: 0.04rem;
  }
}

/* ---- 轮播切换过渡（TransitionGroup 驱动 · 方向感知） ---- */
.phone-next-enter-active,
.phone-next-leave-active,
.phone-next-move,
.phone-prev-enter-active,
.phone-prev-leave-active,
.phone-prev-move {
  transition: transform 0.42s cubic-bezier(0.22, 0.61, 0.36, 1), opacity 0.42s ease;
}

.phone-next-leave-active,
.phone-prev-leave-active {
  position: absolute;
  width: calc(100% - 0.08rem);
}

.phone-next-enter-from {
  opacity: 0;
  transform: translateX(0.35rem) scale(0.96);
}

.phone-next-leave-to {
  opacity: 0;
  transform: translateX(-0.35rem) scale(0.96);
}

.phone-prev-enter-from {
  opacity: 0;
  transform: translateX(-0.35rem) scale(0.96);
}

.phone-prev-leave-to {
  opacity: 0;
  transform: translateX(0.35rem) scale(0.96);
}

/* ---- 右侧详情抽屉（无遮罩） ---- */
.device-drawer {
  position: fixed;
  top: 0;
  right: 0;
  width: 5.6rem;
  height: 100vh;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  padding: 0.2rem;
  background: $bg-panel-2;
  border-left: 0.01rem solid $bg-line;
  box-shadow: -0.18rem 0 0.5rem rgba(0, 0, 0, 0.45);
  overflow: auto;
}

.drawer-close {
  position: absolute;
  top: 0.08rem;
  right: 0.08rem;
  z-index: 2;
  width: 0.28rem;
  height: 0.28rem;
  border: 0.01rem solid rgba(160, 190, 220, 0.4);
  background: rgba(2, 18, 30, 1);
  color: $tx-1;
  cursor: pointer;
}

.drawer-title {
  font-size: 0.16rem;
  font-weight: 700;
  color: $tx-1;
  margin: 0 0 0.04rem;
}

.drawer-sub {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.06rem;
  color: $tx-3;
  font-size: 0.12rem;
  margin-bottom: 0.14rem;
}

.drawer-shotwrap {
  position: relative;
  border: 0.01rem solid rgba(120, 170, 230, 0.24);
  border-radius: 0.08rem;
  background: #05080d;
  overflow: auto;

  img {
    display: block;
    width: 100%;
    object-fit: cover;
  }

  &.ph .drawer-shotph {
    display: flex;
  }
}

.drawer-shotph {
  display: none;
  align-items: center;
  justify-content: center;
  min-height: 3.5rem;
  color: $tx-3;
  font-size: 0.12rem;
  text-align: center;
  padding: 0.16rem;
}

/* ---- 抽屉滑入/滑出过渡 ---- */
.drawer-slide-enter-active,
.drawer-slide-leave-active {
  transition: transform 0.22s ease;
}

.drawer-slide-enter-from,
.drawer-slide-leave-to {
  transform: translateX(100%);
}
</style>
