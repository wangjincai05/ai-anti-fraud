<script setup lang="ts">
/* ============================================================
 * CodeWall.vue · 右区 · 转款码实时输出墙
 *  两遍渲染 + CSS 纵向无缝循环动画（wallScroll 64s linear infinite）
 *  悬停暂停（animation-play-state: paused）
 *  点击卡片 emit 'open-detail' 事件（带 idx）
 *  卡片模板参考原型 cardHTML：缩略图 + App名 + 渠道标签 + 收款人 + 金额 + URL + 时间
 * ============================================================ */
import { computed } from 'vue';
import { data } from '@/mock/data';
import { channelKind } from '@/utils/format';
import type { CodeRecord } from '@/types/data';

const emit = defineEmits<{
  'open-detail': [idx: number];
}>();

const codes = computed<CodeRecord[]>(() => data.CODES);

function pad2(n: number): string {
  return (n < 9 ? '0' : '') + (n + 1);
}

function channelTag(codeType: string): { cls: string; text: string } {
  switch (channelKind(codeType)) {
    case 'dual':
      return { cls: 'tag-dual', text: '微信+支付宝双码' };
    case 'ali':
      return { cls: 'tag-ali', text: '支付宝' };
    case 'game':
      return { cls: 'tag-game', text: '游戏充值通道' };
    default:
      return { cls: 'tag-wx', text: '微信' };
  }
}

function hasImage(c: CodeRecord): boolean {
  return !!(c.codeImages && c.codeImages.length > 0);
}

function onClick(idx: number): void {
  emit('open-detail', idx);
}
</script>

<template>
  <div class="wall">
    <div class="wall-track">
      <div class="wall-half">
        <div
          v-for="(c, i) in codes"
          :key="i"
          class="code-card"
          :class="{ 'text-only': !hasImage(c) }"
          @click="onClick(i)"
        >
          <div v-if="hasImage(c)" class="cc-thumb">
            <img :src="c.codeImages![0].src" alt="转款码" loading="lazy" />
            <span class="evi-tag">取证原件</span>
          </div>
          <div v-else class="cc-text-thumb">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.6"
            >
              <circle cx="11" cy="11" r="7" />
              <line x1="16.5" y1="16.5" x2="21" y2="21" />
              <line x1="8.5" y1="11" x2="13.5" y2="11" />
            </svg>
            <span>信息样本<br />凭证见任务夹</span>
          </div>
          <div class="cc-info">
            <div class="cc-app">
              {{ c.app }}<span class="seq">#{{ pad2(i) }} · {{ c.taskId }}</span>
            </div>
            <div class="cc-tags">
              <span class="tag" :class="channelTag(c.codeType).cls">
                {{ channelTag(c.codeType).text }}
              </span>
              <span class="tag tag-cat" :title="c.category || ''">
                {{ c.category || '类别未标注' }}
              </span>
              <span v-if="!hasImage(c)" class="tag tag-info">仅信息</span>
            </div>
            <div class="cc-line">
              <em>收款人</em>
              <span class="payee">{{ c.payee }}</span>
              <span class="sp"></span>
              <span class="cc-amount">{{ c.amount }}</span>
            </div>
            <div v-if="c.url" class="cc-url" :title="c.url">{{ c.url }}</div>
            <div v-else class="cc-url na">账号未解析（仅截图凭证）</div>
            <div class="cc-time">
              {{ c.time }}<template v-if="c.device"> · {{ c.device }}</template>
            </div>
          </div>
        </div>
      </div>
      <div class="wall-half clone">
        <div
          v-for="(c, i) in codes"
          :key="'c' + i"
          class="code-card"
          :class="{ 'text-only': !hasImage(c) }"
          @click="onClick(i)"
        >
          <div v-if="hasImage(c)" class="cc-thumb">
            <img :src="c.codeImages![0].src" alt="转款码" loading="lazy" />
            <span class="evi-tag">取证原件</span>
          </div>
          <div v-else class="cc-text-thumb">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.6"
            >
              <circle cx="11" cy="11" r="7" />
              <line x1="16.5" y1="16.5" x2="21" y2="21" />
              <line x1="8.5" y1="11" x2="13.5" y2="11" />
            </svg>
            <span>信息样本<br />凭证见任务夹</span>
          </div>
          <div class="cc-info">
            <div class="cc-app">
              {{ c.app }}<span class="seq">#{{ pad2(i) }} · {{ c.taskId }}</span>
            </div>
            <div class="cc-tags">
              <span class="tag" :class="channelTag(c.codeType).cls">
                {{ channelTag(c.codeType).text }}
              </span>
              <span class="tag tag-cat" :title="c.category || ''">
                {{ c.category || '类别未标注' }}
              </span>
              <span v-if="!hasImage(c)" class="tag tag-info">仅信息</span>
            </div>
            <div class="cc-line">
              <em>收款人</em>
              <span class="payee">{{ c.payee }}</span>
              <span class="sp"></span>
              <span class="cc-amount">{{ c.amount }}</span>
            </div>
            <div v-if="c.url" class="cc-url" :title="c.url">{{ c.url }}</div>
            <div v-else class="cc-url na">账号未解析（仅截图凭证）</div>
            <div class="cc-time">
              {{ c.time }}<template v-if="c.device"> · {{ c.device }}</template>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.wall {
  height: 100%;
  overflow: hidden;
  position: relative;
}

.wall-track {
  display: flex;
  flex-direction: column;
  will-change: transform;
  animation: wallScroll 64s linear infinite;
}

.wall:hover .wall-track {
  animation-play-state: paused;
}

@keyframes wallScroll {
  from {
    transform: translateY(0);
  }
  to {
    transform: translateY(-50%);
  }
}

.wall-half {
  padding: 0.1rem 0.12rem;
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}

.code-card {
  position: relative;
  border: 0.01rem solid $bg-line;
  background: $bg-panel-2;
  display: flex;
  gap: 0.11rem;
  padding: 0.1rem;
  cursor: pointer;
  transition: border-color 0.15s, transform 0.15s;

  &:hover {
    border-color: rgba(92, 168, 255, 0.42);
    transform: translateX(-0.02rem);
  }

  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 0.02rem;
    background: $red;
    opacity: 0.8;
  }

  &.text-only::before {
    background: $amber;
  }
}

.cc-thumb {
  flex: 0 0 0.92rem;
  width: 0.92rem;
  height: 0.92rem;
  background: #fff;
  border-radius: 0.02rem;
  overflow: hidden;
  display: grid;
  place-items: center;
  position: relative;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .evi-tag {
    position: absolute;
    left: 0;
    top: 0;
    font-size: 0.08rem;
    padding: 0.01rem 0.04rem;
    background: rgba(0, 0, 0, 0.62);
    color: $green;
    font-family: 'SFMono-Regular', 'JetBrains Mono', Consolas, monospace;
  }
}

.cc-text-thumb {
  flex: 0 0 0.92rem;
  width: 0.92rem;
  height: 0.92rem;
  border: 0.01rem dashed rgba(255, 176, 32, 0.45);
  border-radius: 0.02rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.06rem;
  background: rgba(255, 176, 32, 0.05);
  text-align: center;
  padding: 0.08rem;

  svg {
    width: 0.26rem;
    height: 0.26rem;
    color: $amber;
    opacity: 0.8;
  }

  span {
    font-size: 0.095rem;
    color: $amber;
    line-height: 1.4;
  }
}

.cc-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.04rem;
}

.cc-app {
  font-size: 0.14rem;
  font-weight: 700;
  color: $tx-1;
  display: flex;
  align-items: center;
  gap: 0.07rem;

  .seq {
    font-family: 'SFMono-Regular', 'JetBrains Mono', Consolas, monospace;
    font-size: 0.095rem;
    color: $tx-3;
    font-weight: 400;
  }
}

.cc-tags {
  display: flex;
  gap: 0.05rem;
  flex-wrap: wrap;
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

.tag-wx {
  background: rgba(34, 197, 94, 0.13);
  color: #4ade80;
  border: 0.01rem solid rgba(34, 197, 94, 0.35);
}
.tag-ali {
  background: rgba(59, 130, 246, 0.13);
  color: #7aaaff;
  border: 0.01rem solid rgba(59, 130, 246, 0.35);
}
.tag-game {
  background: rgba(167, 139, 250, 0.13);
  color: #c4b5fd;
  border: 0.01rem solid rgba(167, 139, 250, 0.35);
}
.tag-dual {
  background: rgba(255, 77, 94, 0.14);
  color: #ff8b96;
  border: 0.01rem solid rgba(255, 77, 94, 0.35);
}
.tag-cat {
  background: rgba(148, 178, 214, 0.12);
  color: #b9cdea;
  border: 0.01rem solid rgba(148, 178, 214, 0.3);
  max-width: 1.58rem;
  overflow: hidden;
  text-overflow: ellipsis;
}
.tag-info {
  background: rgba(108, 132, 163, 0.14);
  color: #a9bfd9;
  border: 0.01rem solid rgba(108, 132, 163, 0.32);
}

.cc-line {
  font-size: 0.11rem;
  color: $tx-2;
  display: flex;
  gap: 0.06rem;
  min-width: 0;
  align-items: baseline;

  em {
    font-style: normal;
    color: $tx-3;
    flex: 0 0 0.44rem;
    font-size: 0.105rem;
  }

  .payee {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .sp {
    flex: 1;
  }
}

.cc-amount {
  font-family: 'SFMono-Regular', 'JetBrains Mono', Consolas, monospace;
  color: $red;
  font-weight: 700;
  font-size: 0.15rem;
}

.cc-url {
  font-family: 'SFMono-Regular', 'JetBrains Mono', Consolas, monospace;
  font-size: 0.1rem;
  color: #7aaaff;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;

  &.na {
    color: #6c84a3;
  }
}

.cc-time {
  font-family: 'SFMono-Regular', 'JetBrains Mono', Consolas, monospace;
  font-size: 0.095rem;
  color: $tx-3;
  margin-top: auto;
}

@media (prefers-reduced-motion: reduce) {
  .wall-track {
    animation: none !important;
  }
  .wall {
    overflow-y: auto !important;
  }
  .wall-half.clone {
    display: none !important;
  }
}
</style>
