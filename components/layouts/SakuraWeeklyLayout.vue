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

const WEEKLY_PAGE_COVER = '/weekly/cover.png'

const frontmatter = computed(() => {
  const routeFrontmatter = (route.meta.frontmatter || {}) as Record<string, unknown>
  const base = { ...(staticFrontmatter.value || {}), ...routeFrontmatter }
  return {
    ...base,
    title: weekly.value?.title || String(base.title || '周刊'),
    icon: String(base.icon || 'i-ri-newspaper-line'),
    cover: typeof base.cover === 'string' && base.cover.trim() ? base.cover : WEEKLY_PAGE_COVER,
  }
})

const coverSrc = computed(() => frontmatter.value.cover)

const category = computed(() => weekly.value?.category || '周刊')
const enabled = computed(() => weekly.value?.enable !== false)
</script>

<template>
  <article class="sakura-page sakura-weekly-page">
    <header
      class="weekly-page-header sakura-page-header"
      :class="{ 'has-cover': coverSrc }"
    >
      <img
        v-if="coverSrc"
        class="weekly-page-header__cover"
        :src="coverSrc"
        :alt="frontmatter.title || '周刊页头图'"
        loading="eager"
        decoding="async"
      >

      <div class="weekly-page-header__inner sakura-safe-padding">
        <div class="sakura-header-title" flex="~">
          <SakuraTitle :fm="frontmatter" />
        </div>
      </div>
    </header>

    <div class="weekly-page-main">
      <div class="content sakura-page-content">
        <RouterView v-slot="{ Component }">
          <component :is="Component">
            <template #main-content>
              <p v-if="!enabled" class="weekly-disabled">
                周刊页未启用，可在后台「站点设置 → 周刊页」开启。
              </p>
              <WeeklyMasthead v-else :title="frontmatter.title" :category="category" />
            </template>
          </component>
        </RouterView>
      </div>
    </div>
  </article>
</template>

<style lang="scss" scoped>
.sakura-weekly-page {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: stretch;
}

.weekly-page-main {
  width: 100%;
  max-width: 880px;
  margin-inline: auto;
  padding-inline: max(40px, 3vw, env(safe-area-inset-left, 0px));
  padding-bottom: 48px;
}

.weekly-page-header {
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

.weekly-disabled {
  margin: 2rem 0;
  text-align: center;
  color: var(--va-c-text-light);
}
</style>
