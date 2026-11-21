<script setup lang="ts">
import { useFrontmatter } from 'valaxy'
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import BangumiBoard from '../BangumiBoard.vue'

const route = useRoute()
const staticFrontmatter = useFrontmatter()

const BANGUMI_PAGE_COVER = '/bangumi/cover.jpg'

const frontmatter = computed(() => {
  const routeFrontmatter = (route.meta.frontmatter || {}) as Record<string, unknown>
  const base = { ...(staticFrontmatter.value || {}), ...routeFrontmatter }
  return {
    ...base,
    title: String(base.title || '追番'),
    icon: String(base.icon || 'i-ri-tv-2-line'),
    cover: typeof base.cover === 'string' && base.cover.trim() ? base.cover : BANGUMI_PAGE_COVER,
  }
})

const coverSrc = computed(() => frontmatter.value.cover)
</script>

<template>
  <article class="sakura-page sakura-bangumi-page">
    <header
      class="bangumi-page-header sakura-page-header"
      :class="{ 'has-cover': coverSrc }"
    >
      <img
        v-if="coverSrc"
        class="bangumi-page-header__cover"
        :src="coverSrc"
        :alt="frontmatter.title || '追番页头图'"
        loading="eager"
        decoding="async"
      >

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
  display: flex;
  flex-direction: column;
  align-items: stretch;
}

.bangumi-page-main {
  width: 100%;
  max-width: 1200px;
  margin-inline: auto;
  padding-inline: max(40px, 3vw, env(safe-area-inset-left, 0px));
  padding-bottom: 48px;
}

.bangumi-page-header {
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
</style>
