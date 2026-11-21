<!--
  系列页：两层结构
  1) 系列列表：每个系列一张卡片（封面 + 名称 + 简介 + 篇数）
  2) 系列详情：点击卡片后展示该系列下的文章（头条 + 杂志卡片 + 滚动分批）

  系列来源：站点设置 series.items（封面、简介）；文章通过 frontmatter.series 关联。
  文章未单独设封面时，自动沿用它所属系列的封面。
-->
<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { loadDynamicPosts, useDynamicPostsState } from '../composables/useDynamicPosts'
import { useAllMergedPosts } from '../composables/useMergedPostList'
import SeriesCardFeatured from './SeriesCardFeatured.vue'
import SeriesCardMagazine from './SeriesCardMagazine.vue'

interface SeriesItem {
  name: string
  cover: string
  description: string
}

interface Props {
  title?: string
  batchSize?: number
  featured?: boolean
  /** 站点设置里的系列列表（封面 / 简介） */
  items?: SeriesItem[]
}

const props = withDefaults(defineProps<Props>(), {
  title: '系列',
  batchSize: 10,
  featured: true,
  items: () => [],
})

const posts = useAllMergedPosts()
const { loaded } = useDynamicPostsState()

onMounted(() => {
  if (!loaded.value)
    void loadDynamicPosts()
})

/** 系列名：文章 frontmatter 里的 series 字段 */
function seriesOf(post: any): string {
  const raw = post?.series ?? post?.frontmatter?.series
  return typeof raw === 'string' ? raw.trim() : ''
}

function formatDate(value?: string) {
  if (!value)
    return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime()))
    return ''
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}

/** 系列元信息查找表 */
const metaMap = computed(() => {
  const map = new Map<string, SeriesItem>()
  for (const item of props.items || []) {
    if (item?.name)
      map.set(item.name, item)
  }
  return map
})

/** 所有出现过的系列名：以文章里实际使用到的为准，元信息缺失也能显示 */
const allSeries = computed(() => {
  const names = new Set<string>()
  for (const item of props.items || []) {
    if (item?.name)
      names.add(item.name)
  }
  for (const post of posts.value || []) {
    const name = seriesOf(post)
    if (name)
      names.add(name)
  }
  return [...names]
})

/** 系列卡片：带封面、简介、篇数 */
const seriesCards = computed(() =>
  allSeries.value.map((name) => {
    const meta = metaMap.value.get(name)
    const postsOf = (posts.value || []).filter(post => seriesOf(post) === name)
    // 系列封面优先用设置里的；没有则取该系列第一篇有封面的文章
    const fallbackCover = postsOf.find(post => typeof post.cover === 'string' && post.cover)?.cover || ''
    return {
      name,
      cover: meta?.cover || fallbackCover || '',
      description: meta?.description || '',
      count: postsOf.length,
    }
  }).sort((a, b) => b.count - a.count),
)

/* ---------- 详情视图 ---------- */
const activeSeries = ref<string>('')

const currentMeta = computed(() => (activeSeries.value ? metaMap.value.get(activeSeries.value) : undefined))

/** 当前系列的文章：按时间正序推算期号，再反转成最新在前 */
const issues = computed(() => {
  const name = activeSeries.value
  if (!name)
    return []
  return (posts.value || [])
    .filter(post => seriesOf(post) === name)
    .slice()
    .sort((a, b) => new Date(a.date || 0).getTime() - new Date(b.date || 0).getTime())
    .map((post, index) => {
      const rawOrder = (post as any)?.seriesOrder
      const order = Number.isFinite(Number(rawOrder)) && Number(rawOrder) > 0 ? Number(rawOrder) : index + 1
      // 文章封面 → 系列封面 → 空
      const postCover = typeof post.cover === 'string' && post.cover ? post.cover : ''
      return {
        issue: order,
        title: post.title || '未命名',
        link: post.path || post.url || '#',
        date: formatDate(post.date),
        excerpt: post.excerpt || post.description || '',
        cover: postCover || currentMeta.value?.cover || '',
        tags: Array.isArray(post.tags) ? post.tags : [],
      }
    })
    .reverse()
})

const featuredIssue = computed(() => (props.featured ? issues.value[0] : null))
const restIssues = computed(() => (props.featured ? issues.value.slice(1) : issues.value))

/** 分批展示 */
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

watch(activeSeries, () => {
  visibleCount.value = batchSize.value
  if (activeSeries.value)
    setupObserver()
})

onMounted(() => setTimeout(setupObserver, 0))
onUnmounted(() => observer?.disconnect())
</script>

<template>
  <div class="series-board">
    <!-- 系列列表 -->
    <template v-if="!activeSeries">
      <header class="series-board__head">
        <h2 class="series-board__title">{{ title }}</h2>
        <p v-if="seriesCards.length" class="series-board__meta">共 {{ seriesCards.length }} 个系列</p>
      </header>

      <p v-if="!seriesCards.length" class="series-board__empty">
        暂无系列。在后台「系列管理」里新建系列，并在文章里把「加入系列」设为该系列名即可。
      </p>

      <div v-else class="series-grid">
        <a
          v-for="card in seriesCards"
          :key="card.name"
          class="series-card"
          href="#"
          @click.prevent="activeSeries = card.name"
        >
          <div class="series-card__cover">
            <img v-if="card.cover" :src="card.cover" :alt="card.name" loading="lazy" decoding="async">
            <div v-else class="series-card__cover--placeholder" />
            <span class="series-card__count">{{ card.count }} 篇</span>
          </div>
          <div class="series-card__body">
            <h3 class="series-card__name">{{ card.name }}</h3>
            <p v-if="card.description" class="series-card__desc">{{ card.description }}</p>
          </div>
        </a>
      </div>
    </template>

    <!-- 系列详情 -->
    <template v-else>
      <header class="series-detail__head">
        <button type="button" class="series-detail__back" @click="activeSeries = ''">
          <span class="i-ri-arrow-left-line" aria-hidden="true" />
          返回系列列表
        </button>
        <h2 class="series-detail__title">{{ activeSeries }}</h2>
        <p v-if="currentMeta?.description" class="series-detail__desc">{{ currentMeta.description }}</p>
        <p class="series-detail__meta">共 {{ issues.length }} 篇</p>
      </header>

      <p v-if="!issues.length" class="series-board__empty">该系列下暂无文章</p>

      <template v-else>
        <SeriesCardFeatured
          v-if="featuredIssue"
          :title="featuredIssue.title"
          :link="featuredIssue.link"
          :date="featuredIssue.date"
          :excerpt="featuredIssue.excerpt"
          :cover="featuredIssue.cover"
          :tags="featuredIssue.tags"
          :issue="featuredIssue.issue"
        />

        <div class="series-post-list">
          <SeriesCardMagazine
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

        <div ref="sentinelRef" class="series-sentinel" aria-hidden="true" />

        <button v-if="hasMore" type="button" class="series-load-more" @click="loadMore">
          加载更多
        </button>
      </template>
    </template>
  </div>
</template>

<style lang="scss" scoped>
.series-board {
  width: 100%;

  &__head {
    text-align: center;
    margin-bottom: 1.5rem;
  }

  &__title {
    margin: 0;
    font-size: 1.75rem;
    font-weight: 800;
    letter-spacing: 0.2em;
    text-indent: 0.2em;
  }

  &__meta {
    margin: 0.3rem 0 0;
    font-size: 0.8125rem;
    color: var(--va-c-text-light);
  }

  &__empty {
    margin: 2rem 0;
    text-align: center;
    color: var(--va-c-text-light);
  }
}

.series-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 1.1rem;
}

.series-card {
  display: flex;
  flex-direction: column;
  border-radius: 16px;
  overflow: hidden;
  background: var(--sakura-post-card-bg, var(--va-c-bg-soft));
  border: 1px solid var(--sakura-color-divider, rgba(0, 0, 0, 0.1));
  color: inherit;
  text-decoration: none;
  transition: transform 0.25s ease, box-shadow 0.25s ease;

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 12px 28px rgba(0, 0, 0, 0.1);

    .series-card__name {
      color: var(--va-c-primary);
    }
  }

  &__cover {
    position: relative;
    width: 100%;
    aspect-ratio: 16 / 10;
    overflow: hidden;
    background: var(--va-c-bg-soft);

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }

    &--placeholder {
      width: 100%;
      height: 100%;
      background: linear-gradient(135deg, rgba(0, 0, 0, 0.08), rgba(0, 0, 0, 0.02));
    }
  }

  &__count {
    position: absolute;
    right: 0.6rem;
    bottom: 0.6rem;
    padding: 0.1rem 0.5rem;
    border-radius: 999px;
    background: rgba(0, 0, 0, 0.55);
    color: #fff;
    font-size: 0.6875rem;
  }

  &__body {
    padding: 0.8rem 1rem 1rem;
  }

  &__name {
    margin: 0;
    font-size: 1.05rem;
    font-weight: 700;
    transition: color 0.2s ease;
  }

  &__desc {
    margin: 0.35rem 0 0;
    font-size: 0.8125rem;
    line-height: 1.55;
    color: var(--va-c-text-light);
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
}

.series-detail {
  &__head {
    margin-bottom: 1.5rem;
  }

  &__back {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.3rem 0.7rem;
    margin-bottom: 0.8rem;
    border-radius: 999px;
    border: 1px solid var(--sakura-color-divider, rgba(0, 0, 0, 0.15));
    background: transparent;
    color: inherit;
    font-size: 0.8125rem;
    cursor: pointer;

    &:hover {
      border-color: var(--va-c-primary);
      color: var(--va-c-primary);
    }
  }

  &__title {
    margin: 0;
    font-size: 1.6rem;
    font-weight: 800;
  }

  &__desc {
    margin: 0.4rem 0 0;
    font-size: 0.875rem;
    line-height: 1.6;
    color: var(--va-c-text-light);
  }

  &__meta {
    margin: 0.3rem 0 0;
    font-size: 0.8125rem;
    color: var(--va-c-text-light);
  }
}

.series-post-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.series-sentinel {
  height: 1px;
}

.series-load-more {
  display: block;
  margin: 1.25rem auto 0;
  padding: 0.45rem 1.4rem;
  border-radius: 999px;
  border: 1px solid var(--sakura-color-divider, rgba(0, 0, 0, 0.15));
  background: transparent;
  color: inherit;
  font-size: 0.8125rem;
  cursor: pointer;

  &:hover {
    border-color: var(--va-c-primary);
    color: var(--va-c-primary);
  }
}
</style>
