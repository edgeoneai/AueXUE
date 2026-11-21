<!--
  系列管理：编辑系列页开关、标题、列表呈现，以及每个系列的封面与简介。
  保存时把整份站点设置原样带回，只替换 series 部分。
-->
<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { SeriesItem, SiteSettings } from '../../types/siteSettings'

const props = defineProps<{
  initial: SiteSettings
}>()

const emit = defineEmits<{
  save: [payload: SiteSettings]
  notice: [{ type: 'success' | 'error', text: string }]
}>()

const draft = ref<SiteSettings>(JSON.parse(JSON.stringify(props.initial)) as SiteSettings)
const saving = ref(false)

watch(() => props.initial, (value) => {
  draft.value = JSON.parse(JSON.stringify(value)) as SiteSettings
}, { deep: true })

const series = computed(() => draft.value.series)
const items = computed(() => series.value.items)

function setSaving(value: boolean) {
  saving.value = value
}

function setSuccess(text: string) {
  emit('notice', { type: 'success', text })
}

function setError(text: string) {
  emit('notice', { type: 'error', text })
}

defineExpose({ setSaving, setSuccess, setError })

const batchSizeText = computed({
  get: () => String(series.value.batchSize ?? 10),
  set: (value: string) => {
    const n = Number(value)
    series.value.batchSize = Number.isFinite(n) && n > 0 ? Math.min(50, Math.floor(n)) : 1
  },
})

function addItem() {
  items.value.push({ name: '', cover: '', description: '' })
}

function removeItem(index: number) {
  items.value.splice(index, 1)
}

function moveItem(index: number, delta: number) {
  const target = index + delta
  if (target < 0 || target >= items.value.length)
    return
  const [item] = items.value.splice(index, 1)
  items.value.splice(target, 0, item)
}

function handleSave() {
  // 丢弃空名条目，并合并同名（保留先出现的）
  const seen = new Set<string>()
  const cleaned: SeriesItem[] = []
  for (const item of items.value) {
    const name = item.name.trim()
    if (!name || seen.has(name))
      continue
    seen.add(name)
    cleaned.push({ name, cover: item.cover.trim(), description: item.description.trim() })
  }

  const payload: SiteSettings = {
    ...JSON.parse(JSON.stringify(draft.value)),
    series: {
      ...series.value,
      title: series.value.title.trim() || '系列',
      batchSize: Math.min(50, Math.max(1, Math.floor(Number(series.value.batchSize) || 10))),
      items: cleaned,
    },
  }
  emit('save', payload)
}
</script>

<template>
  <div class="admin-series">
    <section class="admin-series__section">
      <h2 class="admin-series__title">系列页</h2>
      <p class="admin-series__hint">
        系列页先展示每个系列的卡片，点击后进入该系列的文章列表。
        文章要归入系列，请在「文章管理」里把「加入系列」设为对应系列名。
      </p>
      <label class="admin-series__check">
        <input v-model="series.enable" type="checkbox">
        <span>启用系列页</span>
      </label>
      <div class="admin-series__grid">
        <label class="admin-series__field">
          <span>页面标题</span>
          <input v-model="series.title" type="text" placeholder="系列">
        </label>
        <label class="admin-series__field">
          <span>每批文章数（滚动到底自动加载）</span>
          <input v-model="batchSizeText" type="number" min="1" max="50">
        </label>
      </div>
      <label class="admin-series__check">
        <input v-model="series.featured" type="checkbox">
        <span>每个系列把最新一篇显示为头条大卡片</span>
      </label>
    </section>

    <section class="admin-series__section">
      <div class="admin-series__head">
        <h2 class="admin-series__title">系列列表</h2>
        <button type="button" class="admin-series__btn admin-series__btn--primary" @click="addItem">
          + 新增系列
        </button>
      </div>

      <p v-if="!items.length" class="admin-series__hint">
        还没有系列，点击「新增系列」创建第一个。
      </p>

      <div
        v-for="(item, index) in items"
        :key="index"
        class="admin-series__item"
      >
        <div class="admin-series__item-head">
          <span class="admin-series__item-index">#{{ index + 1 }}</span>
          <div class="admin-series__item-actions">
            <button type="button" :disabled="index === 0" @click="moveItem(index, -1)">↑</button>
            <button type="button" :disabled="index === items.length - 1" @click="moveItem(index, 1)">↓</button>
            <button type="button" class="admin-series__remove" @click="removeItem(index)">删除</button>
          </div>
        </div>
        <div class="admin-series__grid">
          <label class="admin-series__field">
            <span>系列名（与文章里的「加入系列」一致）</span>
            <input v-model="item.name" type="text" placeholder="例如：艾雪周刊">
          </label>
          <label class="admin-series__field">
            <span>系列封面 URL</span>
            <input v-model="item.cover" type="url" placeholder="https://...">
          </label>
        </div>
        <label class="admin-series__field admin-series__field--wide">
          <span>系列简介</span>
          <textarea v-model="item.description" rows="2" placeholder="一句话介绍这个系列" />
        </label>
      </div>
    </section>

    <div class="admin-series__actions">
      <button type="button" class="admin-series__btn admin-series__btn--primary" :disabled="saving" @click="handleSave">
        {{ saving ? '保存中…' : '保存设置' }}
      </button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.admin-series {
  max-width: 860px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;

  &__section {
    padding: 1.1rem 1.2rem;
    border-radius: 12px;
    background: var(--admin-field-bg, #fff);
    border: 1px solid var(--admin-subtle-border, #ddd);
  }

  &__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 0.6rem;
  }

  &__title {
    margin: 0 0 0.5rem;
    font-size: 1rem;
    font-weight: 700;
    color: var(--admin-field-text, #111);
  }

  &__hint {
    margin: 0 0 0.8rem;
    font-size: 0.8125rem;
    line-height: 1.6;
    color: var(--admin-muted-color, #555);
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 0.85rem;
  }

  &__field {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    font-size: 0.82rem;
    color: var(--admin-label-color, #333);

    &--wide {
      margin-top: 0.6rem;
    }

    input,
    textarea {
      width: 100%;
      border: 1px solid var(--admin-subtle-border, #ddd);
      border-radius: 6px;
      padding: 0.45rem 0.6rem;
      font-size: 0.85rem;
      font-family: inherit;
      background: var(--admin-field-bg, #fff);
      color: var(--admin-field-text, #111);

      &:focus {
        outline: none;
        border-color: var(--admin-pink, #e93d6d);
      }
    }

    textarea {
      resize: vertical;
    }
  }

  &__check {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    margin-top: 0.6rem;
    font-size: 0.82rem;
    color: var(--admin-label-color, #333);

    input[type='checkbox'] {
      width: auto;
      margin: 0;
    }
  }

  &__item {
    padding: 0.8rem;
    margin-bottom: 0.8rem;
    border-radius: 10px;
    border: 1px dashed var(--admin-subtle-border, #ddd);
  }

  &__item-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 0.6rem;
  }

  &__item-index {
    font-size: 0.8125rem;
    font-weight: 700;
    color: var(--admin-muted-color, #555);
  }

  &__item-actions {
    display: flex;
    gap: 0.4rem;

    button {
      padding: 0.1rem 0.5rem;
      border-radius: 6px;
      border: 1px solid var(--admin-subtle-border, #ddd);
      background: var(--admin-field-bg, #fff);
      color: var(--admin-label-color, #333);
      font-size: 0.75rem;
      cursor: pointer;

      &:disabled {
        opacity: 0.4;
        cursor: not-allowed;
      }
    }
  }

  &__remove {
    color: #c0392b !important;
  }

  &__actions {
    display: flex;
    justify-content: flex-end;
  }

  &__btn {
    padding: 0.5rem 1.1rem;
    border-radius: 8px;
    border: 1px solid transparent;
    font-size: 0.875rem;
    cursor: pointer;

    &--primary {
      background: var(--admin-pink, #e93d6d);
      color: #fff;
    }

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }
}
</style>
