<script setup lang="ts">
import { useSiteConfig } from 'valaxy'
import { computed, onMounted } from 'vue'
import { useDynamicLinks } from '../composables/useDynamicLinks'
import type { FriendLinkNoticeConfig, FriendLinkSiteInfoItem } from '../types/links'

const props = withDefaults(defineProps<{
  siteshot?: string
}>(), {
  siteshot: 'https://r2tc.20030327.xyz/file/博客/主题/1780643226230_wallhaven-9d1yjk.png',
})

const siteConfig = useSiteConfig()
const { linksData, loadLinks } = useDynamicLinks()

onMounted(() => {
  // 静默加载；失败时 component 使用服务端默认值渲染
  void loadLinks()
})

/** 后台「友链管理」里的提示配置；未加载到时不渲染（避免闪烁默认值） */
const notice = computed<FriendLinkNoticeConfig | null>(() => {
  const data = linksData.value
  if (!data)
    return null
  return (data.friendLinkNotice as FriendLinkNoticeConfig | undefined) || null
})

const visible = computed(() => Boolean(notice.value && notice.value.enable !== false))

const title = computed(() => notice.value?.title || '加入本站友链方式')
const subtitle = computed(() => notice.value?.subtitle || '')

const ymlLines = computed(() => (notice.value?.template || '').split('\n'))

const rules = computed(() => notice.value?.rules || [])

const siteInfoTitle = computed(() => notice.value?.siteInfoTitle || '本站友链信息如下：')

/**
 * 本站信息各项：标记了 auto 的从站点配置实时取，
 * 其余用后台填写的固定值。
 */
const siteInfoItems = computed(() => {
  const url = siteConfig.value.url || ''
  const normalizedUrl = url.endsWith('/') ? url : `${url}/`
  // 相对地址（如 /head-portrait.png）补成绝对地址，方便别人直接复制
  const toAbsolute = (value: string) => {
    const raw = String(value || '').trim()
    if (!raw)
      return ''
    if (/^(?:[a-z][a-z\d+.-]*:)?\/\//i.test(raw) || raw.startsWith('data:'))
      return raw
    if (!normalizedUrl)
      return raw
    return `${normalizedUrl.replace(/\/$/, '')}${raw.startsWith('/') ? '' : '/'}${raw}`
  }

  const autoValues: Record<string, string> = {
    站点名称: siteConfig.value.title || 'AIOVTUE',
    站点链接: normalizedUrl,
    站长头像: toAbsolute(siteConfig.value.author?.avatar || ''),
    站点描述: siteConfig.value.description || '',
    站点截图: toAbsolute(props.siteshot),
  }

  const items = notice.value?.siteInfo || []
  return items
    .map((item: FriendLinkSiteInfoItem) => {
      const value = item.auto ? (autoValues[item.label] ?? item.value) : item.value
      return { label: item.label, value }
    })
    .filter(item => item.value)
})

async function copyYml() {
  try {
    await navigator.clipboard.writeText(ymlLines.value.join('\n'))
  }
  catch (err) {
    console.error(err)
  }
}
</script>

<template>
  <section v-if="visible" class="friend-link-notice">
    <header class="friend-link-notice__header">
      <h2 class="friend-link-notice__title">
        <span class="friend-link-notice__title-icon" aria-hidden="true">✦</span>
        {{ title }}
      </h2>
      <p v-if="subtitle" class="friend-link-notice__subtitle">
        {{ subtitle }}
      </p>
    </header>

    <div class="friend-link-code">
      <div class="friend-link-code__bar">
        <div class="friend-link-code__dots" aria-hidden="true">
          <span class="dot dot-red" />
          <span class="dot dot-yellow" />
          <span class="dot dot-green" />
        </div>
        <span class="friend-link-code__lang">YML</span>
        <button
          type="button"
          class="friend-link-code__copy"
          title="复制代码"
          @click="copyYml"
        >
          📋
        </button>
      </div>

      <pre class="friend-link-code__body"><code><span
        v-for="(line, index) in ymlLines"
        :key="index"
        class="friend-link-code__line"
      ><span class="friend-link-code__ln">{{ index + 1 }}</span><span class="friend-link-code__text">{{ line }}</span>
</span></code></pre>

      <span class="friend-link-code__cat" aria-hidden="true">🐱</span>
    </div>

    <div class="friend-link-rules">
      <span class="friend-link-rules__plus" aria-hidden="true">+</span>

      <ul class="friend-link-rules__list">
        <li
          v-for="(rule, index) in rules"
          :key="index"
          class="friend-link-rules__item"
        >
          <span class="friend-link-rules__icon">{{ rule.icon }}</span>
          <span>{{ rule.text }}</span>
        </li>
      </ul>

      <div v-if="siteInfoItems.length" class="friend-link-site-info">
        <p class="friend-link-site-info__title">
          <span aria-hidden="true">📍</span>
          {{ siteInfoTitle }}
        </p>
        <ul class="friend-link-site-info__list">
          <li v-for="item in siteInfoItems" :key="item.label">
            {{ item.label }}：<span class="friend-link-highlight">{{ item.value }}</span>
          </li>
        </ul>
      </div>
    </div>
  </section>
</template>

<style lang="scss" scoped>
.friend-link-notice {
  --notice-accent: #c9a0dc;
  --notice-accent-deep: #9b7bb8;
  --notice-pink: #e8a4b8;
  --notice-title: #e07a96;

  width: 100%;
  box-sizing: border-box;

  @at-root html.dark & {
    --notice-accent: #9b7bb8;
    --notice-accent-deep: #b89fd0;
    --notice-title: #f0a8bc;
  }
}

.friend-link-notice__header {
  margin-bottom: 14px;
}

.friend-link-notice__title {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0 0 6px;
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--notice-title);
}

.friend-link-notice__title-icon {
  font-size: 0.95rem;
  line-height: 1;
}

.friend-link-notice__subtitle {
  margin: 0;
  font-size: 0.82rem;
  color: #888;

  @at-root html.dark & {
    color: #b0b0b8;
  }
}

.friend-link-code {
  position: relative;
  overflow: hidden;
  margin-bottom: 16px;
  border-radius: 12px;
  border: 1px solid oklch(0% 0 0 / 12%);
  box-shadow: 0 8px 22px oklch(0% 0 0 / 10%);
  background: #2b303b;
}

.friend-link-code__bar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background: #232733;
  border-bottom: 1px solid oklch(100% 0 0 / 6%);
}

.friend-link-code__dots {
  display: flex;
  gap: 6px;
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.dot-red {
  background: #ff5f57;
}

.dot-yellow {
  background: #febc2e;
}

.dot-green {
  background: #28c840;
}

.friend-link-code__lang {
  flex: 1;
  font-size: 0.82rem;
  font-weight: 700;
  color: #fff;
  letter-spacing: 0.06em;
}

.friend-link-code__copy {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: #c8d0dc;
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease;

  &:hover {
    background: oklch(100% 0 0 / 8%);
    color: #fff;
  }
}

.friend-link-code__body {
  margin: 0;
  padding: 14px 12px 16px;
  overflow-x: auto;
  background: #2b303b;
}

.friend-link-code__body code {
  display: block;
  font-family: 'JetBrains Mono', 'Cascadia Code', Consolas, monospace;
  font-size: 0.78rem;
  line-height: 1.75;
  color: #e6edf3;
  white-space: pre;
}

.friend-link-code__line {
  display: block;
}

.friend-link-code__ln {
  display: inline-block;
  width: 1.6em;
  margin-right: 0.8em;
  color: #6e7681;
  user-select: none;
  text-align: right;
}

.friend-link-code__text {
  color: #e6edf3;
}

.friend-link-code__cat {
  position: absolute;
  right: -4px;
  bottom: 8px;
  font-size: 1.6rem;
  line-height: 1;
  pointer-events: none;
  transform: rotate(-8deg);
}

.friend-link-rules {
  position: relative;
  padding: 16px 14px 16px 18px;
  border-radius: 0 12px 12px 0;
  border-left: 4px solid var(--notice-accent-deep);
  background: oklch(96% 0.015 310 / 88%);

  @at-root html.dark & {
    background: oklch(24% 0.02 300);
    border-left-color: #b89fd0;
  }
}

.friend-link-rules__plus {
  position: absolute;
  left: -13px;
  bottom: 18px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: var(--notice-accent-deep);
  color: #fff;
  font-size: 1rem;
  font-weight: 700;
  line-height: 1;
  box-shadow: 0 2px 8px oklch(0% 0 0 / 15%);
}

.friend-link-rules__list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.friend-link-rules__item {
  display: flex;
  gap: 6px;
  margin-bottom: 10px;
  font-size: 0.82rem;
  line-height: 1.65;
  color: #4a4a52;

  @at-root html.dark & {
    color: #e4e4ea;
  }
}

.friend-link-rules__icon {
  flex-shrink: 0;
}

.friend-link-site-info {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px dashed oklch(0% 0 0 / 10%);

  @at-root html.dark & {
    border-top-color: oklch(100% 0 0 / 14%);
  }
}

.friend-link-site-info__title {
  margin: 0 0 10px;
  font-size: 0.84rem;
  font-weight: 600;
  color: #3a3a42;

  @at-root html.dark & {
    color: #f0f0f4;
  }
}

.friend-link-site-info__list {
  margin: 0;
  padding-left: 1.1em;
  list-style: circle;
}

.friend-link-site-info__list li {
  margin-bottom: 8px;
  font-size: 0.8rem;
  line-height: 1.6;
  color: #4a4a52;
  word-break: break-all;

  @at-root html.dark & {
    color: #d8d8e0;
  }
}

.friend-link-highlight {
  display: inline;
  padding: 1px 6px;
  border-radius: 4px;
  background: oklch(92% 0.04 350);
  color: #3a3a42;

  @at-root html.dark & {
    background: oklch(38% 0.06 350);
    color: #ffe8f0;
  }
}

</style>
