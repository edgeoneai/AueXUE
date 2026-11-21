<!--
  周刊：杂志风格版头 + 期号列表。
  数据直接复用文章列表，按 frontmatter categories 里的「周刊」筛出，
  不引入新数据源，因此在后台发文章时带上该分类即可。
-->
<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useAllMergedPosts } from '../composables/useMergedPostList'
import { loadDynamicPosts, useDynamicPostsState } from '../composables/useDynamicPosts'

interface Props {
  /** 用于识别周刊的分类名，默认「周刊」 */
  category?: string
}
const props = withDefaults(defineProps<Props>(), { category: '周刊' })

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

const weeklyPosts = computed(() =>
  (posts.value || [])
    .filter(post => categoriesOf(post).includes(props.category))
    .slice()
    .sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime()),
)

function formatDate(value?: string) {
  if (!value)
    return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime()))
    return ''
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}

/** 期号：从最早一期开始编号，最新一期号最大 */
const issues = computed(() =>
  weeklyPosts.value
    .slice()
    .reverse()
    .map((post, index) => ({
      no: index + 1,
      post,
      date: formatDate(post.date),
      link: post.path || post.url || '#',
      title: post.title || '未命名',
      excerpt: post.excerpt || post.description || '',
      cover: typeof post.cover === 'string' ? post.cover : '',
      tags: Array.isArray(post.tags) ? post.tags.slice(0, 3) : [],
    }))
    .reverse(),
)

const latestDate = computed(() => issues.value[0]?.date || '')
</script>

<template>
  <div class="weekly-board">
    <header class="weekly-masthead">
      <div class="weekly-masthead__rule" aria-hidden="true" />
      <h2 class="weekly-masthead__title">周刊</h2>
      <div v-if="issues.length" class="weekly-masthead__meta">
        <span>共 {{ issues.length }} 期</span>
        <span v-if="latestDate">最新 {{ latestDate }}</span>
      </div>
      <div class="weekly-masthead__rule" aria-hidden="true" />
    </header>

    <p v-if="!issues.length" class="weekly-board__empty">
      暂无周刊。在后台发布文章时，把分类设为「{{ category }}」即可出现在这里。
    </p>

    <ol v-else class="weekly-list">
      <li v-for="item in issues" :key="item.link" class="weekly-item">
        <a class="weekly-item__link" :href="item.link">
          <div class="weekly-item__no">
            <span class="weekly-item__no-label">ISSUE</span>
            <span class="weekly-item__no-value">{{ String(item.no).padStart(3, '0') }}</span>
          </div>

          <div v-if="item.cover" class="weekly-item__cover">
            <img :src="item.cover" :alt="item.title" loading="lazy" decoding="async">
          </div>

          <div class="weekly-item__body">
            <h3 class="weekly-item__title">{{ item.title }}</h3>
            <p v-if="item.excerpt" class="weekly-item__excerpt">{{ item.excerpt }}</p>
            <div class="weekly-item__foot">
              <time class="weekly-item__date">{{ item.date }}</time>
              <span v-for="tag in item.tags" :key="tag" class="weekly-item__tag">{{ tag }}</span>
            </div>
          </div>
        </a>
      </li>
    </ol>
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

.weekly-list {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.weekly-item {
  &__link {
    display: flex;
    gap: 1rem;
    padding: 0.9rem 1rem;
    border-radius: 12px;
    background: var(--sakura-post-card-bg, var(--va-c-bg-soft));
    border: 1px solid var(--sakura-color-divider, rgba(0, 0, 0, 0.1));
    color: inherit;
    text-decoration: none;
    transition: transform 0.2s ease, box-shadow 0.2s ease;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08);

      .weekly-item__title {
        color: var(--va-c-primary);
      }
    }
  }

  &__no {
    flex: none;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 62px;
    border-right: 1px solid var(--sakura-color-divider, rgba(0, 0, 0, 0.1));
    padding-right: 0.75rem;
  }

  &__no-label {
    font-size: 0.625rem;
    letter-spacing: 0.1em;
    opacity: 0.55;
  }

  &__no-value {
    font-size: 1.1rem;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
    color: var(--va-c-primary);
  }

  &__cover {
    flex: none;

    img {
      width: 88px;
      height: 62px;
      object-fit: cover;
      border-radius: 8px;
      display: block;
    }
  }

  &__body {
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
  }

  &__title {
    margin: 0;
    font-size: 1rem;
    line-height: 1.4;
    transition: color 0.2s ease;
  }

  &__excerpt {
    margin: 0;
    font-size: 0.8125rem;
    line-height: 1.55;
    color: var(--va-c-text-light);
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  &__foot {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.75rem;
  }

  &__date {
    color: var(--va-c-text-light);
    font-variant-numeric: tabular-nums;
  }

  &__tag {
    padding: 0.05rem 0.45rem;
    border-radius: 999px;
    border: 1px solid var(--sakura-color-divider, rgba(0, 0, 0, 0.15));
    color: var(--va-c-text-light);
  }
}

@media (max-width: 640px) {
  .weekly-item__cover {
    display: none;
  }
}
</style>
