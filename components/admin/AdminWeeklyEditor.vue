<!--
  周刊管理：只编辑站点设置里的 weekly 部分。
  保存时把整份站点设置原样带回（仅替换 weekly），避免覆盖其它区块。
-->
<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { SiteSettings, WeeklySettings } from '../../types/siteSettings'

const props = defineProps<{
  initial: SiteSettings
}>()

const emit = defineEmits<{
  save: [payload: SiteSettings]
}>()

/** 整份设置的副本：保存时用它作为基底，只覆盖 weekly */
const draft = ref<SiteSettings>(JSON.parse(JSON.stringify(props.initial)) as SiteSettings)
const saving = ref(false)
const notice = ref<{ type: 'success' | 'error', text: string } | null>(null)

watch(() => props.initial, (value) => {
  draft.value = JSON.parse(JSON.stringify(value)) as SiteSettings
}, { deep: true })

const weekly = computed(() => draft.value.weekly)

function setSaving(value: boolean) {
  saving.value = value
}

function setSuccess(text: string) {
  notice.value = { type: 'success', text }
}

function setError(text: string) {
  notice.value = { type: 'error', text }
}

defineExpose({ setSaving, setSuccess, setError })

/** 每批期数的文本输入：允许清空后再输入，提交时收敛 */
const batchSizeText = computed({
  get: () => String(weekly.value.batchSize ?? 10),
  set: (value: string) => {
    const n = Number(value)
    weekly.value.batchSize = Number.isFinite(n) && n > 0 ? Math.min(50, Math.floor(n)) : 1
  },
})

function handleSave() {
  notice.value = null
  const payload: SiteSettings = {
    ...JSON.parse(JSON.stringify(draft.value)),
    weekly: {
      ...weekly.value,
      title: weekly.value.title.trim() || '周刊',
      category: weekly.value.category.trim() || '周刊',
      batchSize: Math.min(50, Math.max(1, Math.floor(Number(weekly.value.batchSize) || 10))),
    } as WeeklySettings,
  }
  emit('save', payload)
}

/** 恢复本页默认值（只影响 weekly，不改其它区块） */
function handleReset() {
  weekly.value = {
    enable: true,
    title: '周刊',
    category: '周刊',
    batchSize: 10,
    featured: true,
  }
  notice.value = null
}
</script>

<template>
  <div class="admin-weekly">
    <div v-if="notice" class="admin-weekly__notice" :class="`admin-weekly__notice--${notice.type}`">
      {{ notice.text }}
    </div>

    <section class="admin-weekly__section">
      <h2 class="admin-weekly__title">周刊页</h2>
      <p class="admin-weekly__hint">
        周刊内容就是普通文章：在「文章管理」里新建文章时，把分类设为下面的「归入分类」，即可出现在周刊页。
      </p>

      <label class="admin-weekly__check">
        <input v-model="weekly.enable" type="checkbox">
        <span>启用周刊页</span>
      </label>
    </section>

    <section class="admin-weekly__section">
      <h2 class="admin-weekly__title">页面信息</h2>
      <div class="admin-weekly__grid">
        <label class="admin-weekly__field">
          <span>页面标题</span>
          <input v-model="weekly.title" type="text" placeholder="周刊">
        </label>
        <label class="admin-weekly__field">
          <span>归入分类</span>
          <input v-model="weekly.category" type="text" placeholder="周刊">
        </label>
      </div>
    </section>

    <section class="admin-weekly__section">
      <h2 class="admin-weekly__title">列表呈现</h2>
      <div class="admin-weekly__grid">
        <label class="admin-weekly__field">
          <span>每批期数（滚动到底自动加载下一批）</span>
          <input v-model="batchSizeText" type="number" min="1" max="50">
        </label>
      </div>
      <label class="admin-weekly__check">
        <input v-model="weekly.featured" type="checkbox">
        <span>把最新一期显示为头条大卡片</span>
      </label>
    </section>

    <div class="admin-weekly__actions">
      <button type="button" class="admin-weekly__btn admin-weekly__btn--ghost" :disabled="saving" @click="handleReset">
        恢复本页默认
      </button>
      <button type="button" class="admin-weekly__btn admin-weekly__btn--primary" :disabled="saving" @click="handleSave">
        {{ saving ? '保存中…' : '保存设置' }}
      </button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.admin-weekly {
  max-width: 860px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;

  &__notice {
    border-radius: 8px;
    padding: 0.7rem 1rem;
    font-size: 0.875rem;

    &--success {
      background: #e8f7ee;
      color: #1e7e42;
      border: 1px solid #b7e3c7;
    }

    &--error {
      background: #fdecea;
      color: #c0392b;
      border: 1px solid #f5c6c0;
    }
  }

  &__section {
    padding: 1.1rem 1.2rem;
    border-radius: 12px;
    background: var(--admin-field-bg, #fff);
    border: 1px solid var(--admin-subtle-border, #ddd);
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

    input,
    select {
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

  &__actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.6rem;
  }

  &__btn {
    padding: 0.5rem 1.1rem;
    border-radius: 8px;
    border: 1px solid transparent;
    font-size: 0.875rem;
    cursor: pointer;

    &--ghost {
      background: var(--admin-field-bg, #fff);
      border-color: var(--admin-subtle-border, #ddd);
      color: var(--admin-label-color, #333);
    }

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
