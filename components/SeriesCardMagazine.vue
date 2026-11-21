<!--
  周刊杂志卡片（移植自上游 weekly-card + weekly-card-arch-stroke）：
  偶数期日期块在左、媒体在右；奇数期左右对调（layout-b），并带一条弧线装饰。
-->
<script setup lang="ts">
import { computed } from 'vue'
import SeriesMagazineDate from './SeriesMagazineDate.vue'

const props = defineProps<{
  title: string
  link: string
  date?: string
  excerpt?: string
  cover?: string
  tags?: string[]
  /** 期号，从 1 开始 */
  issue: number
  /** 是否为左右对调版式 */
  reverse?: boolean
}>()

const isReverse = computed(() => props.reverse === true)
</script>

<template>
  <article
    class="weekly-card"
    :class="isReverse ? 'weekly-card--layout-b' : 'weekly-card--layout-a'"
  >
    <a class="weekly-card__link" :href="link" :aria-label="`阅读全文：${title}`">
      <SeriesMagazineDate v-if="!isReverse" :date="date" :issue="issue" />

      <div v-else class="weekly-card__media">
        <div class="weekly-card__media-shape">
          <img
            v-if="cover"
            class="weekly-card__cover-img"
            :src="cover"
            :alt="title"
            loading="lazy"
            decoding="async"
          >
          <div v-else class="weekly-card__cover-placeholder" aria-hidden="true" />
        </div>
      </div>

      <div class="weekly-card__body">
        <div class="weekly-card__label-row">
          <span class="weekly-card__issue">
            <span class="weekly-card__issue-label">ISSUE</span>
            <span class="weekly-card__issue-num">{{ String(issue).padStart(2, '0') }}</span>
          </span>
          <time v-if="date" class="weekly-card__mobile-date">{{ date }}</time>
        </div>

        <h2 class="weekly-card__title">{{ title }}</h2>
        <p v-if="excerpt" class="weekly-card__excerpt">{{ excerpt }}</p>

        <div class="weekly-card__meta-row">
          <div class="weekly-card__tags">
            <span v-for="tag in (tags || []).slice(0, 3)" :key="tag" class="weekly-card__tag">
              {{ tag }}
            </span>
          </div>
          <span class="weekly-card__read-more">
            继续阅读
            <span class="i-ri-arrow-right-line" aria-hidden="true" />
          </span>
        </div>
      </div>

      <SeriesMagazineDate v-if="isReverse" :date="date" :issue="issue" />

      <div v-else class="weekly-card__media">
        <div class="weekly-card__media-shape">
          <img
            v-if="cover"
            class="weekly-card__cover-img"
            :src="cover"
            :alt="title"
            loading="lazy"
            decoding="async"
          >
          <div v-else class="weekly-card__cover-placeholder" aria-hidden="true" />
        </div>
      </div>
    </a>

    <!-- 弧线装饰：与上游一致，对调版式画在右侧 -->
    <div
      class="weekly-card__arch-stroke"
      :class="isReverse ? 'weekly-card__arch-stroke--right' : 'weekly-card__arch-stroke--left'"
      aria-hidden="true"
    >
      <svg v-if="isReverse" viewBox="0 0 100 100" preserveAspectRatio="none" focusable="false">
        <path
          d="M 92 0 C 97 20 100 34 100 50 C 100 66 97 80 90 100"
          fill="none"
          stroke="currentColor"
          vector-effect="non-scaling-stroke"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
      <svg v-else viewBox="0 0 100 100" preserveAspectRatio="none" focusable="false">
        <path
          d="M 8 0 C 3 20 0 34 0 50 C 0 66 3 80 10 100"
          fill="none"
          stroke="currentColor"
          vector-effect="non-scaling-stroke"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </div>
  </article>
</template>

<style lang="scss" scoped>
.weekly-card {
  position: relative;
  border-radius: 16px;
  background: var(--sakura-post-card-bg, var(--va-c-bg-soft));
  border: 1px solid var(--sakura-color-divider, rgba(0, 0, 0, 0.1));
  overflow: hidden;
  transition: transform 0.25s ease, box-shadow 0.25s ease;

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 12px 28px rgba(0, 0, 0, 0.1);

    .weekly-card__title {
      color: var(--va-c-primary);
    }
  }

  &__link {
    display: flex;
    align-items: stretch;
    color: inherit;
    text-decoration: none;
  }

  /* 奇数期：日期块换到右侧，分隔线也镜像 */
  &--layout-b .weekly-mag-date {
    border-right: none;
    border-left: 1px solid var(--sakura-color-divider, rgba(0, 0, 0, 0.12));
  }

  &__media {
    flex: none;
    width: 190px;
    padding: 0.75rem;
  }

  &__media-shape {
    width: 100%;
    height: 100%;
    min-height: 130px;
    border-radius: 12px;
    overflow: hidden;
    background: var(--va-c-bg-soft);
  }

  &__cover-img {
    width: 100%;
    height: 100%;
    min-height: 130px;
    object-fit: cover;
    display: block;
  }

  &__cover-placeholder {
    width: 100%;
    height: 100%;
    min-height: 130px;
    background: linear-gradient(135deg, rgba(0, 0, 0, 0.06), rgba(0, 0, 0, 0.02));
  }

  &__body {
    flex: 1 1 auto;
    min-width: 0;
    padding: 1rem 1.1rem;
    display: flex;
    flex-direction: column;
    gap: 0.45rem;
  }

  &__label-row {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 0.5rem;
  }

  &__issue {
    display: inline-flex;
    align-items: baseline;
    gap: 0.25rem;
  }

  &__issue-label {
    font-size: 0.5625rem;
    letter-spacing: 0.14em;
    opacity: 0.5;
  }

  &__issue-num {
    font-size: 0.8125rem;
    font-weight: 700;
    color: var(--va-c-primary);
    font-variant-numeric: tabular-nums;
  }

  &__mobile-date {
    display: none;
    font-size: 0.6875rem;
    opacity: 0.6;
    font-variant-numeric: tabular-nums;
  }

  &__title {
    margin: 0;
    font-size: 1.0625rem;
    line-height: 1.45;
    transition: color 0.2s ease;
  }

  &__excerpt {
    margin: 0;
    font-size: 0.8125rem;
    line-height: 1.6;
    color: var(--va-c-text-light);
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  &__meta-row {
    margin-top: auto;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  &__tags {
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem;
  }

  &__tag {
    padding: 0.05rem 0.45rem;
    border-radius: 999px;
    border: 1px solid var(--sakura-color-divider, rgba(0, 0, 0, 0.15));
    font-size: 0.6875rem;
    color: var(--va-c-text-light);
  }

  &__read-more {
    display: inline-flex;
    align-items: center;
    gap: 0.15rem;
    font-size: 0.75rem;
    color: var(--va-c-primary);
  }

  /* 侧边弧线装饰 */
  &__arch-stroke {
    position: absolute;
    top: 10%;
    height: 80%;
    width: 10px;
    color: var(--va-c-primary);
    opacity: 0.45;
    pointer-events: none;

    &--left {
      left: 2px;
    }

    &--right {
      right: 2px;
    }

    svg {
      width: 100%;
      height: 100%;
      display: block;
    }
  }
}

@media (max-width: 720px) {
  .weekly-card__link {
    flex-direction: column;
  }

  .weekly-card__media {
    width: 100%;
    padding: 0.6rem 0.6rem 0;
  }

  .weekly-card__mobile-date {
    display: inline;
  }

  .weekly-card__arch-stroke {
    display: none;
  }
}
</style>
