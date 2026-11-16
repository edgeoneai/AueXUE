<script lang="ts" setup>
import type { Post } from 'valaxy'
import { computed } from 'vue'

const props = defineProps<{
  post: Post
}>()

/**
 * 卡片上展示"更新于"。
 *
 * 主题原版无条件渲染 `<SakuraPostDate :date="post.updated" />`，
 * 而 updated 可能为 null（文章没写 updated/lastmod 字段），
 * 此时日期格式化会得到 Invalid Date。
 *
 * 这里做两层兜底：
 * 1. updated 为空时回落到 date，仍显示一个有意义的日期；
 * 2. 两者都为空则不渲染这一行，避免出现空标签。
 */
const displayDate = computed(() => props.post.updated || props.post.date || '')
const hasDate = computed(() => {
  if (!displayDate.value)
    return false
  return !Number.isNaN(new Date(displayDate.value).getTime())
})
</script>

<template>
  <div class="sakura-post-card-info">
    <SakuraPostDate v-if="hasDate" :date="displayDate" class="post-date order-1" pb-4 text-sm />
    <SakuraPostTitle pb-4 class="order-2" :title="post.title" :to="post.path" />
    <SakuraPostMeta pb-2 class="order-3" :post />
    <SakuraPostExcerpt v-if="post?.excerpt" pb-2 class="order-4" :excerpt="post.excerpt" />
  </div>
</template>

<style lang="scss">
.sakura-post-card-info {
  .post-date {
    font-size: 12px;
    color: var(--sakura-color-text);
  }
}
</style>
