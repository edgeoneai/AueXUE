<script lang="ts" setup>
import { computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useThemeConfig } from '../node_modules/valaxy-theme-sakura/composables'
import { useSakuraAppStore } from '../node_modules/valaxy-theme-sakura/stores/app.ts'
import { resolveHomePageIndex } from '../utils/homePagination'
import SakuraHomeListLayout from '../components/SakuraHomeListLayout.vue'
import SakuraHomeListSidebar from '../components/SakuraHomeListSidebar.vue'
import SakuraHomeTimelineLayout from '../components/SakuraHomeTimelineLayout.vue'
import SakuraMobileNoticeTicker from '../components/SakuraMobileNoticeTicker.vue'

const route = useRoute()
const sakura = useSakuraAppStore()
const themeConfig = useThemeConfig()

const pageIndex = computed(() => resolveHomePageIndex(route))

sakura.curPage = pageIndex.value

watch(pageIndex, (value) => {
  sakura.curPage = value
}, { immediate: true })

/**
 * 首页布局样式，由后台「站点设置 → 首页布局」写入：
 * cards（默认，卡片网格）/ list（列表 + 可选侧栏）/ timeline（时间线）。
 * 只影响 posts 区域，Hero、公告、分页沿用主题原有结构。
 */
const homeLayout = computed(() => {
  const raw = (themeConfig.value.home as { layout?: string } | undefined)?.layout
  return raw === 'list' || raw === 'timeline' ? raw : 'cards'
})

const showListSidebar = computed(() =>
  homeLayout.value === 'list'
  && (themeConfig.value.home as { listSidebar?: boolean } | undefined)?.listSidebar !== false,
)
</script>

<template>
  <SakuraHomeLayout>
    <!-- 移动端公告单行滚动 ticker（受 themeConfig.home.mobileNoticeTicker 控制，默认不渲染） -->
    <template #notice-board>
      <SakuraNoticeBoard />
      <SakuraMobileNoticeTicker />
    </template>

    <!-- list 布局的右侧栏：随机文章 + 标签云 -->
    <template v-if="showListSidebar" #right>
      <SakuraHomeListSidebar />
    </template>

    <template v-if="homeLayout === 'list'" #post-list>
      <SakuraHomeListLayout />
    </template>

    <template v-else-if="homeLayout === 'timeline'" #post-list>
      <SakuraHomeTimelineLayout />
    </template>
  </SakuraHomeLayout>
</template>
