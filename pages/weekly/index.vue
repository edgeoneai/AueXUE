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
  <div />
</template>
