<script setup lang="ts">
import { useFrontmatter } from 'valaxy'
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import WeeklyMasthead from '../WeeklyMasthead.vue'

const route = useRoute()
const staticFrontmatter = useFrontmatter()

const frontmatter = computed(() => {
  const routeFrontmatter = (route.meta.frontmatter || {}) as Record<string, unknown>
  const base = { ...(staticFrontmatter.value || {}), ...routeFrontmatter }
  return { ...base, title: String(base.title || '周刊') }
})
</script>

<template>
  <article class="sakura-page sakura-weekly-page">
    <div class="weekly-page-content sakura-safe-padding">
      <WeeklyMasthead :category="String(frontmatter.weeklyCategory || '周刊')" />
    </div>
  </article>
</template>

<style lang="scss" scoped>
.sakura-weekly-page {
  width: 100%;
  max-width: 880px;
  margin-inline: auto;
  padding-block: 24px;
}
</style>
