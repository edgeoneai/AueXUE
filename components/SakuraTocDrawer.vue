<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useOutline } from 'valaxy'

/**
 * 窄屏目录抽屉
 *
 * 主题在窄屏会把右侧栏（含目录）整个隐藏，长文阅读时无法跳转章节。
 * 这里在右下角提供一个浮动按钮，点开后在侧边滑出目录。
 * 宽屏（>= 768px）不渲染任何内容，仍使用原有侧边栏目录。
 */

const { headers } = useOutline()
const open = ref(false)

const hasHeaders = computed(() => headers.value.length > 0)

function toggle() {
  if (!hasHeaders.value)
    return
  open.value = !open.value
}

function close() {
  open.value = false
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && open.value)
    close()
}

// 抽屉展开时锁滚动，避免背景跟着滑动
watch(open, (value) => {
  if (typeof document === 'undefined')
    return
  document.body.style.overflow = value ? 'hidden' : ''
})

onMounted(() => {
  window.addEventListener('keydown', onKeydown)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
  if (typeof document !== 'undefined')
    document.body.style.overflow = ''
})
</script>

<template>
  <!--
    必须 Teleport 到 body。
    主题的 SakuraPage 带 transform-style: preserve-3d、.sakura-sidebar-offset 带
    transform: translateX()，两者都会成为 fixed 定位的包含块，导致按钮跟着页面滚动、
    抽屉错位。挂到 body 下可彻底避开这些祖先。
  -->
  <Teleport to="body">
    <div v-if="hasHeaders" class="toc-drawer">
      <button
        type="button"
        class="toc-drawer__btn"
        :aria-expanded="open"
        aria-controls="toc-drawer-panel"
        :aria-label="open ? '关闭目录' : '打开目录'"
        @click="toggle"
      >
        <span class="i-mdi-format-list-bulleted toc-drawer__icon" aria-hidden="true" />
      </button>

      <Transition name="toc-drawer">
        <div v-if="open" class="toc-drawer__mask" @click="close" />
      </Transition>

      <Transition name="toc-drawer-panel">
        <aside
          v-if="open"
          id="toc-drawer-panel"
          class="toc-drawer__panel"
          aria-label="文章目录"
        >
          <div class="toc-drawer__head">
            <span class="toc-drawer__title">目录</span>
            <button type="button" class="toc-drawer__close" aria-label="关闭目录" @click="close">
              <span class="i-mdi-close" aria-hidden="true" />
            </button>
          </div>
          <div class="toc-drawer__body">
            <SakuraOutlineItem class="va-toc css-i18n-toc" :headers="headers" root />
          </div>
        </aside>
      </Transition>
    </div>
  </Teleport>
</template>

<style lang="scss">
/*
  不做 scoped：内容被 Teleport 到 body，虽然 Vue 仍会给元素加 scope 属性，
  但样式挂在 body 下更直观、也不会受父级选择器影响。类名统一 toc-drawer 前缀避免冲突。
*/
/* 只在窄屏出现：主题在 < 768px 时隐藏右侧栏目录 */
.toc-drawer {
  @media (min-width: 768px) {
    display: none;
  }
}

.toc-drawer__btn {
  position: fixed;
  right: 16px;
  bottom: 24px;
  z-index: 900;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  color: #fff;
  background: var(--va-c-primary, #df9193);
  box-shadow: 0 4px 16px rgb(0 0 0 / 18%);
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:active {
    transform: scale(0.94);
  }

  &:hover {
    box-shadow: 0 6px 20px rgb(0 0 0 / 24%);
  }
}

.toc-drawer__icon {
  font-size: 22px;
}

.toc-drawer__mask {
  position: fixed;
  inset: 0;
  z-index: 901;
  background: rgb(0 0 0 / 40%);
}

.toc-drawer__panel {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  z-index: 902;
  display: flex;
  flex-direction: column;
  width: min(78vw, 320px);
  background: var(--va-c-bg, #fff);
  box-shadow: -4px 0 24px rgb(0 0 0 / 15%);
}

.toc-drawer__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-bottom: 1px solid var(--va-c-divider, #eee);
  flex: none;
}

.toc-drawer__title {
  font-size: 15px;
  font-weight: 600;
  letter-spacing: 0.4px;
}

.toc-drawer__close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: var(--va-c-text-light, #666);
  font-size: 20px;
  cursor: pointer;

  &:hover {
    background: rgb(0 0 0 / 5%);
  }
}

.toc-drawer__body {
  flex: 1;
  overflow-y: auto;
  padding: 12px 16px 32px;
  -webkit-overflow-scrolling: touch;
}

/* 动画 */
.toc-drawer-enter-active,
.toc-drawer-leave-active {
  transition: opacity 0.22s ease;
}

.toc-drawer-enter-from,
.toc-drawer-leave-to {
  opacity: 0;
}

.toc-drawer-panel-enter-active,
.toc-drawer-panel-leave-active {
  transition: transform 0.26s cubic-bezier(0.4, 0, 0.2, 1);
}

.toc-drawer-panel-enter-from,
.toc-drawer-panel-leave-to {
  transform: translateX(100%);
}
</style>
