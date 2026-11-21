<script setup lang="ts">
import { computed, watch } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const mergedFrontmatter = computed(() => ({
  title: '系列',
  icon: 'i-ri-stack-line',
  layout: 'series',
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
  layout: series
  title: 系列
  icon: i-ri-stack-line
  comment: false
</route>
