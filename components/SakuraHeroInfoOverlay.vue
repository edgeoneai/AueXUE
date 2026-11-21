<!--
  【A3 本地覆盖】本文件覆盖 valaxy-theme-sakura@0.10.2 的同名组件
  node_modules/valaxy-theme-sakura/components/SakuraHeroInfoOverlay.vue
  （v0.10.2 原版 136 行）。项目 components/ 优先级高于主题 components/，
  因此主题升级时若该组件有变化，需要重新比对一次。

  与主题原版的唯一差异：首页一言 hero.motto 支持 string | string[]。
  - string（现状）：原样透传，一个字符都不改，行为与覆盖前完全一致。
  - string[]：先按上游 aiovtue 的口径 trim + 过滤空串；服务端渲染与首屏
    （hydration 首帧）固定使用第一句，客户端 onMounted 之后再随机替换为其中
    一句；数组里只剩一句时直接使用该句。
  - 随机只发生在「每次页面加载」时，不做定时轮换（与上游 hero.js 的
    readMottoList / pickRandomMotto 语义一致）。
  其余结构、props、插槽、社交图标、背景切换逻辑、样式均与原版保持一致。
-->
<script setup lang="ts">
import { useSiteConfig } from 'valaxy'
import { computed, onMounted, ref } from 'vue'
import addonHitokoto from '../node_modules/valaxy-theme-sakura/plugins/hitokoto'
import type { Hero, HeroSocialLink } from '../node_modules/valaxy-theme-sakura/types/index'
import { useThemeConfig } from '../node_modules/valaxy-theme-sakura/composables'
import { useSakuraAppStore } from '../node_modules/valaxy-theme-sakura/stores'

const props = withDefaults(defineProps<{
  hero?: Hero
}>(), {})

const siteConfig = useSiteConfig()
const sakura = useSakuraAppStore()
const themeConfig = useThemeConfig()

const banner = computed(() => props.hero || themeConfig.value.hero)
const socials = computed(() => (banner.value.socials || siteConfig.value.social) as HeroSocialLink[])

const { hitokoto, fetchHitokoto } = computed(() => {
  if (banner.value.enableHitokoto) {
    return addonHitokoto?.useAddonHitokoto(themeConfig.value.hero.hitokoto) || {}
  }
  return { hitokoto: undefined, fetchHitokoto: () => {} }
}).value

/**
 * 读取 hero.motto 的原始值。
 * 主题类型里 motto 声明为 string，而这里要兼容 string[]；按硬约束不改 types/，
 * 故用 any 取原始值后自行做类型判断，避免把数组分支窄化成 never。
 */
const rawMotto = computed<unknown>(() => (banner.value as any)?.motto)

/** 多句模式下的句子列表：trim 后过滤空串（与上游 aiovtue 的 readMottoList 一致）。 */
const mottoList = computed<string[]>(() => {
  const raw = rawMotto.value
  if (!Array.isArray(raw))
    return []
  return raw.map(item => String(item ?? '').trim()).filter(Boolean)
})

/**
 * 多句模式下已选定的句子下标。
 * null 表示「尚未在客户端随机」——此时服务端与首屏一律使用第一句。
 */
const randomMottoIndex = ref<number | null>(null)

/** 最终渲染的一言文本。 */
const mottoText = computed<string | undefined>(() => {
  const raw = rawMotto.value
  // 非数组（即现状的单个字符串）：完全沿用原行为，原样返回
  if (!Array.isArray(raw))
    return raw as string | undefined

  const list = mottoList.value
  if (list.length === 0)
    return ''
  if (list.length === 1)
    return list[0]
  return list[randomMottoIndex.value ?? 0]
})

// 仅在客户端 mounted 之后才随机，保证 SSR 输出与首屏 hydration 始终使用第一句，
// 不会出现 hydration mismatch；打字机组件会监听 type-string 变化并自动重启，
// 因此随机结果能同时用于打字机开 / 关两种状态。
onMounted(() => {
  const list = mottoList.value
  if (list.length > 1)
    randomMottoIndex.value = Math.floor(Math.random() * list.length)
})
</script>

<template>
  <div class="sakura-hero-info-overlay">
    <slot name="highlighted-text">
      <SakuraGlitchText :class="sakura.wallpaperIsPlaying ? 'sakura-fade-out-up' : 'sakura-fade-in-down'" :text="banner.title" />
    </slot>

    <div class="sakura-info-card" :class="sakura.wallpaperIsPlaying ? 'sakura-slit-out-horizontal' : 'sakura-slit-in-horizontal'">
      <div :class="themeConfig.hero.socialStyle === 'merge' && 'sakura-social-card'">
        <slot name="muted-text">
          <div class="flex justify-center" :class="themeConfig.hero.socialStyle === 'separate' && 'sakura-social-card'">
            <span class="inline-block" i-fa6-solid-quote-left />
            <span class="px-2 text-lg">
              <template v-if="themeConfig.hero.typewriter">
                <SakuraTypewriter v-if="!banner.enableHitokoto" :type-string="mottoText" loop :delay="100" :pause-for="10000" :delete-all="100" />
                <SakuraTypewriter v-else :type-string="hitokoto?.hitokoto" loop :delay="100" :pause-for="10000" :delete-all="100" @all-typing-finished="fetchHitokoto()" />
              </template>
              <template v-else>
                {{ banner.enableHitokoto ? hitokoto?.hitokoto : mottoText }}
              </template>
            </span>
            <span class="inline-block" i-fa6-solid-quote-right />
          </div>
        </slot>

        <slot v-if="themeConfig.hero.socialStyle === 'merge'" name="social">
          <div class="mx-5 mt-4 flex justify-between">
            <img class="sakura-icon" rotate-180 cursor-pointer src="../node_modules/valaxy-theme-sakura/assets/next-b.svg" alt="Previous media" @click="sakura.prevWallpaper">
            <a v-for="social in socials" :key="social?.name" :style="{ '--sakura-color-icon': social?.color }" :href="social?.link" aria-label="icon" target="_blank">
              <div v-if="social?.icon" :class="[social.icon]" class="sakura-icon" />
              <img v-else-if="social?.img" :src="social.img" class="sakura-icon">
            </a>
            <img class="sakura-icon" cursor-pointer src="../node_modules/valaxy-theme-sakura/assets/next-b.svg" alt="Next media" @click="sakura.nextWallpaper">
          </div>
        </slot>
      </div>
    </div>

    <slot v-if="themeConfig.hero.socialStyle === 'separate' || themeConfig.hero.socialStyle === 'single'" name="social">
      <div class="sakura-info-card" :class="themeConfig.hero.socialStyle === 'separate' && 'sakura-social-card'">
        <div class="mx-5 justify-between" flex="~ center">
          <img class="sakura-icon" rotate-180 cursor-pointer src="../node_modules/valaxy-theme-sakura/assets/next-b.svg" alt="Previous media" @click="sakura.prevWallpaper">
          <a
            v-for="social in socials"
            :key="social?.name"
            flex="~ center" :class="themeConfig.hero.socialStyle === 'single' && 'sakura-social-card'" :style="{ '--sakura-color-icon': social?.color }" :href="social?.link" aria-label="icon" target="_blank"
          >
            <div v-if="social?.icon" :class="[social.icon]" class="sakura-icon" />
            <img v-else-if="social?.img" :src="social.img" class="sakura-icon">
          </a>
          <img class="sakura-icon" cursor-pointer src="../node_modules/valaxy-theme-sakura/assets/next-b.svg" alt="Next media" @click="sakura.nextWallpaper">
        </div>
      </div>
    </slot>
  </div>
</template>

<style lang="scss" scoped>
@use 'valaxy/client/styles/mixins/index.scss' as *;

.sakura-hero-info-overlay {
  font-family: Arial, Helvetica, sans-serif;
  font-weight: bold;
  display: flex;
  flex-direction: column;
  align-items: center;

  .sakura-social-card {
    padding: 15px 16px;
    border-radius: 1rem;
    background: var(--sakura-color-overlay-background);
    opacity: 0.8;

    &-style-merge {
      padding: 1rem 0.75rem;
    }
  }

  .sakura-info-card {
    margin-top: 30px;
    color: white;

    @include screen('md') {
      min-width: 500px;
      max-width: 800px;
    }
  }

  .sakura-icon {
    height: 22px;
    width: 22px;
    color: var(--sakura-color-icon);
  }

  .card-wrapper {
    background-color: oklch(0% 0 0 / 50%) !important;
  }

  .card-wrapper::before {
    content: '';
    position: absolute;
    top: -30px;
    left: 20%;
    margin-left: -15px;
    border-width: 15px;
    border-style: solid;
    border-color: transparent transparent oklch(0% 0 0 / 50%);
  }
}
</style>
