<script lang="ts" setup>
import type { Pkg } from 'valaxy'
import { useConfig } from 'valaxy'
import { useAddonVercount } from 'valaxy-addon-vercount'
import { isClient } from '@vueuse/core'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'

interface FooterConfig {
  icp?: string
  powered?: boolean
  runtimeSince?: string
  visitors?: boolean
}

interface RuntimeParts {
  days: number
  hours: number
  minutes: number
  seconds: number
}

const props = defineProps<{
  footer?: FooterConfig
  pkg?: Pkg
}>()

const config = useConfig()

const footer = computed(() => {
  if (props.footer)
    return props.footer

  return (config.value?.themeConfig as { footer?: FooterConfig } | undefined)?.footer ?? {}
})

const runtime = ref<RuntimeParts | null>(null)

let timer: ReturnType<typeof setInterval> | undefined

function parseStartTime(since: string) {
  const trimmed = since.trim()

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const [year, month, day] = trimmed.split('-').map(Number)
    return new Date(year, month - 1, day, 0, 0, 0, 0)
  }

  const start = new Date(trimmed)
  if (Number.isNaN(start.getTime()))
    return null

  return start
}

function updateRuntime() {
  const since = footer.value.runtimeSince
  if (!since) {
    runtime.value = null
    return
  }

  const start = parseStartTime(since)
  if (!start) {
    runtime.value = null
    return
  }

  let diffMs = Date.now() - start.getTime()
  if (diffMs < 0) {
    runtime.value = null
    return
  }

  const days = Math.floor(diffMs / 86_400_000)
  diffMs -= days * 86_400_000

  const hours = Math.floor(diffMs / 3_600_000)
  diffMs -= hours * 3_600_000

  const minutes = Math.floor(diffMs / 60_000)
  diffMs -= minutes * 60_000

  const seconds = Math.floor(diffMs / 1000)

  runtime.value = { days, hours, minutes, seconds }
}

function stopTimer() {
  if (timer !== undefined) {
    clearInterval(timer)
    timer = undefined
  }
}

function startTimer() {
  updateRuntime()
  stopTimer()

  if (isClient)
    timer = setInterval(updateRuntime, 1000)
}

watch(() => footer.value.runtimeSince, startTimer)

onMounted(startTimer)
onUnmounted(stopTimer)

/**
 * 页脚访客统计：受 themeConfig.footer.visitors 控制，默认 false 不渲染。
 *
 * 【降级说明】无法提供「今日访客 / 今日访问」：
 * 1. valaxy-addon-vercount（0.0.7）上游接口只返回 page_pv / page_uv / site_pv / site_uv，
 *    没有「按日」维度，因此拿不到今日数据；
 * 2. 项目的 patches/vercountComposable.ts 已移除 PeerJS 在线人数，online 恒为占位符 "-"，
 *    因此也不能展示在线人数。
 * 所以这里只展示「本站访客（site.uv）+ 本站访问（site.pv）」两项。
 */
const visitorsEnabled = computed(() => footer.value.visitors === true)

// 注意：useAddonVercount() 内部会注册 router.beforeEach 并在 onMounted 时才发请求，
// 整个组件只调用一次（多次调用会叠加路由守卫）；开关关闭时完全不调用，
// 保证关闭状态下页脚行为与改动前完全一致（无额外请求、无守卫）。
const vercount = visitorsEnabled.value ? useAddonVercount() : null

/** 只接受非负数字或纯数字字符串；占位符 "-"、undefined、异常值一律视为无数据 */
function toVisitorCount(value: number | string | undefined): number | null {
  if (typeof value === 'number')
    return Number.isFinite(value) && value >= 0 ? value : null

  if (typeof value === 'string' && /^\d+$/.test(value.trim()))
    return Number(value.trim())

  return null
}

function formatVisitorCount(value: number) {
  return value.toLocaleString('zh-CN')
}

const visitorItems = computed(() => {
  if (!visitorsEnabled.value || !vercount)
    return []

  const site = vercount.site.value
  const uv = toVisitorCount(site.uv)
  const pv = toVisitorCount(site.pv)

  // 接口失败 / 超时 / 返回异常时两个值都无效 → 整行静默隐藏
  if (uv === null && pv === null)
    return []

  const items: Array<{ key: string, label: string, value: string }> = []

  if (uv !== null)
    items.push({ key: 'uv', label: '本站访客', value: formatVisitorCount(uv) })

  if (pv !== null)
    items.push({ key: 'pv', label: '本站访问', value: formatVisitorCount(pv) })

  return items
})
</script>

<template>
  <footer class="sakura-footer h-$sakura-footer-height" text="center sm" style="color:var(--va-c-text-light)">
    <div v-if="footer.icp" class="icp" p="y-2" v-html="footer.icp" />

    <SakuraCopyright />

    <p v-if="runtime" class="sakura-footer-runtime">
      本站已经流畅运行
      <span class="sakura-footer-runtime__num">{{ runtime.days }}</span>天
      <span class="sakura-footer-runtime__num">{{ runtime.hours }}</span>小时
      <span class="sakura-footer-runtime__num">{{ runtime.minutes }}</span>分钟
      <span class="sakura-footer-runtime__num">{{ runtime.seconds }}</span>秒
    </p>

    <p v-if="visitorItems.length" class="sakura-footer-visitors">
      <template v-for="(item, index) in visitorItems" :key="item.key">
        <span v-if="index" class="sakura-footer-visitors__sep" aria-hidden="true">·</span>
        <span class="sakura-footer-visitors__label">{{ item.label }}</span>
        <span class="sakura-footer-visitors__num">{{ item.value }}</span>
      </template>
    </p>

    <SakuraPowered v-if="footer.powered" />

    <slot />
  </footer>
</template>

<style lang="scss" scoped>
.sakura-footer-runtime {
  margin: 0;
  padding: 4px 0 8px;
  font-size: 0.875rem;
  line-height: 1.6;
  color: var(--va-c-text-light);
}

.sakura-footer-runtime__num {
  font-variant-numeric: tabular-nums;
  font-weight: 600;
  color: var(--sakura-color-primary, #fe9500);
}

.sakura-footer-visitors {
  margin: 0;
  padding: 4px 0 8px;
  font-size: 0.875rem;
  line-height: 1.6;
  color: var(--va-c-text-light);
  font-variant-numeric: tabular-nums;
}

.sakura-footer-visitors__label {
  margin-right: 4px;
}

.sakura-footer-visitors__num {
  font-variant-numeric: tabular-nums;
  font-weight: 600;
  color: var(--sakura-color-primary, #fe9500);
}

.sakura-footer-visitors__sep {
  margin: 0 8px;
  opacity: 0.6;
}
</style>
