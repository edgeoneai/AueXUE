<!--
  本文件覆盖 valaxy-theme-sakura 0.10.2 的 SakuraPostHeader，升级主题需复核

  本次改动为「只增不改」：保留主题原版的 props 与模板结构（SakuraPageHeader + SakuraPostHeaderMeta），
  仅在 meta 信息之后追加一行「本文字数 / 阅读时长」。
  该行严格受 themeConfig.post.meta.wordCount 开关控制；开关为 false（默认）时不渲染任何内容，
  组件输出与主题原版完全一致。
-->
<script lang="ts" setup>
import type { PostFrontMatter } from 'valaxy'
import type { SakuraImageCardProps } from '../node_modules/valaxy-theme-sakura/types'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useThemeConfig } from '../node_modules/valaxy-theme-sakura/composables'

defineProps<{
  fm: PostFrontMatter
  imageCard?: SakuraImageCardProps
}>()

const themeConfig = useThemeConfig()

/** 开关：themeConfig.post.meta.wordCount，默认 false = 保持现状（不渲染该行） */
const readingEnabled = computed(() => (themeConfig.value as any)?.post?.meta?.wordCount === true)

/** 中文字符（含扩展 A、兼容区）按 1 字计 */
const ZH_RE = /[\u3400-\u4DBF\u4E00-\u9FFF\uF900-\uFAFF]/g
/** 西文词元：按空格分词后，含字母/数字的 token 计为 1 词 */
const WORDLIKE_RE = /[\dA-Za-z\u00C0-\u024F\u0370-\u03FF\u0400-\u04FF\u0590-\u05FF\u0600-\u06FF\u0900-\u097F\u3040-\u30FF\uAC00-\uD7AF]/

/**
 * 字数统计：中文字符数 + 英文/数字词数
 * 阅读时长 = ceil(字数 / 300)，最少 1 分钟
 */
function countWords(text: string) {
  if (!text)
    return 0

  const cn = (text.match(ZH_RE) || []).length
  const en = text
    .replace(ZH_RE, ' ')
    .split(/\s+/)
    .filter(token => WORDLIKE_RE.test(token))
    .length

  return cn + en
}

/** 正文字数（取不到正文时为 0，即不渲染该行） */
const wordCount = ref(0)
const readingMinutes = computed(() => Math.max(1, Math.ceil(wordCount.value / 300)))
const showReading = computed(() => readingEnabled.value && wordCount.value > 0)

/**
 * 取数来源：Valaxy 的 statistics 默认关闭（本项目 siteConfig 未开启），
 * 因此 frontmatter 上没有 wordCount/readingTime；而文章正文在 SPA 里是
 * 异步挂载的（动态文章经 v-html 注入），故这里读取正文容器 `.markdown-body`
 * 的文本（ValaxyMd 渲染的 <article class="markdown-body">）来统计。
 *
 * SSR 安全：document / window 只在 onMounted 及其回调内访问，setup 顶层不触碰。
 */
function measureFromDom(): boolean {
  if (typeof document === 'undefined')
    return false

  const text = document.querySelector('.markdown-body')?.textContent || ''
  const count = countWords(text)
  if (count > 0) {
    wordCount.value = count
    return true
  }
  return false
}

let observer: MutationObserver | null = null
let stopTimer: ReturnType<typeof setTimeout> | null = null

function stopWatching() {
  observer?.disconnect()
  observer = null
  if (stopTimer) {
    clearTimeout(stopTimer)
    stopTimer = null
  }
}

onMounted(() => {
  if (!readingEnabled.value)
    return

  // 正文可能已经就绪（例如从缓存返回）
  if (measureFromDom())
    return

  if (typeof MutationObserver === 'undefined' || typeof document === 'undefined')
    return

  let scheduled = false
  observer = new MutationObserver(() => {
    if (scheduled)
      return
    scheduled = true
    // 合并同一帧内的多次变更，避免重复统计
    requestAnimationFrame(() => {
      scheduled = false
      if (measureFromDom())
        stopWatching()
    })
  })
  observer.observe(document.body, { childList: true, subtree: true, characterData: true })
  // 兜底：动态文章加载失败等情况下停止观察，避免长期监听
  stopTimer = setTimeout(stopWatching, 15000)
})

onBeforeUnmount(() => stopWatching())
</script>

<template>
  <SakuraPageHeader :fm class="sakura-post-header" :image-card="imageCard">
    <SakuraPostHeaderMeta :fm />
    <p v-if="showReading" class="sakura-post-header-reading">
      本文字数：{{ wordCount }}&nbsp;&nbsp;阅读时长：{{ readingMinutes }} 分钟
    </p>
  </SakuraPageHeader>
</template>

<style lang="scss">
// @use 'valaxy-theme-sakura/styles/animation/slide/slide.scss' as *;

.sakura-post-header {
  // @media (prefers-reduced-motion: no-preference) {
  //   @include slide-down;
  // }

  .has-cover {
    height: 400px;
  }

  .sakura-post-header-reading {
    margin-top: 4px;
    font-size: 0.875rem;
    line-height: 1.6;
    opacity: 0.85;
  }
}
</style>
