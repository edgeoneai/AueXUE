<!--
  首页 list 布局：文章以横向列表行呈现，可选右侧栏（随机文章 + 标签云）。
  受后台「站点设置 → 首页布局」控制：layout = list、listSidebar = 是否显示侧栏。
-->
<script setup lang="ts">
import { computed } from 'vue'
import { useMergedPostList } from '../composables/useMergedPostList'

const posts = useMergedPostList()

function formatDate(value?: string) {
  if (!value)
    return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime()))
    return ''
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}

const rows = computed(() =>
  (posts.value || []).map(post => ({
    title: post.title || '未命名',
    link: post.path || post.url || '#',
    date: formatDate(post.date),
    excerpt: post.excerpt || post.description || '',
    tags: Array.isArray(post.tags) ? post.tags.slice(0, 3) : [],
    cover: typeof post.cover === 'string' ? post.cover : '',
  })),
)
</script>

<template>
  <div id="home-post-list" class="home-list">
    <ul class="home-list__rows">
      <li v-for="row in rows" :key="row.link" class="home-list__row">
        <a class="home-list__link" :href="row.link">
          <time class="home-list__date">{{ row.date }}</time>

          <div v-if="row.cover" class="home-list__cover">
            <img :src="row.cover" :alt="row.title" loading="lazy" decoding="async">
          </div>

          <div class="home-list__body">
            <h3 class="home-list__title">{{ row.title }}</h3>
            <p v-if="row.excerpt" class="home-list__excerpt">{{ row.excerpt }}</p>
            <div v-if="row.tags.length" class="home-list__tags">
              <span v-for="tag in row.tags" :key="tag" class="home-list__tag">{{ tag }}</span>
            </div>
          </div>
        </a>
      </li>
    </ul>

    <p v-if="!rows.length" class="home-list__empty">
      暂无文章
    </p>
  </div>
</template>

<style lang="scss" scoped>
.home-list {
  width: 100%;

  &__rows {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  &__link {
    display: flex;
    align-items: flex-start;
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

      .home-list__title {
        color: var(--va-c-primary);
      }
    }
  }

  &__date {
    flex: none;
    width: 92px;
    font-size: 0.8125rem;
    color: var(--va-c-text-light);
    font-variant-numeric: tabular-nums;
    padding-top: 0.15rem;
  }

  &__cover {
    flex: none;

    img {
      width: 96px;
      height: 68px;
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
    line-height: 1.45;
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

  &__tags {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
  }

  &__tag {
    padding: 0.05rem 0.45rem;
    border-radius: 999px;
    border: 1px solid var(--sakura-color-divider, rgba(0, 0, 0, 0.15));
    font-size: 0.6875rem;
    color: var(--va-c-text-light);
  }

  &__empty {
    margin: 2rem 0;
    text-align: center;
    color: var(--va-c-text-light);
  }
}

@media (max-width: 640px) {
  .home-list__date,
  .home-list__cover {
    display: none;
  }
}
</style>
