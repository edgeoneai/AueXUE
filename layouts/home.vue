<script lang="ts" setup>
import { computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useSakuraAppStore } from '../node_modules/valaxy-theme-sakura/stores/app.ts'
import { resolveHomePageIndex } from '../utils/homePagination'
import SakuraMobileNoticeTicker from '../components/SakuraMobileNoticeTicker.vue'

const route = useRoute()
const sakura = useSakuraAppStore()

const pageIndex = computed(() => resolveHomePageIndex(route))

sakura.curPage = pageIndex.value

watch(pageIndex, (value) => {
  sakura.curPage = value
}, { immediate: true })
</script>

<template>
  <SakuraHomeLayout>
    <!-- 移动端公告单行滚动 ticker（受 themeConfig.home.mobileNoticeTicker 控制，默认不渲染） -->
    <template #notice-board>
      <SakuraNoticeBoard />
      <SakuraMobileNoticeTicker />
    </template>
  </SakuraHomeLayout>
</template>
