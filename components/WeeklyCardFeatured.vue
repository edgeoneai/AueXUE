<!--
  周刊头条卡片（移植自上游 weekly-card-featured）：最新一期用大图 + 正文摘要呈现。
-->
<script setup lang="ts">
defineProps<{
  title: string
  link: string
  date?: string
  excerpt?: string
  cover?: string
  tags?: string[]
  issue: number
}>()
</script>

<template>
  <article class="weekly-featured">
    <a class="weekly-featured__media" :href="link" aria-hidden="true" tabindex="-1">
      <img
        v-if="cover"
        class="weekly-featured__cover"
        :src="cover"
        :alt="title"
        loading="lazy"
        decoding="async"
      >
      <div v-else class="weekly-featured__cover weekly-featured__cover--placeholder" />
    </a>

    <div class="weekly-featured__body">
      <div class="weekly-featured__label-row">
        <span class="weekly-featured__issue">
          <span class="weekly-featured__issue-label">ISSUE</span>
          <span class="weekly-featured__issue-num">{{ String(issue).padStart(2, '0') }}</span>
        </span>
        <time v-if="date" class="weekly-featured__date">{{ date }}</time>
      </div>

      <h2 class="weekly-featured__title">
        <a :href="link">{{ title }}</a>
      </h2>

      <p v-if="excerpt" class="weekly-featured__excerpt">{{ excerpt }}</p>

      <div class="weekly-featured__meta-row">
        <div class="weekly-featured__tags">
          <span v-for="tag in (tags || []).slice(0, 3)" :key="tag" class="weekly-featured__tag">
            {{ tag }}
          </span>
        </div>
        <a class="weekly-featured__read-more" :href="link">
          继续阅读
          <span class="i-ri-arrow-right-line" aria-hidden="true" />
        </a>
      </div>
    </div>
  </article>
</template>

<style lang="scss" scoped>
.weekly-featured {
  display: flex;
  gap: 0;
  border-radius: 18px;
  overflow: hidden;
  background: var(--sakura-post-card-bg, var(--va-c-bg-soft));
  border: 1px solid var(--sakura-color-divider, rgba(0, 0, 0, 0.1));
  margin-bottom: 1.5rem;
  transition: box-shadow 0.25s ease;

  &:hover {
    box-shadow: 0 14px 32px rgba(0, 0, 0, 0.1);
  }

  &__media {
    flex: none;
    width: 44%;
    display: block;
    overflow: hidden;
  }

  &__cover {
    width: 100%;
    height: 100%;
    min-height: 260px;
    object-fit: cover;
    display: block;

    &--placeholder {
      background: linear-gradient(135deg, rgba(0, 0, 0, 0.08), rgba(0, 0, 0, 0.02));
    }
  }

  &__body {
    flex: 1 1 auto;
    min-width: 0;
    padding: 1.4rem 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
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
    font-size: 1rem;
    font-weight: 800;
    color: var(--va-c-primary);
    font-variant-numeric: tabular-nums;
  }

  &__date {
    font-size: 0.75rem;
    opacity: 0.6;
    font-variant-numeric: tabular-nums;
  }

  &__title {
    margin: 0;
    font-size: 1.35rem;
    line-height: 1.4;

    a {
      color: inherit;
      text-decoration: none;

      &:hover {
        color: var(--va-c-primary);
      }
    }
  }

  &__excerpt {
    margin: 0;
    font-size: 0.875rem;
    line-height: 1.65;
    color: var(--va-c-text-light);
    display: -webkit-box;
    -webkit-line-clamp: 4;
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
    padding-top: 0.4rem;
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
    font-size: 0.8125rem;
    color: var(--va-c-primary);
    text-decoration: none;
  }
}

@media (max-width: 720px) {
  .weekly-featured {
    flex-direction: column;
  }

  .weekly-featured__media {
    width: 100%;
  }

  .weekly-featured__cover {
    min-height: 180px;
  }
}
</style>
