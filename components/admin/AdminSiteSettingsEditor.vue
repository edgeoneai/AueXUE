<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { SiteSettings, SiteSocialLink, SponsorMethod } from '../../types/siteSettings'

const props = defineProps<{
  initial: SiteSettings
}>()

const emit = defineEmits<{
  save: [payload: SiteSettings]
  reset: []
}>()

const form = ref<SiteSettings>(clone(props.initial))
const saving = ref(false)
const notice = ref<{ type: 'success' | 'error', text: string } | null>(null)

watch(() => props.initial, (value) => {
  form.value = clone(value)
}, { deep: true })

function clone(value: SiteSettings): SiteSettings {
  return JSON.parse(JSON.stringify(value)) as SiteSettings
}

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

const heroUrlsText = computed({
  get: () => form.value.hero.urls.join('\n'),
  set: (value: string) => {
    form.value.hero.urls = value.split('\n').map(item => item.trim()).filter(Boolean)
  },
})

const navbarTitleText = computed({
  get: () => form.value.navbar.title.join('|'),
  set: (value: string) => {
    form.value.navbar.title = value.split('|').map(item => item.trim()).filter(Boolean)
  },
})

function addSocial() {
  form.value.social.push({ name: '', link: '', icon: 'i-ri-link', color: '#0078e7' })
}

function removeSocial(index: number) {
  form.value.social.splice(index, 1)
}

function moveSocial(index: number, delta: number) {
  const target = index + delta
  if (target < 0 || target >= form.value.social.length)
    return
  const list = form.value.social
  const [item] = list.splice(index, 1)
  list.splice(target, 0, item)
}

function addSponsor() {
  form.value.sponsor.methods.push({ name: '', url: '', icon: 'i-ri-wallet-line', color: '#0078e7' })
}

function removeSponsor(index: number) {
  form.value.sponsor.methods.splice(index, 1)
}

function handleSave() {
  notice.value = null
  emit('save', clone(form.value))
}

function handleReset() {
  emit('reset')
}

const socialCount = computed(() => form.value.social.length)
</script>

<template>
  <div class="site-settings">
    <div v-if="notice" class="site-settings__notice" :class="`site-settings__notice--${notice.type}`">
      {{ notice.text }}
    </div>

    <section class="site-settings__section">
      <h2 class="site-settings__title">站点基础信息</h2>
      <p class="site-settings__hint">对应 <code>site.config.ts</code>，保存后前台立即生效。</p>

      <div class="site-settings__grid">
        <label class="site-settings__field">
          <span>站点 URL</span>
          <input v-model="form.url" type="text" placeholder="https://example.com">
        </label>
        <label class="site-settings__field">
          <span>语言</span>
          <input v-model="form.lang" type="text" placeholder="zh-CN">
        </label>
        <label class="site-settings__field">
          <span>站点标题</span>
          <input v-model="form.title" type="text">
        </label>
        <label class="site-settings__field">
          <span>站点副标题</span>
          <input v-model="form.subtitle" type="text">
        </label>
      </div>

      <label class="site-settings__field">
        <span>站点描述</span>
        <input v-model="form.description" type="text">
      </label>

      <div class="site-settings__grid">
        <label class="site-settings__field">
          <span>作者名</span>
          <input v-model="form.authorName" type="text">
        </label>
        <label class="site-settings__field">
          <span>站点头像 URL</span>
          <input v-model="form.avatar" type="text">
        </label>
        <label class="site-settings__field">
          <span>作者状态表情</span>
          <input v-model="form.authorStatus!.emoji" type="text" placeholder="🌸">
        </label>
        <label class="site-settings__field">
          <span>作者状态文字</span>
          <input v-model="form.authorStatus!.message" type="text" placeholder="发呆ing...">
        </label>
        <label class="site-settings__field">
          <span>站点图标 favicon</span>
          <input v-model="form.favicon" type="text" placeholder="/favicon.png">
        </label>
        <label class="site-settings__field">
          <span>主题色</span>
          <span class="site-settings__color-row">
            <input v-model="form.themePrimary" type="text" placeholder="#DF9193">
            <input v-model="form.themePrimary" type="color" class="site-settings__color">
          </span>
        </label>
        <label class="site-settings__field">
          <span>文章默认封面</span>
          <input v-model="form.defaultCover" type="text">
        </label>
        <label class="site-settings__field">
          <span>每页文章数</span>
          <input v-model.number="form.itemsPerPage" type="number" min="1" max="100">
        </label>
      </div>
    </section>

    <section class="site-settings__section">
      <h2 class="site-settings__title">
        社交链接
        <span class="site-settings__count">{{ socialCount }}</span>
      </h2>
      <div v-for="(item, index) in form.social" :key="index" class="site-settings__list-row">
        <input v-model="item.name" type="text" placeholder="名称">
        <input v-model="item.link" type="text" placeholder="链接">
        <input v-model="item.icon" type="text" placeholder="图标，如 i-ri-github-line">
        <input v-model="item.color" type="text" placeholder="颜色">
        <span class="site-settings__row-actions">
          <button type="button" :disabled="index === 0" @click="moveSocial(index, -1)">↑</button>
          <button type="button" :disabled="index === form.social.length - 1" @click="moveSocial(index, 1)">↓</button>
          <button type="button" class="is-danger" @click="removeSocial(index)">删除</button>
        </span>
      </div>
      <button type="button" class="site-settings__add" @click="addSocial">+ 添加社交链接</button>
    </section>

    <section class="site-settings__section">
      <h2 class="site-settings__title">打赏</h2>
      <div class="site-settings__grid">
        <label class="site-settings__field site-settings__field--inline">
          <input v-model="form.sponsor.enable" type="checkbox">
          <span>启用打赏</span>
        </label>
        <label class="site-settings__field">
          <span>打赏标题</span>
          <input v-model="form.sponsor.title" type="text">
        </label>
      </div>

      <div v-for="(item, index) in form.sponsor.methods" :key="index" class="site-settings__list-row">
        <input v-model="item.name" type="text" placeholder="方式名称">
        <input v-model="item.url" type="text" placeholder="二维码图片地址">
        <input v-model="item.icon" type="text" placeholder="图标">
        <input v-model="item.color" type="text" placeholder="颜色">
        <span class="site-settings__row-actions">
          <button type="button" class="is-danger" @click="removeSponsor(index)">删除</button>
        </span>
      </div>
      <button type="button" class="site-settings__add" @click="addSponsor">+ 添加打赏方式</button>
    </section>

    <section class="site-settings__section">
      <h2 class="site-settings__title">首页 Hero</h2>
      <p class="site-settings__hint">对应 <code>valaxy.config.ts</code> 的 <code>themeConfig.hero</code>。</p>
      <div class="site-settings__grid">
        <label class="site-settings__field">
          <span>首页大标题</span>
          <input v-model="form.hero.title" type="text">
        </label>
        <label class="site-settings__field">
          <span>格言 / 副标题</span>
          <input v-model="form.hero.motto" type="text">
        </label>
        <label class="site-settings__field">
          <span>播放器视频地址</span>
          <input v-model="form.hero.playerUrl" type="text">
        </label>
        <label class="site-settings__field">
          <span>指示点样式</span>
          <input v-model="form.hero.style" type="text" placeholder="dot">
        </label>
      </div>

      <label class="site-settings__field">
        <span>背景图 / 视频列表（每行一个）</span>
        <textarea v-model="heroUrlsText" rows="6" />
      </label>

      <div class="site-settings__checks">
        <label><input v-model="form.hero.randomUrls" type="checkbox"> 随机背景</label>
        <label><input v-model="form.hero.fixedImg" type="checkbox"> 固定背景图</label>
        <label><input v-model="form.hero.typewriter" type="checkbox"> 打字机效果</label>
        <label><input v-model="form.hero.enableHitokoto" type="checkbox"> 一言</label>
      </div>
    </section>

    <section class="site-settings__section">
      <h2 class="site-settings__title">顶栏与页脚</h2>
      <div class="site-settings__grid">
        <label class="site-settings__field">
          <span>顶栏文字（用 | 分隔多段着色）</span>
          <input v-model="navbarTitleText" type="text" placeholder="AIOVTUE-|雪">
        </label>
        <label class="site-settings__field">
          <span>顶栏副标题</span>
          <input v-model="form.navbar.subTitle" type="text">
        </label>
        <label class="site-settings__field">
          <span>页脚计时起始</span>
          <input v-model="form.footer.runtimeSince" type="text" placeholder="2024-01-01">
        </label>
        <label class="site-settings__field">
          <span>建站年份</span>
          <input v-model.number="form.footer.since" type="number">
        </label>
      </div>
      <label class="site-settings__field">
        <span>备案信息（支持 HTML）</span>
        <textarea v-model="form.footer.icp" rows="2" />
      </label>
    </section>

    <section class="site-settings__section">
      <h2 class="site-settings__title">列表页样式</h2>
      <div class="site-settings__grid">
        <label class="site-settings__field">
          <span>分类页</span>
          <select v-model="form.pageStyles.categories">
            <option value="list">列表</option>
            <option value="chart">图表</option>
          </select>
        </label>
        <label class="site-settings__field">
          <span>归档页</span>
          <select v-model="form.pageStyles.archives">
            <option value="list">列表</option>
            <option value="chart">图表</option>
          </select>
        </label>
        <label class="site-settings__field">
          <span>归档起始月份</span>
          <input v-model="form.pageStyles.archivesStartMonth" type="text" placeholder="2024-01">
        </label>
        <label class="site-settings__field">
          <span>标签页</span>
          <select v-model="form.pageStyles.tags">
            <option value="list">列表</option>
            <option value="chart">图表</option>
          </select>
        </label>
        <label class="site-settings__field">
          <span>标签图表数量</span>
          <input v-model.number="form.pageStyles.tagsChartLength" type="number" min="1" max="100">
        </label>
      </div>
    </section>

    <div class="site-settings__actions">
      <button type="button" class="site-settings__btn site-settings__btn--ghost" :disabled="saving" @click="handleReset">
        恢复默认
      </button>
      <button type="button" class="site-settings__btn site-settings__btn--primary" :disabled="saving" @click="handleSave">
        {{ saving ? '保存中…' : '保存设置' }}
      </button>
    </div>
  </div>
</template>

<style scoped lang="scss">
.site-settings {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;

  &__notice {
    border-radius: 8px;
    padding: 0.75rem 1rem;
    font-size: 0.9rem;

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
    background: #fff;
    border: 1px solid #e6e6e6;
    border-radius: 12px;
    padding: 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 0.85rem;
  }

  &__title {
    font-size: 1rem;
    font-weight: 600;
    margin: 0;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  &__count {
    font-size: 0.75rem;
    background: #f0f0f0;
    border-radius: 10px;
    padding: 0 0.5rem;
    color: #666;
  }

  &__hint {
    margin: 0;
    font-size: 0.8rem;
    color: #888;

    code {
      background: #f5f5f5;
      padding: 0 0.25rem;
      border-radius: 3px;
    }
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
    color: #555;

    &--inline {
      flex-direction: row;
      align-items: center;
      gap: 0.5rem;
    }

    input[type='text'],
    input[type='number'],
    select,
    textarea {
      width: 100%;
      border: 1px solid #ddd;
      border-radius: 6px;
      padding: 0.45rem 0.6rem;
      font-size: 0.85rem;
      font-family: inherit;
      background: #fff;

      &:focus {
        outline: none;
        border-color: #df9193;
      }
    }

    textarea {
      resize: vertical;
      line-height: 1.5;
    }
  }

  &__color-row {
    display: flex;
    gap: 0.5rem;
    align-items: center;
  }

  &__color {
    width: 42px;
    height: 32px;
    padding: 0;
    border: 1px solid #ddd;
    border-radius: 6px;
    background: #fff;
  }

  &__checks {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    font-size: 0.82rem;
    color: #555;

    label {
      display: flex;
      align-items: center;
      gap: 0.35rem;
    }
  }

  &__list-row {
    display: grid;
    grid-template-columns: 1fr 1.4fr 1.2fr 0.8fr auto;
    gap: 0.5rem;
    align-items: center;

    input {
      border: 1px solid #ddd;
      border-radius: 6px;
      padding: 0.4rem 0.55rem;
      font-size: 0.82rem;
      min-width: 0;
    }

    @media (max-width: 768px) {
      grid-template-columns: 1fr 1fr;

      .site-settings__row-actions {
        grid-column: 1 / -1;
      }
    }
  }

  &__row-actions {
    display: flex;
    gap: 0.25rem;

    button {
      border: 1px solid #ddd;
      background: #fff;
      border-radius: 5px;
      padding: 0.3rem 0.5rem;
      font-size: 0.75rem;
      cursor: pointer;

      &:disabled {
        opacity: 0.4;
        cursor: not-allowed;
      }

      &.is-danger {
        color: #c0392b;
        border-color: #f0c8c2;
      }
    }
  }

  &__add {
    align-self: flex-start;
    border: 1px dashed #ccc;
    background: transparent;
    border-radius: 6px;
    padding: 0.45rem 0.9rem;
    font-size: 0.82rem;
    color: #666;
    cursor: pointer;

    &:hover {
      border-color: #df9193;
      color: #df9193;
    }
  }

  &__actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
    position: sticky;
    bottom: 0;
    background: #fafafa;
    padding: 0.85rem 0;
  }

  &__btn {
    border-radius: 8px;
    padding: 0.55rem 1.4rem;
    font-size: 0.88rem;
    cursor: pointer;
    border: 1px solid transparent;

    &--primary {
      background: #df9193;
      color: #fff;

      &:hover {
        background: #d77477;
      }
    }

    &--ghost {
      background: #fff;
      border-color: #ddd;
      color: #555;
    }

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }
}
</style>
