<script lang="ts" setup>
import { computed } from 'vue'

interface FriendLinkItem {
  url: string
  avatar: string
  name: string
  blog?: string
  desc?: string
  descr?: string
  color?: string
  siteshot?: string
}

/** 分组独立布局：preview = 卡片预览图（现状默认）；simple = 横向简洁条 */
type LinkGroupLayout = 'preview' | 'simple'

interface FriendLinkGroup {
  name?: string
  desc?: string
  /**
   * 分组独立布局（可选字段）。
   * 只认 'preview' | 'simple'；缺失或非法值一律回落 'preview'
   * —— 即老数据（无 layout 字段）渲染与改动前完全一致。
   */
  layout?: string
  links: FriendLinkItem[]
}

const props = defineProps<{
  links?: string | FriendLinkItem[]
  linkGroups?: FriendLinkGroup[]
  random?: boolean
  errorImg?: string
  admin?: boolean
}>()

const emit = defineEmits<{
  selectLink: [payload: { groupIndex: number, linkIndex: number }]
  addLink: [groupIndex: number]
  editGroup: [groupIndex: number]
}>()

const previewFallback = 'https://r2tc.20030327.xyz/file/博客/主题/1780643226230_wallhaven-9d1yjk.png'

function normalizeLink(link: FriendLinkItem) {
  return {
    url: link.url,
    avatar: link.avatar,
    name: link.name,
    blog: link.blog || link.name,
    desc: link.desc || link.descr || '',
    color: link.color || '#0078e7',
    siteshot: getSiteshot(link),
  }
}

function getSiteshot(link: FriendLinkItem) {
  if (link.siteshot)
    return link.siteshot

  if (!link.url)
    return previewFallback

  return `https://s0.wp.com/mshots/v1/${encodeURIComponent(link.url)}?w=800&h=450`
}

function shuffleLinks<T>(list: T[]) {
  return [...list].sort(() => Math.random() - 0.5)
}

/**
 * 是否随机排序：由后台「友链管理」的「随机排序友链」开关驱动，
 * 它写入页面 frontmatter 的 random，经 SakuraLinksLayout 以 props.random 传入。
 * 后台编辑态（admin）永远不随机，避免编辑时列表跳动。
 */
const randomEnabled = computed(() => !!props.random)

function pickLinks<T>(list: T[]) {
  if (props.admin || !randomEnabled.value)
    return [...list]
  return shuffleLinks(list)
}

/** 只接受 'preview' | 'simple'，其余（含 undefined / 老数据非法值）返回 null 交回上层回落 */
function parseGroupLayout(raw?: string): LinkGroupLayout | null {
  return raw === 'preview' || raw === 'simple' ? raw : null
}

/** 分组布局解析顺序：group.layout → 'preview'（现状默认）。后台可按分组单独设置。 */
function resolveGroupLayout(group?: FriendLinkGroup): LinkGroupLayout {
  return parseGroupLayout(group?.layout) ?? 'preview'
}

const groupList = computed(() => {
  if (Array.isArray(props.linkGroups) && props.linkGroups.length > 0) {
    return props.linkGroups.map((group) => {
      return {
        name: group.name || '',
        desc: group.desc || '',
        layout: resolveGroupLayout(group),
        links: pickLinks(group.links).map(normalizeLink),
      }
    })
  }

  if (typeof props.links === 'string' || !Array.isArray(props.links))
    return []

  return [{
    name: '',
    desc: '',
    layout: resolveGroupLayout(),
    links: pickLinks(props.links).map(normalizeLink),
  }]
})

function onLinkClick(groupIndex: number, linkIndex: number) {
  if (!props.admin)
    return
  emit('selectLink', { groupIndex, linkIndex })
}

function onAddClick(groupIndex: number) {
  emit('addLink', groupIndex)
}

function onGroupEdit(groupIndex: number) {
  emit('editGroup', groupIndex)
}

function onPreviewError(event: Event) {
  const img = event.target as HTMLImageElement
  if (img.dataset.fallbackApplied)
    return

  img.dataset.fallbackApplied = '1'
  img.src = props.errorImg || previewFallback
}
</script>

<template>
  <div class="links-preview">
    <section
      v-for="(group, groupIndex) in groupList"
      :key="groupIndex"
      class="links-preview-group"
      :class="`links-preview-group--${group.layout}`"
    >
      <header
        v-if="group.name || admin"
        class="links-preview-group__header"
        :class="{ 'links-preview-group__header--admin': admin }"
      >
        <div class="links-preview-group__header-main">
          <h2 class="links-preview-group__title">
            <span class="links-preview-group__pin" aria-hidden="true">📌</span>
            {{ group.name || (admin ? '未命名分组' : '') }}
          </h2>
          <p
            v-if="group.desc"
            class="links-preview-group__desc"
          >
            分类描述 🌸：{{ group.desc }}
          </p>
          <p
            v-else-if="admin"
            class="links-preview-group__desc links-preview-group__desc--placeholder"
          >
            分类描述 🌸：暂无描述
          </p>
        </div>
        <button
          v-if="admin"
          type="button"
          class="links-preview-group__edit"
          aria-label="编辑分组"
          title="编辑分组"
          @click="onGroupEdit(groupIndex)"
        >
          <span class="i-mdi-pencil-outline links-preview-group__edit-icon" aria-hidden="true" />
        </button>
      </header>

      <ul class="links-preview-grid">
        <li
          v-for="(link, i) in group.links"
          :key="`${groupIndex}-${i}`"
          class="links-preview-item"
          :style="{ '--link-color': link.color }"
        >
          <a
            v-if="!admin"
            class="links-preview-card"
            :class="{ 'links-preview-card--simple': group.layout === 'simple' }"
            :href="link.url"
            :title="link.name"
            rel="friend noopener"
            target="_blank"
          >
            <!-- simple 分组布局：横向简洁条，hover 浮出站点截图；仅该分组单独生效 -->
            <template v-if="group.layout === 'simple'">
              <img
                class="links-preview-avatar"
                :src="link.avatar"
                :alt="link.name"
                loading="lazy"
                decoding="async"
              >

              <div class="links-preview-text">
                <div class="links-preview-name">
                  {{ link.blog }}
                </div>
                <div class="links-preview-desc">
                  {{ link.desc }}
                </div>
              </div>

              <div class="links-preview-hover-shot" aria-hidden="true">
                <img :src="link.siteshot" alt="" loading="lazy" decoding="async">
              </div>
            </template>

            <template v-else>
              <div class="links-preview-shot">
                <img
                  :src="link.siteshot"
                  :alt="`${link.name} 站点预览`"
                  loading="lazy"
                  decoding="async"
                  @error="onPreviewError"
                >
              </div>

              <div class="links-preview-meta">
                <img
                  class="links-preview-avatar"
                  :src="link.avatar"
                  :alt="link.name"
                  loading="lazy"
                  decoding="async"
                >

                <div class="links-preview-text">
                  <div class="links-preview-name">
                    {{ link.blog }}
                  </div>
                  <div class="links-preview-desc">
                    {{ link.desc }}
                  </div>
                </div>
              </div>
            </template>
          </a>

          <button
            v-else
            type="button"
            class="links-preview-card links-preview-card--admin"
            :class="{ 'links-preview-card--simple': group.layout === 'simple' }"
            :title="`编辑 ${link.name}`"
            @click="onLinkClick(groupIndex, i)"
          >
            <!-- simple 分组布局（后台编辑态同样跟随分组 layout，保证所见即所得） -->
            <template v-if="group.layout === 'simple'">
              <img
                class="links-preview-avatar"
                :src="link.avatar"
                :alt="link.name"
                loading="lazy"
                decoding="async"
              >

              <div class="links-preview-text">
                <div class="links-preview-name">
                  {{ link.blog }}
                </div>
                <div class="links-preview-desc">
                  {{ link.desc || '暂无描述' }}
                </div>
              </div>
            </template>

            <template v-else>
              <div class="links-preview-shot">
                <img
                  :src="link.siteshot"
                  :alt="`${link.name} 站点预览`"
                  loading="lazy"
                  decoding="async"
                  @error="onPreviewError"
                >
              </div>

              <div class="links-preview-meta">
                <img
                  class="links-preview-avatar"
                  :src="link.avatar"
                  :alt="link.name"
                  loading="lazy"
                  decoding="async"
                >

                <div class="links-preview-text">
                  <div class="links-preview-name">
                    {{ link.blog }}
                  </div>
                  <div class="links-preview-desc">
                    {{ link.desc || '暂无描述' }}
                  </div>
                </div>
              </div>
            </template>
          </button>
        </li>

        <li
          v-if="admin"
          class="links-preview-item links-preview-item--add"
        >
          <button
            type="button"
            class="links-preview-card links-preview-card--add"
            @click="onAddClick(groupIndex)"
          >
            <span class="links-preview-add-icon i-mdi-plus" aria-hidden="true" />
            <span class="links-preview-add-label">新建友链</span>
          </button>
        </li>
      </ul>
    </section>
  </div>
</template>

<style lang="scss" scoped>
.links-preview {
  --link-card-width: 210px;
  width: 100%;
  box-sizing: border-box;
}

.links-preview-group + .links-preview-group {
  margin-top: 40px;
}

.links-preview-group__header {
  margin-bottom: 20px;

  &--admin {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
  }
}

.links-preview-group__header-main {
  min-width: 0;
  flex: 1;
}

.links-preview-group__edit {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 2rem;
  height: 2rem;
  border: 1px solid #000;
  border-radius: 8px;
  background: #fff;
  color: #555;
  cursor: pointer;

  &:hover {
    color: var(--sakura-color-primary, #fe9500);
  }
}

.links-preview-group__edit-icon {
  width: 1.125rem;
  height: 1.125rem;
  font-size: 1.125rem;
}

.links-preview-group__desc--placeholder {
  opacity: 0.65;
}

.links-preview-group__title {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0 0 8px;
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--sakura-color-primary, #fe9500);
}

.links-preview-group__pin {
  font-size: 1rem;
  line-height: 1;
}

.links-preview-group__desc {
  margin: 0;
  font-size: 0.88rem;
  line-height: 1.6;
  color: var(--sakura-color-text-muted, #888);
}

.links-preview-grid {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-start;
  gap: 18px 14px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.links-preview-item {
  width: var(--link-card-width, 210px);
  max-width: 100%;
  flex: 0 0 auto;
  min-width: 0;
}

.links-preview-card {
  display: block;
  width: 100%;
  padding: 0;
  border: none;
  background: transparent;
  color: inherit;
  text-decoration: none;
  text-align: left;
  cursor: pointer;
  transition: transform 0.25s ease;

  &:hover {
    transform: translateY(-3px);

    .links-preview-shot {
      box-shadow: 0 14px 28px oklch(0% 0 0 / 18%);
    }

    .links-preview-name {
      color: var(--link-color, var(--sakura-color-primary, #fe9500));
    }
  }

  &--admin:focus-visible {
    outline: 2px solid var(--link-color, var(--sakura-color-primary, #fe9500));
    outline-offset: 2px;
  }

  &--add {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    aspect-ratio: 16 / 10;
    border: 1px dashed #bbb;
    border-radius: 10px;
    background: oklch(98% 0 0);
    color: #666;
    transform: none !important;

    &:hover {
      border-color: var(--sakura-color-primary, #fe9500);
      color: var(--sakura-color-primary, #fe9500);
      background: oklch(97% 0.02 60);

      .links-preview-shot,
      .links-preview-name {
        box-shadow: none;
        color: inherit;
      }
    }
  }
}

.links-preview-add-icon {
  font-size: 1.75rem;
  line-height: 1;
}

.links-preview-add-label {
  font-size: 0.84rem;
  font-weight: 600;
}

.links-preview-shot {
  overflow: hidden;
  aspect-ratio: 16 / 10;
  border-radius: 10px;
  background: var(--va-c-bg-mute, oklch(94% 0 0));
  box-shadow: 0 4px 12px oklch(0% 0 0 / 9%);
  transition: box-shadow 0.25s ease;

  img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: top center;
  }
}

.links-preview-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 8px;
  min-width: 0;
}

.links-preview-avatar {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid var(--link-color, var(--sakura-color-primary, #fe9500));
  background: var(--va-c-bg, #fff);
}

.links-preview-text {
  min-width: 0;
  flex: 1;
}

.links-preview-name {
  font-size: 0.84rem;
  font-weight: 700;
  line-height: 1.4;
  color: var(--sakura-color-text-deep, #333);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: color 0.2s ease;
}

.links-preview-desc {
  margin-top: 1px;
  font-size: 0.68rem;
  line-height: 1.45;
  color: var(--sakura-color-text-muted, #888);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

@media (max-width: 768px) {
  .links-preview-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
  }

  .links-preview-item {
    width: 100%;
  }

  .links-preview-card:not(.links-preview-card--add) {
    position: relative;
    aspect-ratio: 1 / 1;
    border-radius: 10px;
    overflow: hidden;

    &:hover {
      transform: none;

      .links-preview-name {
        color: #fff;
      }
    }

    &::after {
      content: '';
      position: absolute;
      inset: 0;
      z-index: 1;
      background: linear-gradient(to top, oklch(0% 0 0 / 62%) 0%, oklch(0% 0 0 / 12%) 45%, transparent 70%);
      pointer-events: none;
    }
  }

  .links-preview-card--add {
    aspect-ratio: 1 / 1;
    height: auto;
  }

  .links-preview-shot {
    position: absolute;
    inset: 0;
    aspect-ratio: unset;
    height: 100%;
    border-radius: 10px;
    box-shadow: none;
  }

  .links-preview-meta {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 2;
    margin-top: 0;
    padding: 8px;
    gap: 6px;
  }

  .links-preview-avatar {
    width: 32px;
    height: 32px;
    border-width: 1.5px;
  }

  .links-preview-name {
    font-size: 0.74rem;
    color: #fff;
  }

  .links-preview-desc {
    font-size: 0.62rem;
    color: oklch(92% 0 0 / 88%);
  }
}

/* ===== 分组独立样式 · simple（横向简洁条）=====
   作用域严格限定在 .links-preview-group--simple 之内；
   默认的 preview 分组样式一行未改，因此老数据（分组无 layout 字段）渲染与改动前完全一致。 */
.links-preview-group--simple {
  --link-strip-min-width: 260px;

  .links-preview-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(min(100%, var(--link-strip-min-width)), 1fr));
    gap: 14px 16px;
  }

  .links-preview-item {
    width: 100%;
    max-width: none;
    flex: unset;
  }

  .links-preview-card--simple {
    position: relative;
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    box-sizing: border-box;
    aspect-ratio: auto;
    padding: 12px 14px;
    border: 1px solid color-mix(in srgb, var(--link-color, var(--sakura-color-primary, #fe9500)) 22%, transparent);
    border-radius: 12px;
    background: var(--sakura-card-bg, var(--sakura-post-card-bg, var(--va-c-bg, #fff)));
    box-shadow: 0 2px 10px oklch(0% 0 0 / 4%);
    overflow: visible;
    transition: transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease;

    &::after {
      display: none;
    }

    &:hover {
      transform: translateY(-2px);
      border-color: color-mix(in srgb, var(--link-color, var(--sakura-color-primary, #fe9500)) 42%, transparent);
      box-shadow: 0 8px 22px oklch(0% 0 0 / 10%);

      .links-preview-name {
        color: var(--link-color, var(--sakura-color-primary, #fe9500));
      }

      .links-preview-hover-shot {
        opacity: 1;
        visibility: visible;
        transform: translateX(-50%) translateY(0) scale(1);
      }
    }
  }

  .links-preview-avatar {
    width: 40px;
    height: 40px;
    border-width: 2px;
  }

  .links-preview-text {
    min-width: 0;
    flex: 1;
  }

  .links-preview-name {
    color: var(--sakura-color-text-deep, #333);
  }

  .links-preview-desc {
    display: block;
    color: var(--sakura-color-text-muted, #888);
  }

  /* hover 浮出的站点截图（simple 分组专属，preview 分组不使用该元素） */
  .links-preview-hover-shot {
    position: absolute;
    left: 50%;
    bottom: calc(100% + 12px);
    z-index: 30;
    width: min(280px, 88vw);
    aspect-ratio: 16 / 10;
    transform: translateX(-50%) translateY(6px) scale(0.96);
    opacity: 0;
    visibility: hidden;
    pointer-events: none;
    border-radius: 10px;
    overflow: hidden;
    background: var(--va-c-bg-mute, oklch(94% 0 0));
    box-shadow: 0 14px 32px oklch(0% 0 0 / 22%);
    transition: opacity 0.22s ease, transform 0.22s ease, visibility 0.22s ease;

    img {
      display: block;
      width: 100%;
      height: 100%;
      object-fit: cover;
      object-position: top center;
    }
  }

  @media (max-width: 768px) {
    --link-strip-min-width: 100%;

    .links-preview-grid {
      grid-template-columns: minmax(0, 1fr);
      gap: 12px;
    }

    .links-preview-item {
      width: 100%;
      min-width: 0;
    }

    .links-preview-card--simple {
      min-width: 0;
      overflow: hidden;
    }

    .links-preview-text {
      min-width: 0;
    }

    .links-preview-hover-shot {
      display: none !important;
    }
  }
}

:global(html.dark) {
  .links-preview-shot {
    background: oklch(28% 0.01 270);
    box-shadow: 0 8px 22px oklch(0% 0 0 / 35%);
  }

  .links-preview-card:hover .links-preview-shot {
    box-shadow: 0 14px 30px oklch(0% 0 0 / 45%);
  }

  .links-preview-name {
    color: var(--sakura-color-text, #eee);
  }

  /* simple 分组暗色适配 */
  .links-preview-group--simple .links-preview-card--simple {
    border-color: color-mix(in srgb, var(--link-color, var(--sakura-color-primary, #fe9500)) 26%, transparent);
    background: oklch(26% 0.01 270);
    box-shadow: 0 2px 12px oklch(0% 0 0 / 22%);
  }

  .links-preview-group--simple .links-preview-hover-shot {
    box-shadow: 0 16px 36px oklch(0% 0 0 / 45%);
  }
}
</style>
