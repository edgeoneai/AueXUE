<script setup lang="ts">
import { computed, watch } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const mergedFrontmatter = computed(() => ({
  title: '周刊',
  icon: 'i-ri-newspaper-line',
  layout: 'weekly',
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
  layout: weekly
  title: 周刊
  icon: i-ri-newspaper-line
  comment: false
</route>
