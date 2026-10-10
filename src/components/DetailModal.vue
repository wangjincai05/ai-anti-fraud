<script setup lang="ts">
// 反诈大屏 · 取证详情弹窗（三栏：APK 信息 / 中间取证图 / 转款码）
// 迁移自原型 detail-modal.js，px → rem（1rem=100px）
import { computed, ref, watch } from 'vue'
import { data } from '@/mock/data'
import type { CodeRecord, NamedImage } from '@/types/data'

const props = defineProps<{
  visible: boolean
  codeIdx: number
}>()

defineEmits<{
  (e: 'close'): void
}>()

const rec = computed<CodeRecord | undefined>(() => data.CODES[props.codeIdx])

const shotIdx = ref(0)
const codeTab = ref(0)

// 打开 / 切换记录时重置轮播与码图索引
watch(
  () => [props.visible, props.codeIdx] as const,
  () => {
    shotIdx.value = 0
    codeTab.value = 0
  },
)

const infoRows = computed(() => {
  const c = rec.value
  if (!c) return []
  const d = (v: string | null | undefined): string => (v === '' || v == null ? '—' : v)
  return [
    { label: '取证 ID', value: d(c.recId), mono: true },
    { label: '任务 ID', value: d(c.taskId), mono: true },
    { label: '应用名称', value: d(c.app) },
    { label: '包名', value: d(c.pkg), mono: true },
    { label: '安装包 MD5', value: d(c.md5), mono: true },
    { label: '案件类别', value: d(c.category) },
    { label: '取证设备', value: d(c.device), mono: true },
    { label: '对线对象', value: d(c.counterparty) },
    { label: '收款人', value: d(c.payee) },
    { label: '账号类型', value: d(c.codeType) },
    { label: '金额', value: d(c.amount) },
    { label: '支付渠道', value: d(c.channel) },
    { label: '账号 / 入口', value: d(c.url), mono: true },
    { label: '码指纹', value: d(c.fingerprint), mono: true },
    { label: '话术链路', value: d(c.flow) },
    { label: 'AI 末态回复', value: d(c.finalReply) },
    { label: '对线时间', value: d(c.time), mono: true },
  ]
})

const curShot = computed<NamedImage | null>(() => {
  const shots = rec.value?.shots
  if (!shots || !shots.length) return null
  return shots[shotIdx.value] ?? null
})

const shotEmptyHint = computed(() => {
  const c = rec.value
  if (!c) return ''
  return c.codeImages && c.codeImages.length
    ? '该任务未留存对线过程截图\n\n转款码原件已在第 ③ 栏取证'
    : '该任务无对线过程截图\n\n仅留存账号 / 短链文本（信息样本）\n截图凭证见交付任务夹目录'
})

function showShot(i: number): void {
  const shots = rec.value?.shots
  if (!shots || !shots.length) return
  shotIdx.value = (i + shots.length) % shots.length
}
</script>

<template>
  <Teleport to="body">
    <template v-if="visible && rec">
      <div class="overlay" @click="$emit('close')"></div>
      <div
        class="modal detail-modal"
        role="dialog"
        aria-modal="true"
        :aria-label="`转款码取证详情 · ${rec.app}`"
      >
        <div class="modal-head">
          <h3>转款码取证详情 · {{ rec.app }}</h3>
          <span class="sp"></span>
          <button class="modal-close" aria-label="关闭" @click="$emit('close')">✕</button>
        </div>
        <div class="modal-body">
          <div class="detail-grid">
            <!-- 列 1 APK 信息 -->
            <div class="detail-col">
              <div class="dc-head"><span class="n">1</span>APK 信 息</div>
              <div class="dc-body">
                <div
                  v-for="row in infoRows"
                  :key="row.label"
                  class="info-row"
                >
                  <span>{{ row.label }}</span>
                  <b :class="{ mono: row.mono }">{{ row.value }}</b>
                </div>
              </div>
            </div>

            <!-- 列 2 中间取证图 -->
            <div class="detail-col">
              <div class="dc-head">
                <span class="n">2</span>中 间 取 证 图（对线过程截图）
              </div>
              <div class="dc-body shot-body">
                <template v-if="curShot">
                  <div class="shot-stage">
                    <button
                      class="shot-nav prev"
                      aria-label="上一张"
                      @click="showShot(shotIdx - 1)"
                    >‹</button>
                    <img :src="curShot.src" :alt="curShot.label" />
                    <button
                      class="shot-nav next"
                      aria-label="下一张"
                      @click="showShot(shotIdx + 1)"
                    >›</button>
                    <div class="shot-cap">
                      <b>{{ shotIdx + 1 }} / {{ rec.shots!.length }}</b>
                      <span>{{ curShot.label }}</span>
                    </div>
                  </div>
                  <div class="shot-thumbs">
                    <img
                      v-for="(s, i) in rec.shots"
                      :key="i"
                      class="shot-thumb"
                      :class="{ active: i === shotIdx }"
                      :src="s.src"
                      :alt="s.label"
                      @click="showShot(i)"
                    />
                  </div>
                </template>
                <div v-else class="shot-empty">{{ shotEmptyHint }}</div>
              </div>
            </div>

            <!-- 列 3 转款码 -->
            <div class="detail-col">
              <div class="dc-head"><span class="n">3</span>转 款 码</div>
              <div class="dc-body">
                <div v-if="rec.codeImages && rec.codeImages.length > 1" class="code-tabs">
                  <button
                    v-for="(img, i) in rec.codeImages"
                    :key="i"
                    class="code-tab"
                    :class="{ active: i === codeTab }"
                    @click="codeTab = i"
                  >{{ img.label.split(' · ')[0] }}</button>
                </div>
                <div
                  v-if="rec.codeImages && rec.codeImages.length"
                  class="code-big"
                >
                  <img
                    :src="rec.codeImages[codeTab].src"
                    alt="转款码原件"
                  />
                </div>
                <div v-else class="text-only-note">
                  <b>仅信息样本</b>（码图数 = 0 · 码指纹 NA）<br />
                  该任务未取得码图原件，多为短链 / H5 游戏充值通道；<br />
                  收款账号与入口已按台账留档，截图凭证见任务夹。
                </div>
                <div class="evi-foot">
                  证据产物<b style="color: #ff8b96"> 只增不改 · 绝不伪造 </b
                  >；同码跨任务独立留证、按码指纹比对。收款人姓名已部分打码，材料限内部研判使用。
                </div>
              </div>
            </div>
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
  width: 12.4rem;
  max-width: 94vw;
  max-height: 88vh;
  display: flex;
  flex-direction: column;
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

.detail-grid {
  display: grid;
  grid-template-columns: 2.9rem 1fr 3.3rem;
  gap: 0.14rem;
}

.detail-col {
  border: 0.01rem solid $bg-line;
  background: rgba(8, 16, 30, 0.5);
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.dc-head {
  flex: 0 0 0.34rem;
  height: 0.34rem;
  padding: 0 0.12rem;
  display: flex;
  align-items: center;
  gap: 0.08rem;
  font-size: 0.13rem;
  font-weight: 700;
  letter-spacing: 0.01rem;
  border-bottom: 0.01rem solid $bg-line;
  color: $cyan;
}

.dc-head .n {
  font-family: $font-mono;
  font-size: 0.1rem;
  color: $tx-3;
  border: 0.01rem solid $bg-line;
  border-radius: 50%;
  width: 0.17rem;
  height: 0.17rem;
  display: grid;
  place-items: center;
}

.dc-body {
  padding: 0.12rem;
  display: flex;
  flex-direction: column;
  gap: 0.09rem;
}

.info-row {
  display: flex;
  flex-direction: column;
  gap: 0.02rem;
}

.info-row span {
  font-size: 0.1rem;
  color: $tx-3;
  letter-spacing: 0.005rem;
}

.info-row b {
  font-size: 0.12rem;
  color: $tx-1;
  font-weight: 600;
  word-break: break-all;
}

.info-row b.mono {
  font-family: $font-mono;
  font-size: 0.11rem;
}

.shot-body {
  flex: 1;
  min-height: 0;
}

.shot-stage {
  position: relative;
  flex: 1;
  min-height: 3.6rem;
  background: #04080f;
  border: 0.01rem solid $bg-line;
  display: grid;
  place-items: center;
  overflow: hidden;
}

.shot-stage img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.shot-nav {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  z-index: 3;
  width: 0.34rem;
  height: 0.44rem;
  border: 0.01rem solid $line-strong;
  background: rgba(6, 12, 22, 0.66);
  color: $cyan;
  font-size: 0.18rem;
  cursor: pointer;
  padding: 0;
}

.shot-nav:hover {
  background: rgba(56, 225, 255, 0.2);
}

.shot-nav.prev { left: 0.08rem; }
.shot-nav.next { right: 0.08rem; }

.shot-cap {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 0.07rem 0.12rem;
  font-size: 0.11rem;
  color: $tx-2;
  background: linear-gradient(transparent, rgba(4, 8, 15, 0.9));
  display: flex;
  gap: 0.1rem;
}

.shot-cap b {
  color: $purple;
  font-family: $font-mono;
}

.shot-thumbs {
  flex: 0 0 0.74rem;
  display: flex;
  gap: 0.08rem;
  padding-top: 0.1rem;
  overflow-x: auto;
}

.shot-thumb {
  flex: 0 0 0.44rem;
  width: 0.44rem;
  height: 0.74rem;
  object-fit: cover;
  border: 0.01rem solid $bg-line;
  cursor: pointer;
  opacity: 0.55;
}

.shot-thumb.active {
  opacity: 1;
  border-color: $cyan;
  box-shadow: 0 0 0.08rem rgba(56, 225, 255, 0.4);
}

.shot-empty {
  color: $tx-3;
  font-size: 0.12rem;
  padding: 0.4rem 0;
  text-align: center;
  white-space: pre-line;
  line-height: 1.9;
}

.code-big {
  background: #fff;
  border-radius: 0.02rem;
  padding: 0.06rem;
  display: grid;
  place-items: center;
}

.code-big img {
  width: 100%;
  max-width: 2.6rem;
  display: block;
}

.code-tabs {
  display: flex;
  gap: 0.06rem;
  flex-wrap: wrap;
}

.code-tab {
  font-size: 0.11rem;
  padding: 0.04rem 0.1rem;
  border: 0.01rem solid $bg-line;
  background: transparent;
  color: $tx-2;
  cursor: pointer;
  border-radius: 0.02rem;
}

.code-tab.active {
  border-color: $red;
  color: $red;
  background: rgba(255, 77, 94, 0.14);
}

.evi-foot {
  margin-top: 0.14rem;
  padding: 0.09rem 0.12rem;
  border: 0.01rem dashed rgba(255, 77, 94, 0.4);
  font-size: 0.11rem;
  color: #ffb3ba;
  line-height: 1.7;
  background: rgba(255, 77, 94, 0.05);
}

.text-only-note {
  padding: 0.26rem 0.14rem;
  border: 0.01rem dashed $bg-line;
  text-align: center;
  color: $tx-3;
  font-size: 0.12rem;
  line-height: 1.9;
}

.text-only-note b {
  color: $amber;
}
</style>
