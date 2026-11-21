<!--
  固定位置音乐播放器（移植自上游 hugo-theme-aiovtue 的 music-player）：
  左下/右下角一枚唱片按钮，点开后面板内嵌 APlayer + Meting 歌单。

  之所以用 CDN 动态加载而不是打包依赖：
  APlayer/Meting 体积不小，且只在用户点开时才需要，避免拖慢首屏。
  加载失败时只显示错误提示，绝不影响页面其它功能。
-->
<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useThemeConfig } from '../node_modules/valaxy-theme-sakura/composables'

interface MusicConfig {
  enable?: boolean
  server?: string
  type?: string
  id?: string
  position?: 'left' | 'right'
}

const APLAYER_CSS_URL = 'https://cdn.jsdelivr.net/npm/aplayer@1.10.1/dist/APlayer.min.css'
const APLAYER_SCRIPT_URL = 'https://cdn.jsdelivr.net/npm/aplayer@1.10.1/dist/APlayer.min.js'
const METING_SCRIPT_URL = 'https://cdn.jsdelivr.net/npm/meting@2/dist/Meting.min.js'
const METING_API = 'https://api.i-meto.com/meting/api?server=:server&type=:type&id=:id&r=:r'
const STORAGE_KEY = 'sakura-music-open'

const themeConfig = useThemeConfig()
const music = computed<MusicConfig>(() =>
  ((themeConfig.value as { music?: MusicConfig } | undefined)?.music) ?? {},
)

const enabled = computed(() => music.value.enable === true)
const position = computed(() => (music.value.position === 'right' ? 'right' : 'left'))
const server = computed(() => music.value.server || 'netease')
const type = computed(() => music.value.type || 'playlist')
const trackId = computed(() => music.value.id || '')

const open = ref(false)
const loading = ref(false)
const failed = ref(false)
const hostRef = ref<HTMLElement | null>(null)
let metingEl: HTMLElement | null = null

/** 依次注入 script，已存在则复用 */
function loadScript(src: string) {
  return new Promise<void>((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`) as HTMLScriptElement | null
    if (existing) {
      if ((existing as any).dataset.loaded === '1')
        resolve()
      else {
        existing.addEventListener('load', () => resolve(), { once: true })
        existing.addEventListener('error', () => reject(new Error(src)), { once: true })
      }
      return
    }
    const el = document.createElement('script')
    el.src = src
    el.async = true
    el.addEventListener('load', () => {
      el.dataset.loaded = '1'
      resolve()
    }, { once: true })
    el.addEventListener('error', () => reject(new Error(src)), { once: true })
    document.head.appendChild(el)
  })
}

function loadStyle(href: string) {
  if (document.querySelector(`link[href="${href}"]`))
    return
  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = href
  document.head.appendChild(link)
}

async function mountPlayer() {
  if (!hostRef.value || !trackId.value)
    return

  loading.value = true
  failed.value = false

  try {
    loadStyle(APLAYER_CSS_URL)
    await loadScript(APLAYER_SCRIPT_URL)
    await loadScript(METING_SCRIPT_URL)

    // meting-js 是自定义元素：属性变更后需要重建才能重新拉歌单
    if (metingEl)
      metingEl.remove()

    const el = document.createElement('meting-js')
    el.setAttribute('server', server.value)
    el.setAttribute('type', type.value)
    el.setAttribute('id', trackId.value)
    el.setAttribute('api', METING_API)
    el.setAttribute('theme', '#DF9193')
    el.setAttribute('list-folded', 'true')
    hostRef.value.appendChild(el)
    metingEl = el
  }
  catch {
    failed.value = true
  }
  finally {
    loading.value = false
  }
}

function toggle() {
  open.value = !open.value
}

watch(open, (value) => {
  if (typeof window !== 'undefined')
    window.localStorage.setItem(STORAGE_KEY, value ? '1' : '0')
  if (value)
    void mountPlayer()
})

/** 配置变化（后台改歌单）时若面板已打开则重建 */
watch([server, type, trackId], () => {
  if (open.value)
    void mountPlayer()
})

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && open.value)
    open.value = false
}

onMounted(() => {
  if (!enabled.value)
    return
  window.addEventListener('keydown', onKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown)
  metingEl?.remove()
  metingEl = null
})
</script>

<template>
  <div
    v-if="enabled && trackId"
    class="sakura-music"
    :class="[`sakura-music--${position}`, { 'is-open': open }]"
  >
    <div v-show="open" class="sakura-music__panel">
      <div class="sakura-music__head">
        <span class="sakura-music__title">正在播放</span>
        <button type="button" class="sakura-music__close" aria-label="收起播放器" @click="toggle">
          <span class="i-ri-arrow-down-s-line" aria-hidden="true" />
        </button>
      </div>

      <p v-if="loading" class="sakura-music__hint">
        播放器加载中…
      </p>
      <p v-else-if="failed" class="sakura-music__hint sakura-music__hint--error">
        音乐播放器加载失败，请稍后重试
      </p>

      <div ref="hostRef" class="sakura-music__host" />
    </div>

    <button
      type="button"
      class="sakura-music__toggle"
      :aria-expanded="open"
      :aria-label="open ? '收起音乐播放器' : '打开音乐播放器'"
      @click="toggle"
    >
      <span class="sakura-music__disc i-ri-disc-line" aria-hidden="true" />
    </button>
  </div>
</template>

<style lang="scss" scoped>
.sakura-music {
  --sakura-music-edge-x: max(16px, env(safe-area-inset-left, 0px));
  --sakura-music-edge-y: max(20px, env(safe-area-inset-bottom, 0px));

  position: fixed;
  bottom: var(--sakura-music-edge-y);
  z-index: 200;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 10px;

  &--left {
    left: var(--sakura-music-edge-x);
  }

  &--right {
    left: auto;
    right: max(16px, env(safe-area-inset-right, 0px));
    align-items: flex-end;
  }

  &__toggle {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    border: none;
    background: var(--va-c-primary);
    color: #fff;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    box-shadow: 0 6px 18px rgba(0, 0, 0, 0.18);
    transition: transform 0.2s ease;

    &:hover {
      transform: scale(1.06);
    }
  }

  &__disc {
    width: 1.5rem;
    height: 1.5rem;
    display: block;
  }

  &__panel {
    width: min(340px, calc(100vw - 32px));
    border-radius: 14px;
    background: var(--sakura-post-card-bg, var(--va-c-bg));
    border: 1px solid var(--sakura-color-divider, rgba(0, 0, 0, 0.1));
    box-shadow: 0 14px 36px rgba(0, 0, 0, 0.16);
    padding: 0.6rem 0.7rem 0.8rem;
    overflow: hidden;
  }

  &__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 0.4rem;
  }

  &__title {
    font-size: 0.8125rem;
    font-weight: 700;
  }

  &__close {
    border: none;
    background: transparent;
    color: inherit;
    cursor: pointer;
    display: inline-flex;
    padding: 0.15rem;
    opacity: 0.7;

    &:hover {
      opacity: 1;
    }
  }

  &__hint {
    margin: 0.4rem 0;
    font-size: 0.75rem;
    color: var(--va-c-text-light);

    &--error {
      color: #c0392b;
    }
  }

  &__host {
    width: 100%;

    /* APlayer 在窄面板里铺满 */
    :deep(.aplayer) {
      margin: 0;
      border-radius: 10px;
    }
  }
}

@media (max-width: 640px) {
  .sakura-music__panel {
    width: calc(100vw - 32px);
  }
}
</style>
