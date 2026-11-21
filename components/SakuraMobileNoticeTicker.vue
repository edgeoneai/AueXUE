<script lang="ts" setup>
/**
 * 移动端首页公告单行滚动 ticker
 * 移植自 hugo-theme-aiovtue：layouts/partials/home-mobile-notice-ticker.html
 *
 * 约定：
 * - 开关：themeConfig.home.mobileNoticeTicker === true 才渲染，默认 false = 保持现状。
 * - 可见性：仅窄屏（<768px）可见；桌面端即使开启也不占位。媒体查询全交给 CSS，
 *   不使用 window.innerWidth，因此 SSR 安全。
 * - 数据源：复用公告行（后台动态公告，回落 themeConfig.notice.sections[].lines），
 *   跳过纯图片行（形如 ![alt](url) 的整行）。
 * - 无内容时不渲染任何占位元素。
 * - 滚动用 CSS animation（轨道内容复制两份 + translateX(-50%)），不用 setInterval 逐帧改样式。
 */
import type { NoticeLine } from '../types/notice'
import { useConfig } from 'valaxy'
import { computed } from 'vue'
import { useDynamicNotice } from '../composables/useDynamicNotice'
import { resolveNoticeSections } from '../utils/noticeLines'

interface TickerItem {
  key: string
  text: string
  url?: string
  external?: boolean
}

interface TickerThemeConfig {
  home?: {
    mobileNoticeTicker?: boolean
  }
  notice?: {
    title?: string
    sections?: Array<{
      label: string
      lines: Array<string | { text: string, url?: string }>
    }>
  }
}

/** 整行只有一个 Markdown 图片时的匹配：这种行没有可读文本，跳过 */
const IMAGE_ONLY_LINE_RE = /^!\[[^\]]*\]\([^)]+\)$/

const config = useConfig()
// 只读取公告栏已经拉取的动态公告（不主动发起请求），保证 ticker 与公告栏文案一致
const { noticeData } = useDynamicNotice()

const themeConfig = computed(() => config.value.themeConfig as TickerThemeConfig)

const enabled = computed(() => themeConfig.value?.home?.mobileNoticeTicker === true)

const noticeTitle = computed(() => {
  if (noticeData.value?.title)
    return noticeData.value.title
  return themeConfig.value?.notice?.title || '公告栏'
})

const items = computed<TickerItem[]>(() => {
  if (!enabled.value)
    return []

  const sections = noticeData.value?.sections?.length
    ? noticeData.value.sections
    : themeConfig.value?.notice?.sections

  const resolved: TickerItem[] = []
  for (const section of resolveNoticeSections(sections)) {
    for (const line of section.lines as NoticeLine[]) {
      const text = (line.text || '').trim()
      if (!text || IMAGE_ONLY_LINE_RE.test(text))
        continue
      resolved.push({
        key: `${resolved.length}-${text}`,
        text,
        url: line.url,
        external: line.external,
      })
    }
  }
  return resolved
})
</script>

<template>
  <div
    v-if="enabled && items.length"
    class="sakura-mobile-notice-ticker"
    role="region"
    :aria-label="noticeTitle"
  >
    <div class="sakura-mobile-notice-ticker__viewport">
      <div class="sakura-mobile-notice-ticker__track">
        <!-- 内容复制两份：translateX(-50%) 后正好衔接到头部，实现无缝循环 -->
        <div
          v-for="group in 2"
          :key="group"
          class="sakura-mobile-notice-ticker__group"
          :aria-hidden="group === 2 ? 'true' : undefined"
        >
          <template v-for="(item, index) in items" :key="`${group}-${item.key}`">
            <span
              v-if="index"
              class="sakura-mobile-notice-ticker__sep"
              aria-hidden="true"
            >·</span>
            <span class="sakura-mobile-notice-ticker__item">
              <a
                v-if="item.url"
                :href="item.url"
                :target="item.external ? '_blank' : undefined"
                :rel="item.external ? 'noopener noreferrer' : undefined"
              >{{ item.text }}</a>
              <template v-else>
                {{ item.text }}
              </template>
            </span>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
/* 默认（含桌面端）完全不渲染占位：display:none 且 v-if 已保证开关关闭时无 DOM */
.sakura-mobile-notice-ticker {
  display: none;
}

@media (max-width: 767px) {
  .sakura-mobile-notice-ticker {
    display: flex;
    align-items: center;
    box-sizing: border-box;
    width: auto;
    margin: 0 12px 10px;
    padding: 7px 10px;
    overflow: hidden;
    border: 1px solid var(--sakura-color-divider, rgba(128, 128, 128, 0.3));
    border-radius: 10px;
    background: transparent;
  }

  .sakura-mobile-notice-ticker__viewport {
    flex: 1 1 auto;
    min-width: 0;
    overflow: hidden;
    mask-image: linear-gradient(90deg, transparent, #000 10%, #000 90%, transparent);
    -webkit-mask-image: linear-gradient(90deg, transparent, #000 10%, #000 90%, transparent);
  }

  .sakura-mobile-notice-ticker__track {
    display: flex;
    width: max-content;
    animation: sakura-mobile-notice-marquee 26s linear infinite;
    will-change: transform;
  }

  .sakura-mobile-notice-ticker__group {
    display: flex;
    flex: 0 0 auto;
    align-items: center;
    padding-right: 2rem;
    font-size: 0.78rem;
    font-weight: 700;
    line-height: 1.4;
    white-space: nowrap;
    color: var(--sakura-color-text, inherit);
  }

  .sakura-mobile-notice-ticker__item {
    display: inline-flex;
    align-items: center;
    max-width: none;
  }

  .sakura-mobile-notice-ticker__item a {
    color: inherit;
    text-decoration: none;
  }

  .sakura-mobile-notice-ticker__item a:hover {
    color: var(--sakura-color-primary, inherit);
  }

  .sakura-mobile-notice-ticker__sep {
    margin: 0 0.65rem;
    color: var(--sakura-color-primary, currentColor);
    opacity: 0.6;
  }
}

/* 悬停暂停，方便点链接 */
@media (max-width: 767px) and (hover: hover) and (pointer: fine) {
  .sakura-mobile-notice-ticker:hover .sakura-mobile-notice-ticker__track {
    animation-play-state: paused;
  }
}

/* 尊重系统「减少动态效果」偏好：停止滚动并允许横向手动浏览 */
@media (prefers-reduced-motion: reduce) {
  .sakura-mobile-notice-ticker__track {
    animation: none;
  }

  .sakura-mobile-notice-ticker__viewport {
    overflow-x: auto;
  }
}

@keyframes sakura-mobile-notice-marquee {
  from {
    transform: translateX(0);
  }

  to {
    transform: translateX(-50%);
  }
}
</style>
