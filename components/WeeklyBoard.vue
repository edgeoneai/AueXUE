<!--
  周刊主面板（移植自上游 posts/weekly/list.html + weekly-load-more）：
  杂志版头 → 头条（可关）→ 杂志卡片列表 → 滚动到底自动追加下一批。

  数据来自普通文章，按 frontmatter.categories 匹配后台设置的「归入分类」，
  期号优先取文章 frontmatter.issue，否则按时间正序推算。
-->
<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { loadDynamicPosts, useDynamicPostsState } from '../composables/useDynamicPosts'
import { useAllMergedPosts } from '../composables/useMergedPostList'
import WeeklyCardFeatured from './WeeklyCardFeatured.vue'
import WeeklyCardMagazine from './WeeklyCardMagazine.vue'

interface Props {
  title?: string
  category?: string
  batchSize?: number
  featured?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  title: '周刊',
  category: '周刊',
  batchSize: 10,
  featured: true,
})

const posts = useAllMergedPosts()
const { loaded } = useDynamicPostsState()

onMounted(() => {
  if (!loaded.value)
    void loadDynamicPosts()
})

/** 分类字段可能是字符串或数组，统一成数组再匹配 */
function categoriesOf(post: any): string[] {
  const raw = post?.categories
  if (typeof raw === 'string')
    return [raw]
  return Array.isArray(raw) ? raw.map((item: unknown) => String(item)) : []
}

function formatDate(value?: string) {
  if (!value)
    return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime()))
    return ''
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}

/** 全部周刊文章：按时间正序（旧→新）以便稳定推算期号 */
const ordered = computed(() =>
  (posts.value || [])
    .filter(post => categoriesOf(post).includes(props.category))
    .slice()
    .sort((a, b) => new Date(a.date || 0).getTime() - new Date(b.date || 0).getTime()),
)

/** 最新在最上面；期号从最早一篇算 1 */
const issues = computed(() =>
  ordered.value
    .map((post, index) => {
      const rawIssue = (post as any)?.issue
      const issue = Number.isFinite(Number(rawIssue)) && Number(rawIssue) > 0
        ? Number(rawIssue)
        : index + 1
      return {
        issue,
        title: post.title || '未命名',
        link: post.path || post.url || '#',
        date: formatDate(post.date),
        excerpt: post.excerpt || post.description || '',
        cover: typeof post.cover === 'string' ? post.cover : '',
        tags: Array.isArray(post.tags) ? post.tags : [],
      }
    })
    .reverse(),
)

const featuredIssue = computed(() => (props.featured ? issues.value[0] : null))
const restIssues = computed(() => (props.featured ? issues.value.slice(1) : issues.value))

/** 分批展示：初始一批，滚动到底再追加 */
const visibleCount = ref(0)
const sentinelRef = ref<HTMLElement | null>(null)
let observer: IntersectionObserver | null = null

const batchSize = computed(() => Math.max(1, Math.min(50, Number(props.batchSize) || 10)))
const visibleIssues = computed(() => restIssues.value.slice(0, visibleCount.value || batchSize.value))
const hasMore = computed(() => visibleIssues.value.length < restIssues.value.length)

function loadMore() {
  if (!hasMore.value)
    return
  visibleCount.value = (visibleCount.value || batchSize.value) + batchSize.value
}

function setupObserver() {
  if (typeof window === 'undefined' || !('IntersectionObserver' in window))
    return
  observer?.disconnect()
  if (!sentinelRef.value)
    return
  observer = new IntersectionObserver((entries) => {
    if (entries.some(entry => entry.isIntersecting))
      loadMore()
  }, { rootMargin: '200px' })
  observer.observe(sentinelRef.value)
}

watch([restIssues, batchSize], () => {
  visibleCount.value = batchSize.value
  setupObserver()
}, { immediate: true })

onMounted(() => {
  // 数据异步到达后再挂观察器
  setTimeout(setupObserver, 0)
})

onUnmounted(() => observer?.disconnect())

const latestDate = computed(() => issues.value[0]?.date || '')
</script>

<template>
  <div class="weekly-board">
    <header class="weekly-masthead">
      <div class="weekly-masthead__rule" aria-hidden="true" />
      <h2 class="weekly-masthead__title">{{ title }}</h2>
      <div v-if="issues.length" class="weekly-masthead__meta">
        <span>共 {{ issues.length }} 期</span>
        <span v-if="latestDate">最新 {{ latestDate }}</span>
      </div>
      <div class="weekly-masthead__rule" aria-hidden="true" />
    </header>

    <p v-if="!issues.length" class="weekly-board__empty">
      暂无周刊。在后台发布文章时，把分类设为「{{ category }}」即可出现在这里。
    </p>

    <template v-else>
      <WeeklyCardFeatured
        v-if="featuredIssue"
        :title="featuredIssue.title"
        :link="featuredIssue.link"
        :date="featuredIssue.date"
        :excerpt="featuredIssue.excerpt"
        :cover="featuredIssue.cover"
        :tags="featuredIssue.tags"
        :issue="featuredIssue.issue"
      />

      <div class="weekly-post-list">
        <WeeklyCardMagazine
          v-for="(item, index) in visibleIssues"
          :key="item.link"
          :title="item.title"
          :link="item.link"
          :date="item.date"
          :excerpt="item.excerpt"
          :cover="item.cover"
          :tags="item.tags"
          :issue="item.issue"
          :reverse="index % 2 === 1"
        />
      </div>

      <div ref="sentinelRef" class="weekly-scroll-sentinel" aria-hidden="true" />

      <button
        v-if="hasMore"
        type="button"
        class="weekly-load-more"
        @click="loadMore"
      >
        加载更多
      </button>
    </template>
  </div>
</template>

<style lang="scss" scoped>
.weekly-board {
  width: 100%;

  &__empty {
    margin: 2rem 0;
    text-align: center;
    color: var(--va-c-text-light);
  }
}

.weekly-masthead {
  margin-bottom: 1.75rem;
  text-align: center;

  &__rule {
    height: 1px;
    margin: 0.6rem 0;
    background: currentColor;
    opacity: 0.25;
  }

  &__title {
    margin: 0;
    font-size: 1.75rem;
    font-weight: 800;
    letter-spacing: 0.4em;
    text-indent: 0.4em;
  }

  &__meta {
    display: flex;
    justify-content: center;
    gap: 0.9rem;
    font-size: 0.8125rem;
    color: var(--va-c-text-light);
  }
}

.weekly-post-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.weekly-scroll-sentinel {
  height: 1px;
}

.weekly-load-more {
  display: block;
  margin: 1.25rem auto 0;
  padding: 0.45rem 1.4rem;
  border-radius: 999px;
  border: 1px solid var(--sakura-color-divider, rgba(0, 0, 0, 0.15));
  background: transparent;
  color: inherit;
  font-size: 0.8125rem;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: var(--va-c-primary);
    color: var(--va-c-primary);
  }
}
</style>
