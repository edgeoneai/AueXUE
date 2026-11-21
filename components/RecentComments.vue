<!--
  页脚「近期评论」：通过 twikoo 的 getRecentComments 拉取最新评论，
  显示头像、昵称、时间与内容摘要。取不到时整块静默隐藏，不影响页面。

  envId 复用 twikoo addon 的运行时配置（与评论区同一个 envId），
  避免再引入一套配置。
-->
<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRuntimeConfig } from 'valaxy'
import { isClient } from '@vueuse/core'

interface TwikooRecentComment {
  id?: string
  url?: string
  nick?: string
  avatar?: string
  comment?: string
  created?: number
}

const COUNT = 8
const TWIKOO_SCRIPT_URL = 'https://cdn.jsdelivr.net/npm/twikoo@1.7.12/dist/twikoo.all.min.js'

const comments = ref<Array<{ nick: string, avatar: string, text: string, time: string, url: string }>>([])
const visible = ref(false)

const runtimeConfig = useRuntimeConfig()

function getEnvId(): string {
  const addon = runtimeConfig.value?.addons?.['valaxy-addon-twikoo'] as { options?: { envId?: string } } | undefined
  return String(addon?.options?.envId || '').trim()
}

function stripHtml(html: string) {
  const div = document.createElement('div')
  div.innerHTML = html
  const imgAlt = div.querySelector('img[alt]')?.getAttribute('alt')?.trim()
  div.querySelectorAll('img').forEach(img => img.replaceWith(document.createTextNode(img.getAttribute('alt') ? ` ${img.getAttribute('alt')} ` : '')))
  return (div.textContent || imgAlt || '').replace(/\s+/g, ' ').trim()
}

function formatTime(ms?: number) {
  if (!ms)
    return ''
  const diff = Date.now() - ms
  const min = Math.floor(diff / 60000)
  if (min < 1)
    return '刚刚'
  if (min < 60)
    return `${min} 分钟前`
  const hour = Math.floor(min / 60)
  if (hour < 24)
    return `${hour} 小时前`
  const day = Math.floor(hour / 24)
  if (day < 30)
    return `${day} 天前`
  const d = new Date(ms)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function loadScript(src: string) {
  return new Promise<void>((resolve, reject) => {
    if ((window as any).twikoo?.getRecentComments) {
      resolve()
      return
    }
    const existing = document.querySelector(`script[src="${src}"]`) as HTMLScriptElement | null
    const onLoad = () => resolve()
    const onError = () => reject(new Error(src))
    if (existing) {
      existing.addEventListener('load', onLoad, { once: true })
      existing.addEventListener('error', onError, { once: true })
      return
    }
    const el = document.createElement('script')
    el.src = src
    el.async = true
    el.addEventListener('load', onLoad, { once: true })
    el.addEventListener('error', onError, { once: true })
    document.head.appendChild(el)
  })
}

async function load() {
  const envId = getEnvId()
  if (!envId)
    return

  try {
    await loadScript(TWIKOO_SCRIPT_URL)
    const twikoo = (window as any).twikoo
    if (!twikoo?.getRecentComments)
      return

    const res: TwikooRecentComment[] = await twikoo.getRecentComments({
      envId,
      region: 'cn',
      pageSize: COUNT,
      includeReply: true,
    })

    if (!Array.isArray(res) || !res.length)
      return

    comments.value = res.slice(0, COUNT).map(item => ({
      nick: item.nick || '匿名',
      avatar: item.avatar || '',
      text: stripHtml(item.comment || ''),
      time: formatTime(item.created),
      url: item.url || '#',
    }))
    visible.value = true
  }
  catch {
    // 静默失败：页脚不因评论接口异常而受影响
  }
}

onMounted(() => {
  if (isClient)
    void load()
})
</script>

<template>
  <section v-if="visible" class="recent-comments" aria-label="近期评论">
    <h3 class="recent-comments__title">近期评论</h3>
    <ul class="recent-comments__list">
      <li v-for="(item, index) in comments" :key="index" class="recent-comments__item">
        <a class="recent-comments__link" :href="item.url">
          <img
            v-if="item.avatar"
            class="recent-comments__avatar"
            :src="item.avatar"
            :alt="item.nick"
            loading="lazy"
            decoding="async"
            referrerpolicy="no-referrer"
          >
          <div class="recent-comments__body">
            <div class="recent-comments__head">
              <span class="recent-comments__nick">{{ item.nick }}</span>
              <time class="recent-comments__time">{{ item.time }}</time>
            </div>
            <p class="recent-comments__text">{{ item.text }}</p>
          </div>
        </a>
      </li>
    </ul>
  </section>
</template>

<style lang="scss" scoped>
.recent-comments {
  max-width: 720px;
  margin: 0 auto 1.5rem;
  padding: 1rem 1.1rem;
  border-radius: 14px;
  background: var(--sakura-post-card-bg, var(--va-c-bg-soft));
  border: 1px solid var(--sakura-color-divider, rgba(0, 0, 0, 0.1));

  &__title {
    margin: 0 0 0.75rem;
    text-align: center;
    font-size: 0.9375rem;
    font-weight: 700;
    color: var(--va-c-primary);
  }

  &__list {
    margin: 0;
    padding: 0;
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 0.7rem;
  }

  &__link {
    display: flex;
    gap: 0.65rem;
    color: inherit;
    text-decoration: none;

    &:hover .recent-comments__nick {
      color: var(--va-c-primary);
    }
  }

  &__avatar {
    flex: none;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    object-fit: cover;
    background: var(--va-c-bg-soft);
  }

  &__body {
    min-width: 0;
    flex: 1 1 auto;
  }

  &__head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 0.5rem;
  }

  &__nick {
    font-size: 0.8125rem;
    font-weight: 600;
    transition: color 0.2s ease;
  }

  &__time {
    flex: none;
    font-size: 0.6875rem;
    color: var(--va-c-text-light);
  }

  &__text {
    margin: 0.15rem 0 0;
    font-size: 0.75rem;
    line-height: 1.5;
    color: var(--va-c-text-light);
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
}
</style>
