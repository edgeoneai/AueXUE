<!--
  追番页：三个 tab（想看 / 在看 / 已看）+ 卡片网格。
  数据来自构建期生成的 /data/bangumi.json（见 scripts/fetch-bangumi.mjs）。
-->
<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

interface BangumiItem {
  title: string
  cover: string
  url: string
  seasonTypeName: string
  area: string
  score: number | null
  follow: string
  view: string
  summary: string
  totalCount: string
  newEp: string
  badge: string
  styles: string[]
  seasonId: number
}

interface BangumiData {
  updatedAt?: string
  vmid?: string
  enabled?: boolean
  quote?: string
  wantWatch: BangumiItem[]
  watching: BangumiItem[]
  watched: BangumiItem[]
}

const data = ref<BangumiData | null>(null)
const loading = ref(true)
const activeTab = ref<'wantWatch' | 'watching' | 'watched'>('watching')

const tabs = computed(() => [
  { key: 'wantWatch' as const, label: '想看', items: data.value?.wantWatch ?? [] },
  { key: 'watching' as const, label: '在看', items: data.value?.watching ?? [] },
  { key: 'watched' as const, label: '已看', items: data.value?.watched ?? [] },
])

const currentItems = computed(() => {
  const tab = tabs.value.find(item => item.key === activeTab.value)
  return tab?.items ?? []
})

const enabled = computed(() => data.value?.enabled === true)
const quote = computed(() => data.value?.quote || '生命不息，追番不止！')

/** 默认落在有内容最多的分类上，避免一进来就是空列表 */
function pickInitialTab(payload: BangumiData) {
  const order = [
    { key: 'watching' as const, count: payload.watching.length },
    { key: 'wantWatch' as const, count: payload.wantWatch.length },
    { key: 'watched' as const, count: payload.watched.length },
  ]
  const best = order.find(item => item.count > 0)
  if (best)
    activeTab.value = best.key
}

onMounted(async () => {
  try {
    const res = await fetch('/data/bangumi.json', { cache: 'no-cache' })
    if (!res.ok)
      throw new Error(String(res.status))
    const payload = await res.json() as BangumiData
    data.value = {
      ...payload,
      wantWatch: payload.wantWatch ?? [],
      watching: payload.watching ?? [],
      watched: payload.watched ?? [],
    }
    if (enabled.value)
      pickInitialTab(data.value)
  }
  catch {
    // 静默：未生成数据时页面显示空态，不影响其它内容
    data.value = { wantWatch: [], watching: [], watched: [], enabled: false }
  }
  finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="bangumi-board">
    <p v-if="quote" class="bangumi-board__quote">
      {{ quote }}
    </p>

    <p v-if="loading" class="bangumi-board__empty">
      加载中…
    </p>

    <p v-else-if="!enabled" class="bangumi-board__empty">
      追番页未启用，可在后台「站点设置 → 追番页」开启。
    </p>

    <template v-else>
      <div class="bangumi-tabs" role="tablist" aria-label="追番分类">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          type="button"
          role="tab"
          class="bangumi-tabs__btn"
          :class="{ 'is-active': activeTab === tab.key }"
          :aria-selected="activeTab === tab.key"
          @click="activeTab = tab.key"
        >
          {{ tab.label }}
          <span class="bangumi-tabs__count">{{ tab.items.length }}</span>
        </button>
      </div>

      <ul v-if="currentItems.length" class="bangumi-grid">
        <li v-for="item in currentItems" :key="item.seasonId || item.url" class="bangumi-card">
          <a class="bangumi-card__cover" :href="item.url" target="_blank" rel="noopener">
            <img
              v-if="item.cover"
              :src="item.cover"
              :alt="item.title"
              loading="lazy"
              decoding="async"
              referrerpolicy="no-referrer"
              width="96"
              height="128"
            >
          </a>
          <div class="bangumi-card__body">
            <h3 class="bangumi-card__title">
              <a :href="item.url" target="_blank" rel="noopener">{{ item.title }}</a>
            </h3>
            <div class="bangumi-card__stats">
              <span class="bangumi-card__stat">
                <span class="bangumi-card__label">评分</span>
                <span class="bangumi-card__value">{{ item.score ? item.score.toFixed(1) : '-' }}</span>
              </span>
              <span class="bangumi-card__stat">
                <span class="bangumi-card__label">播放量</span>
                <span class="bangumi-card__value">{{ item.view || '-' }}</span>
              </span>
              <span class="bangumi-card__stat">
                <span class="bangumi-card__label">追番数</span>
                <span class="bangumi-card__value">{{ item.follow || '-' }}</span>
              </span>
            </div>
            <p v-if="item.totalCount || item.newEp" class="bangumi-card__episodes">
              {{ item.totalCount || item.newEp }}
            </p>
            <p v-if="item.summary" class="bangumi-card__summary">
              {{ item.summary }}
            </p>
          </div>
        </li>
      </ul>

      <p v-else class="bangumi-board__empty">
        这个分类下还没有番剧
      </p>
    </template>
  </div>
</template>

<style lang="scss" scoped>
.bangumi-board {
  width: 100%;

  &__quote {
    margin: 0 0 1.25rem;
    text-align: center;
    font-size: 0.95rem;
    color: var(--va-c-text-light);
  }

  &__empty {
    margin: 2rem 0;
    text-align: center;
    color: var(--va-c-text-light);
  }
}

.bangumi-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1.25rem;

  &__btn {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.4rem 0.9rem;
    border: 1px solid var(--sakura-color-divider, rgba(0, 0, 0, 0.15));
    border-radius: 999px;
    background: transparent;
    color: inherit;
    font-size: 0.875rem;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      border-color: var(--va-c-primary);
      color: var(--va-c-primary);
    }

    &.is-active {
      background: var(--va-c-primary);
      border-color: var(--va-c-primary);
      color: #fff;
    }
  }

  &__count {
    font-size: 0.75rem;
    opacity: 0.75;
  }
}

.bangumi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 1rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.bangumi-card {
  display: flex;
  gap: 0.75rem;
  padding: 0.75rem;
  border-radius: 12px;
  background: var(--sakura-post-card-bg, var(--va-c-bg-soft));
  border: 1px solid var(--sakura-color-divider, rgba(0, 0, 0, 0.1));
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 18px rgba(0, 0, 0, 0.08);
  }

  &__cover {
    flex: none;
    width: 72px;

    img {
      width: 72px;
      height: 96px;
      object-fit: cover;
      border-radius: 8px;
      display: block;
    }
  }

  &__body {
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
  }

  &__title {
    margin: 0;
    font-size: 0.9rem;
    line-height: 1.4;

    a {
      color: inherit;
      text-decoration: none;

      &:hover {
        color: var(--va-c-primary);
      }
    }
  }

  &__stats {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    font-size: 0.75rem;
  }

  &__stat {
    display: inline-flex;
    gap: 0.2rem;
  }

  &__label {
    opacity: 0.6;
  }

  &__value {
    font-weight: 600;
    font-variant-numeric: tabular-nums;
  }

  &__episodes {
    margin: 0;
    font-size: 0.75rem;
    color: var(--va-c-text-light);
  }

  &__summary {
    margin: 0;
    font-size: 0.75rem;
    line-height: 1.5;
    color: var(--va-c-text-light);
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
}

@media (max-width: 640px) {
  .bangumi-grid {
    grid-template-columns: 1fr;
  }
}
</style>
