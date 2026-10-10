<script setup lang="ts">
// 反诈大屏 · 左区 · APK 实时下载流
// 状态机：校验(750ms) → 已入库(500ms) → 推送装机(停留)
// completeDownload：bumpDl(总数) + bumpSource(按源, emit) + bumpApps(新增App, bus)
// 悬停暂停：mouseenter/leave，缓冲队列；启动 stream.downloads.start
import { onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { bus } from '@/config'
import { data } from '@/mock/data'
import { stream } from '@/mock/stream'
import type { DownloadEvent, SourceKind } from '@/types/data'
import { fmt } from '@/utils/format'

const emit = defineEmits<{
  (e: 'bump-source', src: SourceKind): void
  (e: 'distinct-app', count: number): void
}>()

interface StreamRow {
  uid: number
  ev: DownloadEvent
  stageIdx: number
}

const STAGES = [
  { key: 'st-verify', text: 'MD5校验·指纹聚类', dur: 750 },
  { key: 'st-stored', text: '已入库', dur: 500 },
  { key: 'st-push', text: '推送装机', dur: -1 },
] as const

const MAX_ROWS = 22
const DL_MS_MIN = 1600
const DL_MS_MAX = 2800

const rows = ref<StreamRow[]>([])
const dlCount = ref(data.V4.todayDownloads)
const appCount = ref(data.V4.distinctMainstream)

let hovering = false
const buffer: DownloadEvent[] = []
const stageTimers = new Map<number, ReturnType<typeof setTimeout>>()
const pendingTimers = new Map<number, ReturnType<typeof setTimeout>>()

function setStage(row: StreamRow, idx: number): void {
  row.stageIdx = idx
  const stage = STAGES[idx]
  if (stage.key === 'st-push') {
    clearStageTimer(row.uid)
    return
  }
  clearStageTimer(row.uid)
  const t = setTimeout(() => setStage(row, idx + 1), stage.dur)
  stageTimers.set(row.uid, t)
}

function clearStageTimer(uid: number): void {
  const t = stageTimers.get(uid)
  if (t) {
    clearTimeout(t)
    stageTimers.delete(uid)
  }
}

function clearPendingTimer(uid: number): void {
  const t = pendingTimers.get(uid)
  if (t) {
    clearTimeout(t)
    pendingTimers.delete(uid)
  }
}

function createRow(ev: DownloadEvent): void {
  const row: StreamRow = reactive({ uid: ev.uid, ev, stageIdx: 0 }) as StreamRow
  rows.value.unshift(row)
  setStage(row, 0)
  if (rows.value.length > MAX_ROWS) {
    const removed = rows.value.pop()
    if (removed) {
      clearStageTimer(removed.uid)
      clearPendingTimer(removed.uid)
    }
  }
}

function bumpDl(): void {
  dlCount.value++
}

function bumpApps(): void {
  appCount.value++
  bus.emit('distinct-app', appCount.value)
  emit('distinct-app', appCount.value)
}

function bumpSource(src: SourceKind): void {
  emit('bump-source', src)
}

function completeDownload(ev: DownloadEvent): void {
  if (hovering) {
    if (buffer.length < 30) buffer.push(ev)
    return
  }
  bumpDl()
  bumpSource(ev.source)
  if (ev.isNew) bumpApps()
  createRow(ev)
}

function addEvent(ev: DownloadEvent): void {
  const t = setTimeout(
    () => {
      pendingTimers.delete(ev.uid)
      completeDownload(ev)
    },
    DL_MS_MIN + Math.random() * (DL_MS_MAX - DL_MS_MIN),
  )
  pendingTimers.set(ev.uid, t)
}

function flushBuffer(): void {
  const items = buffer.splice(0)
  items.forEach((ev, i) => {
    setTimeout(() => completeDownload(ev), i * 120)
  })
}

function onMouseEnter(): void {
  hovering = true
}

function onMouseLeave(): void {
  hovering = false
  flushBuffer()
}

function stageClass(row: StreamRow): string {
  return STAGES[row.stageIdx].key
}

function stageText(row: StreamRow): string {
  return STAGES[row.stageIdx].text
}

function isPushStage(row: StreamRow): boolean {
  return STAGES[row.stageIdx].key === 'st-push'
}

onMounted(() => {
  stream.downloads.start({ onEvent: addEvent })
})

onBeforeUnmount(() => {
  stream.downloads.stop()
  stageTimers.forEach((t) => clearTimeout(t))
  stageTimers.clear()
  pendingTimers.forEach((t) => clearTimeout(t))
  pendingTimers.clear()
})
</script>

<template>
  <div class="panel grow stream-panel">
    <div class="panel-head">
      <span class="ph-bar"></span>
      <h3>APK 实 时 下 载 流</h3>
      <span class="ph-spacer"></span>
      <span class="lamp"><i></i>源头A SFTP</span>
      <span class="gap"></span>
      <span class="lamp amber"><i></i>源头B HOST爬取</span>
    </div>
    <div class="panel-body flush">
      <div class="stream">
        <div
          class="stream-scroll"
          @mouseenter="onMouseEnter"
          @mouseleave="onMouseLeave"
        >
          <div
            v-for="row in rows"
            :key="row.uid"
            class="dl-row"
          >
            <div class="dl-top">
              <span class="dl-name">{{ row.ev.app }}</span>
              <span
                :class="['tag', row.ev.source === 'A' ? 'tag-a' : 'tag-b']"
              >{{ row.ev.source === 'A' ? '源头A 成品库' : '源头B 爬取' }}</span>
              <span class="tag tag-cat">{{ row.ev.category }}</span>
              <span v-if="row.ev.isNew" class="dl-new">新增App</span>
              <span
                v-else-if="row.ev.variant"
                class="tag tag-info"
                title="体积指纹同簇，判定同款不同渠道（重签名新MD5）"
              >同款×渠道</span>
              <span class="sp"></span>
              <span :class="['dl-stage', stageClass(row)]">
                <i v-if="!isPushStage(row)"></i>{{ stageText(row) }}
              </span>
            </div>
            <div class="dl-pkg" :title="row.ev.pkg">{{ row.ev.pkg }}</div>
            <div class="dl-bot">
              <span>MD5 {{ fmt.md5Short(row.ev.md5) }}</span>
              <span>{{ row.ev.sizeMB.toFixed(1) }} MB</span>
              <span class="sp"></span>
              <span>{{ row.ev.time }}</span>
            </div>
          </div>
        </div>
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

.panel-head .ph-spacer {
  flex: 1;
}

.panel-head .gap {
  width: 0.1rem;
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

.stream {
  height: 100%;
  overflow: hidden;
  position: relative;
}

.stream-scroll {
  height: 100%;
  overflow-y: auto;
  padding: 0.08rem 0.1rem 0.08rem 0.08rem;
  display: flex;
  flex-direction: column;
  gap: 0.07rem;
}

.dl-row {
  border: 0.01rem solid $bg-line;
  background: rgba(16, 30, 54, 0.66);
  padding: 0.07rem 0.09rem;
  display: flex;
  flex-direction: column;
  gap: 0.05rem;
  animation: rowIn 0.45s ease-out;
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

.dl-top {
  display: flex;
  align-items: center;
  gap: 0.07rem;
}

.dl-name {
  font-size: 0.125rem;
  font-weight: 700;
  color: $tx-1;
}

.dl-new {
  font-size: 0.09rem;
  color: $red;
  border: 0.01rem solid rgba(255, 77, 94, 0.5);
  padding: 0 0.04rem;
  border-radius: 0.02rem;
}

.dl-top .sp {
  flex: 1;
}

.dl-stage {
  font-size: 0.1rem;
  font-family: 'SFMono-Regular', 'JetBrains Mono', Consolas, 'Courier New', monospace;
  display: inline-flex;
  align-items: center;
  gap: 0.04rem;
}

.st-verify {
  color: $cyan;
}

.st-stored {
  color: $green;
}

.st-push {
  color: $purple;
}

.dl-stage i {
  width: 0.05rem;
  height: 0.05rem;
  border-radius: 50%;
  background: currentColor;
  animation: lampPulse 1.2s infinite;
}

.dl-pkg {
  font-family: 'SFMono-Regular', 'JetBrains Mono', Consolas, 'Courier New', monospace;
  font-size: 0.1rem;
  color: $tx-3;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dl-bot {
  display: flex;
  align-items: center;
  gap: 0.08rem;
  font-family: 'SFMono-Regular', 'JetBrains Mono', Consolas, 'Courier New', monospace;
  font-size: 0.1rem;
  color: $tx-3;
}

.dl-bot .sp {
  flex: 1;
}

.tag {
  display: inline-flex;
  align-items: center;
  height: 0.18rem;
  padding: 0 0.06rem;
  font-size: 0.105rem;
  border-radius: 0.02rem;
  letter-spacing: 0.005rem;
  white-space: nowrap;
}

.tag-a {
  background: rgba(56, 225, 255, 0.16);
  color: $cyan;
  border: 0.01rem solid rgba(56, 225, 255, 0.4);
}

.tag-b {
  background: rgba(255, 176, 32, 0.14);
  color: $amber;
  border: 0.01rem solid rgba(255, 176, 32, 0.4);
}

.tag-cat {
  background: rgba(148, 178, 214, 0.12);
  color: #b9cdea;
  border: 0.01rem solid rgba(148, 178, 214, 0.3);
}

.tag-info {
  background: rgba(108, 132, 163, 0.14);
  color: #a9bfd9;
  border: 0.01rem solid rgba(108, 132, 163, 0.32);
}
</style>
