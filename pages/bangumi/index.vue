<script setup lang="ts">
import { computed, watch } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const mergedFrontmatter = computed(() => ({
  title: '追番',
  icon: 'i-ri-tv-2-line',
  layout: 'bangumi',
  comment: false,
}))

function applyRouteFrontmatter() {
  route.meta.frontmatter = mergedFrontmatter.value
}

watch(mergedFrontmatter, applyRouteFrontmatter, { immediate: true })
</script>

<template>
  <slot name="main-content" />
</template>

<route lang="yaml">
meta:
  layout: bangumi
  title: 追番
  icon: i-ri-tv-2-line
  comment: false
</route>
