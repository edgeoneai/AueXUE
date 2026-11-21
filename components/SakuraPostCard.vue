<script lang="ts" setup>
import type { Post } from 'valaxy'
import { computed } from 'vue'
import { useThemeConfig } from '../node_modules/valaxy-theme-sakura/composables'
import { resolveImage } from '../node_modules/valaxy-theme-sakura/utils'

const props = defineProps<{
  post: Post
  position: 'left' | 'right'
  cols?: number
}>()

const themeConfig = useThemeConfig()

const defaultImage = computed(() => themeConfig.value.postList && resolveImage(themeConfig.value.postList?.defaultImage))
const cover = computed(() => props.post.cover || defaultImage.value)
const imageCard = computed(() => themeConfig.value.ui.postList?.image)

const isGroup = computed(() => (props.cols ?? 1) > 1)

/** 置顶标记：动态文章把 pinned 放在顶层或 frontmatter 里，两种都认 */
const isPinned = computed(() => {
  const post = props.post as Post & { pinned?: boolean, frontmatter?: { pinned?: boolean } }
  return post.pinned === true || post.frontmatter?.pinned === true
})
</script>

<template>
  <article
    hover="scale-101 z-10" class="sakura-card sakura-post-card transition-all duration-500"
    :class="[position, { group: isGroup, 'is-pinned': isPinned }]"
  >
    <!-- 置顶徽章：与上游一致，右上角倾斜图钉 -->
    <span v-if="isPinned" class="sakura-post-pin" title="置顶" aria-label="置顶">
      <span class="i-mdi-pin" aria-hidden="true" />
    </span>

    <SakuraImageCard v-if="cover" class="aspect-video" :to="post.path" :src="cover || defaultImage" v-bind="imageCard" />

    <div flex="~ col" class="post-card-content" :class="cover && 'has-cover'">
      <slot>
        <SakuraPostCardInfo :post />
      </slot>
    </div>
  </article>
</template>

<style lang="scss" scoped>
@use 'valaxy/client/styles/mixins/index.scss' as *;

.sakura-post-card {
  position: relative;
  display: flex;
  overflow: hidden;
  justify-content: space-between;
  color: var(--sakura-color-text);
  background: var(--sakura-post-card-bg);
  min-height: var(--sakura-post-card-height);
  border-radius: var(--sakura-post-card-rd);
  border-width: 1px;
  border-style: solid;
  transition: transform 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;

  /* 置顶卡片：主色描边 */
  &.is-pinned {
    border-color: color-mix(in srgb, var(--sakura-color-primary) 55%, currentColor);
  }

  /*
   * 置顶叠加卡片效果：用多层向外扩散的 box-shadow 模拟"卡片叠放"，
   * 比伪元素更稳（不受 overflow:hidden 裁切、无需处理负 z-index 层级）。
   */
  &.is-pinned {
    margin-top: 14px;
    box-shadow:
      0 -5px 0 -1px var(--sakura-post-card-bg),
      0 -10px 0 -2px var(--sakura-post-card-bg),
      0 0 0 1px var(--sakura-color-divider),
      0 -5px 0 0 var(--sakura-color-divider),
      0 -10px 0 -1px var(--sakura-color-divider);
  }

  /* 图钉徽章 */
  .sakura-post-pin {
    position: absolute;
    top: 10px;
    right: 12px;
    z-index: 2;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 1.6rem;
    height: 1.6rem;
    border-radius: 50%;
    background: var(--sakura-post-card-bg);
    color: var(--sakura-color-primary);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
    transform: rotate(-24deg);

    .i-mdi-pin {
      width: 1rem;
      height: 1rem;
    }
  }

  .post-card-content {
    padding: 20px 39px;
  }

  @at-root html.dark & {
    border-color: var(--sakura-color-divider);

    &:hover {
      border-color: var(--sakura-color-primary);
    }
  }

  &.group {
    flex-direction: column;

    .post-card-content {
      padding-inline: 20px;

      &.has-cover {
        width: 100%;
      }
    }

    .sakura-image-card {
      width: 100%;
    }
  }

  &:not(.group) {
    height: var(--sakura-post-card-height);

    .post-card-content {
      padding: 20px 39px;

      &.has-cover {
        width: calc(100% - var(--sakura-post-card-img-width));
      }
    }

    &.left {
      flex-direction: row-reverse;
    }

    &.right {
      text-align: right;
    }

    @media (max-width: 767px) {
      height: auto;
      flex-direction: column;

      &.left,
      &.right {
        flex-direction: column;
        text-align: inherit;
      }

      .post-card-content {
        padding-inline: 20px;

        &.has-cover {
          width: 100%;
        }
      }

      .sakura-image-card {
        width: 100%;
      }
    }
  }

  @media (max-width: 767px) {
    --sakura-post-card-height: 200px;
  }
}
</style>
