<!--
  list 布局的右侧栏：随机文章 + 标签云。
  随机文章只在客户端挑选，SSG/SSR 首帧固定取前若干篇，避免水合不一致。
-->
<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useAllMergedPosts } from '../composables/useMergedPostList'

const allPosts = useAllMergedPosts()
const randomPosts = ref<Array<{ title: string, link: string }>>([])

const SAMPLE_SIZE = 5

function pickRandom() {
  const list = (allPosts.value || []).map(post => ({
    title: post.title || '未命名',
    link: post.path || post.url || '#',
  }))
  if (list.length <= SAMPLE_SIZE) {
    randomPosts.value = list
    return
  }
  const pool = [...list]
  const picked: typeof list = []
  for (let i = 0; i < SAMPLE_SIZE; i++) {
    const index = Math.floor(Math.random() * pool.length)
    picked.push(pool.splice(index, 1)[0])
  }
  randomPosts.value = picked
}

onMounted(pickRandom)

/** 标签云：按出现次数排序取前 30 个 */
const tagItems = computed(() => {
  const counter = new Map<string, number>()
  for (const post of allPosts.value || []) {
    const tags = Array.isArray(post.tags) ? post.tags : []
    for (const tag of tags) {
      if (typeof tag !== 'string')
        continue
      counter.set(tag, (counter.get(tag) || 0) + 1)
    }
  }
  return [...counter.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 30)
    .map(([name, count]) => ({ name, count, link: `/tags/?tag=${encodeURIComponent(name)}` }))
})
</script>

<template>
  <div class="home-sidebar">
    <section v-if="randomPosts.length" class="home-sidebar__card">
      <h3 class="home-sidebar__title">随机文章</h3>
      <ul class="home-sidebar__random">
        <li v-for="item in randomPosts" :key="item.link">
          <a :href="item.link">{{ item.title }}</a>
        </li>
      </ul>
    </section>

    <section v-if="tagItems.length" class="home-sidebar__card">
      <h3 class="home-sidebar__title">标签云</h3>
      <div class="home-sidebar__tags">
        <a
          v-for="item in tagItems"
          :key="item.name"
          class="home-sidebar__tag"
          :href="item.link"
        >
          {{ item.name }}
          <span class="home-sidebar__count">{{ item.count }}</span>
        </a>
      </div>
    </section>
  </div>
</template>

<style lang="scss" scoped>
.home-sidebar {
  display: flex;
  flex-direction: column;
  gap: 1rem;

  &__card {
    padding: 0.9rem 1rem;
    border-radius: 12px;
    background: var(--sakura-post-card-bg, var(--va-c-bg-soft));
    border: 1px solid var(--sakura-color-divider, rgba(0, 0, 0, 0.1));
  }

  &__title {
    margin: 0 0 0.6rem;
    font-size: 0.9rem;
    font-weight: 700;
  }

  &__random {
    margin: 0;
    padding: 0;
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 0.45rem;

    a {
      font-size: 0.8125rem;
      color: inherit;
      text-decoration: none;
      line-height: 1.45;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;

      &:hover {
        color: var(--va-c-primary);
      }
    }
  }

  &__tags {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
  }

  &__tag {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.1rem 0.5rem;
    border-radius: 999px;
    border: 1px solid var(--sakura-color-divider, rgba(0, 0, 0, 0.15));
    font-size: 0.75rem;
    color: inherit;
    text-decoration: none;

    &:hover {
      border-color: var(--va-c-primary);
      color: var(--va-c-primary);
    }
  }

  &__count {
    font-size: 0.625rem;
    opacity: 0.6;
    font-variant-numeric: tabular-nums;
  }
}
</style>
