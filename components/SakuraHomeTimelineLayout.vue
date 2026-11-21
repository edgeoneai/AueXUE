<!--
  首页 timeline 布局：按时间轴排列文章（左侧年月、右侧卡片、中间轴点）。
  受后台「站点设置 → 首页布局」控制：layout = timeline。
-->
<script setup lang="ts">
import { computed } from 'vue'
import { useMergedPostList } from '../composables/useMergedPostList'

const posts = useMergedPostList()

const items = computed(() =>
  (posts.value || []).map((post) => {
    const raw = post.date ? new Date(post.date) : null
    const valid = raw && !Number.isNaN(raw.getTime())
    return {
      title: post.title || '未命名',
      link: post.path || post.url || '#',
      year: valid ? String(raw.getFullYear()) : '',
      md: valid ? `${String(raw.getMonth() + 1).padStart(2, '0')}-${String(raw.getDate()).padStart(2, '0')}` : '',
      excerpt: post.excerpt || post.description || '',
      tags: Array.isArray(post.tags) ? post.tags.slice(0, 3) : [],
    }
  }),
)
</script>

<template>
  <div id="home-post-list" class="home-timeline">
    <ol v-if="items.length" class="home-timeline__list">
      <li v-for="item in items" :key="item.link" class="home-timeline__item">
        <div class="home-timeline__stamp">
          <span class="home-timeline__year">{{ item.year }}</span>
          <span class="home-timeline__md">{{ item.md }}</span>
        </div>

        <span class="home-timeline__dot" aria-hidden="true" />

        <a class="home-timeline__card" :href="item.link">
          <h3 class="home-timeline__title">{{ item.title }}</h3>
          <p v-if="item.excerpt" class="home-timeline__excerpt">{{ item.excerpt }}</p>
          <div v-if="item.tags.length" class="home-timeline__tags">
            <span v-for="tag in item.tags" :key="tag" class="home-timeline__tag">{{ tag }}</span>
          </div>
        </a>
      </li>
    </ol>

    <p v-else class="home-timeline__empty">
      暂无文章
    </p>
  </div>
</template>

<style lang="scss" scoped>
.home-timeline {
  width: 100%;

  &__list {
    position: relative;
    margin: 0;
    padding: 0;
    list-style: none;

    /* 中间竖轴 */
    &::before {
      content: '';
      position: absolute;
      top: 0;
      bottom: 0;
      left: 108px;
      width: 2px;
      background: var(--sakura-color-divider, rgba(0, 0, 0, 0.12));
    }
  }

  &__item {
    position: relative;
    display: flex;
    align-items: flex-start;
    gap: 1.5rem;
    padding-bottom: 1.25rem;
  }

  &__stamp {
    flex: none;
    width: 92px;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    padding-top: 0.5rem;
    line-height: 1.2;
  }

  &__year {
    font-size: 0.8125rem;
    font-weight: 700;
    color: var(--va-c-primary);
    font-variant-numeric: tabular-nums;
  }

  &__md {
    font-size: 0.6875rem;
    color: var(--va-c-text-light);
    font-variant-numeric: tabular-nums;
  }

  &__dot {
    position: absolute;
    left: 104px;
    top: 0.85rem;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: var(--va-c-primary);
    box-shadow: 0 0 0 3px var(--va-c-bg, #fff);
  }

  &__card {
    flex: 1 1 auto;
    min-width: 0;
    margin-left: 0.9rem;
    padding: 0.85rem 1rem;
    border-radius: 12px;
    background: var(--sakura-post-card-bg, var(--va-c-bg-soft));
    border: 1px solid var(--sakura-color-divider, rgba(0, 0, 0, 0.1));
    color: inherit;
    text-decoration: none;
    transition: transform 0.2s ease, box-shadow 0.2s ease;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08);

      .home-timeline__title {
        color: var(--va-c-primary);
      }
    }
  }

  &__title {
    margin: 0 0 0.3rem;
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
    margin-top: 0.4rem;
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
  .home-timeline__list::before {
    left: 8px;
  }

  .home-timeline__stamp {
    display: none;
  }

  .home-timeline__dot {
    left: 4px;
  }

  .home-timeline__card {
    margin-left: 1.6rem;
  }
}
</style>
