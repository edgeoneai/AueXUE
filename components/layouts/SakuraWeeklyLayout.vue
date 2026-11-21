<script setup lang="ts">
import { useFrontmatter } from 'valaxy'
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useSiteSettings } from '../../composables/useSiteSettings'
import WeeklyMasthead from '../WeeklyMasthead.vue'

const route = useRoute()
const staticFrontmatter = useFrontmatter()
const { settings, loaded, loadSettings } = useSiteSettings()

onMounted(() => {
  if (!loaded.value)
    void loadSettings()
})

/** 页面标题与归类分类由后台「站点设置 → 周刊页」决定，未取到时回落默认值 */
const weekly = computed(() => settings.value?.weekly)

const title = computed(() => {
  if (weekly.value?.title)
    return weekly.value.title
  const routeFrontmatter = (route.meta.frontmatter || {}) as Record<string, unknown>
  const base = { ...(staticFrontmatter.value || {}), ...routeFrontmatter }
  return String(base.title || '周刊')
})

const category = computed(() => weekly.value?.category || '周刊')
const enabled = computed(() => weekly.value?.enable !== false)
</script>

<template>
  <article class="sakura-page sakura-weekly-page">
    <div class="weekly-page-content sakura-safe-padding">
      <p v-if="!enabled" class="weekly-disabled">
        周刊页未启用，可在后台「站点设置 → 周刊页」开启。
      </p>
      <WeeklyMasthead v-else :title="title" :category="category" />
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

.weekly-disabled {
  margin: 2rem 0;
  text-align: center;
  color: var(--va-c-text-light);
}
</style>
