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
        <div class="sakura-header-title" flex="~">
          <SakuraTitle :fm="frontmatter" />
        </div>
      </div>
    </header>

    <div class="bangumi-page-main">
      <div class="content sakura-page-content">
        <RouterView v-slot="{ Component }">
          <component :is="Component">
            <template #main-content>
              <BangumiBoard />
            </template>
          </component>
        </RouterView>
      </div>
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
}
</style>
