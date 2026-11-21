<script setup lang="ts">
import { useFrontmatter } from 'valaxy'
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import BangumiBoard from '../BangumiBoard.vue'

const route = useRoute()
const staticFrontmatter = useFrontmatter()

const frontmatter = computed(() => {
  const routeFrontmatter = (route.meta.frontmatter || {}) as Record<string, unknown>
  const base = { ...(staticFrontmatter.value || {}), ...routeFrontmatter }
  return {
    ...base,
    title: String(base.title || '追番'),
    icon: String(base.icon || 'i-ri-tv-2-line'),
  }
})
</script>

<template>
  <article class="sakura-page sakura-bangumi-page">
    <header class="bangumi-page-header">
      <div class="bangumi-page-header__inner sakura-safe-padding">
        <h1 class="bangumi-page-header__title">
          <span :class="frontmatter.icon" aria-hidden="true" />
          {{ frontmatter.title }}
        </h1>
      </div>
    </header>

    <div class="bangumi-page-main sakura-safe-padding">
      <BangumiBoard />
    </div>
  </article>
</template>

<style lang="scss" scoped>
.sakura-bangumi-page {
  width: 100%;
  max-width: 1200px;
  margin-inline: auto;
  padding-block: 24px;
}

.bangumi-page-header {
  margin-bottom: 1.5rem;

  &__title {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin: 0;
    font-size: 1.5rem;
    font-weight: 700;
  }
}

.bangumi-page-main {
  width: 100%;
}
</style>
