<script setup lang="ts">
import { useFrontmatter } from 'valaxy'
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useSiteSettings } from '../../composables/useSiteSettings'
import SeriesBoard from '../SeriesBoard.vue'

const route = useRoute()
const staticFrontmatter = useFrontmatter()
const { settings, loaded, loadSettings } = useSiteSettings()

onMounted(() => {
  if (!loaded.value)
    void loadSettings()
})

const series = computed(() => settings.value?.series)
const SERIES_PAGE_COVER = '/series/cover.png'

const frontmatter = computed(() => {
  const routeFrontmatter = (route.meta.frontmatter || {}) as Record<string, unknown>
  const base = { ...(staticFrontmatter.value || {}), ...routeFrontmatter }
  return {
    ...base,
    title: series.value?.title || String(base.title || '系列'),
    icon: String(base.icon || 'i-ri-stack-line'),
    cover: typeof base.cover === 'string' && base.cover.trim() ? base.cover : SERIES_PAGE_COVER,
  }
})

const coverSrc = computed(() => frontmatter.value.cover)
const enabled = computed(() => series.value?.enable !== false)
const batchSize = computed(() => series.value?.batchSize || 10)
const featured = computed(() => series.value?.featured !== false)
const items = computed(() => series.value?.items || [])
</script>

<template>
  <article class="sakura-page sakura-series-page">
    <header
      class="series-page-header sakura-page-header"
      :class="{ 'has-cover': coverSrc }"
    >
      <img
        v-if="coverSrc"
        class="series-page-header__cover"
        :src="coverSrc"
        :alt="frontmatter.title || '系列页头图'"
        loading="eager"
        decoding="async"
      >

      <div class="series-page-header__inner sakura-safe-padding">
        <div class="sakura-header-title" flex="~">
          <SakuraTitle :fm="frontmatter" />
        </div>
      </div>
    </header>

    <div class="series-page-main">
      <div class="content sakura-page-content">
        <RouterView v-slot="{ Component }">
          <component :is="Component">
            <template #main-content>
              <p v-if="!enabled" class="series-disabled">
                系列页未启用，可在后台「系列管理」开启。
              </p>
              <SeriesBoard
                v-else
                :title="frontmatter.title"
                :batch-size="batchSize"
                :featured="featured"
                :items="items"
              />
            </template>
          </component>
        </RouterView>
      </div>
    </div>
  </article>
</template>

<style lang="scss" scoped>
.sakura-series-page {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: stretch;
}

.series-page-header {
  width: 100%;
  position: relative;
  margin-top: var(--sakura-navbar-height);

  .sakura-header-title {
    justify-content: center;
  }

  &:not(.has-cover) {
    margin-top: var(--sakura-navbar-spacing);
    margin-bottom: 1.5rem;
  }

  &.has-cover {
    height: 320px;
    overflow: hidden;
    display: flex;
    align-items: flex-end;
    justify-content: center;
  }

  &__cover {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center;
    z-index: 0;
    pointer-events: none;
  }

  &__inner {
    position: relative;
    z-index: 1;
    width: 100%;
    padding-bottom: 25px;
    color: #fff;
    text-align: center;
  }

  &.has-cover .sakura-title {
    color: inherit;
    text-shadow: 2px 2px 10px black;
  }
}

.series-page-main {
  width: 100%;
  max-width: 880px;
  margin-inline: auto;
  padding-inline: max(40px, 3vw, env(safe-area-inset-left, 0px));
  padding-bottom: 48px;
}

.series-disabled {
  margin: 2rem 0;
  text-align: center;
  color: var(--va-c-text-light);
}
</style>
