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

/** 一言/格言：多行文本 ⇄ 数组，一行一句，每次加载随机取一句 */
const mottoText = computed({
  get: () => form.value.hero.motto.join('\n'),
  set: (value: string) => {
    const list = value.split('\n').map(item => item.trim()).filter(Boolean)
    form.value.hero.motto = list.length ? list : ['']
  },
})

const navbarTitleText = computed({
  get: () => form.value.navbar.title.join('|'),
  set: (value: string) => {
    form.value.navbar.title = value.split('|').map(item => item.trim()).filter(Boolean)
  },
})

/** 抽卡视频：多行文本 ⇄ {url, weight} 数组 */
const navigationVideosText = computed({
  get: () => form.value.navigationVideos.map(item => `${item.url}|${item.weight}`).join('\n'),
  set: (value: string) => {
    const list = value
      .split('\n')
      .map((line) => {
        const [url, weight] = line.split('|').map(part => part.trim())
        if (!url)
          return null
        const w = Number(weight)
        return { url, weight: Number.isFinite(w) && w > 0 ? Math.floor(w) : 1 }
      })
      .filter((item): item is { url: string, weight: number } => Boolean(item))
    form.value.navigationVideos = list
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
        <label class="site-settings__field site-settings__field--wide">
          <span>格言 / 副标题（一行一句，每次加载随机显示一句）</span>
          <textarea v-model="mottoText" rows="3" placeholder="雨是神的烟花" />
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
      <div class="site-settings__checks">
        <label><input v-model="form.footer.footLinks" type="checkbox"> 页脚显示友链导航（前两个分组共 12 条）</label>
      </div>
    </section>

    <section class="site-settings__section">
      <h2 class="site-settings__title">首页布局</h2>
      <p class="site-settings__hint">
        首页文章区域的呈现方式，只影响列表部分，Hero 与公告保持不变。
      </p>
      <div class="site-settings__grid">
        <label class="site-settings__field">
          <span>布局样式</span>
          <select v-model="form.home.layout">
            <option value="cards">卡片网格</option>
            <option value="list">列表 + 侧栏</option>
            <option value="timeline">时间线</option>
          </select>
        </label>
      </div>
      <div v-if="form.home.layout === 'list'" class="site-settings__checks">
        <label><input v-model="form.home.listSidebar" type="checkbox"> 显示右侧栏（随机文章 + 标签云）</label>
      </div>
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

    <section class="site-settings__section">
      <h2 class="site-settings__title">评论与接入</h2>
      <p class="site-settings__hint">
        这些是第三方服务的接入地址。保存后需要重新构建部署才生效（与加载动画、页面标题的行为一致）。
      </p>
      <div class="site-settings__grid">
        <label class="site-settings__field">
          <span>Twikoo 评论地址</span>
          <input v-model="form.service.twikooEnvId" type="text" placeholder="https://your-twikoo/">
        </label>
        <label class="site-settings__field">
          <span>访问统计节点</span>
          <select v-model="form.service.vercountApi">
            <option value="cn">国内（cn）</option>
            <option value="">默认</option>
          </select>
        </label>
        <label class="site-settings__field">
          <span>一言接口</span>
          <select v-model="form.service.hitokotoApi">
            <option value="intl">国际（intl）</option>
            <option value="cn">国内（cn）</option>
          </select>
        </label>
        <label class="site-settings__field">
          <span>音乐歌单 ID</span>
          <input v-model="form.service.metingId" type="text" placeholder="2489775340">
        </label>
        <label class="site-settings__field">
          <span>音乐平台</span>
          <select v-model="form.service.metingServer">
            <option value="netease">网易云</option>
            <option value="tencent">QQ 音乐</option>
            <option value="kugou">酷狗</option>
          </select>
        </label>
        <label class="site-settings__field">
          <span>资源类型</span>
          <select v-model="form.service.metingType">
            <option value="playlist">歌单</option>
            <option value="album">专辑</option>
            <option value="song">单曲</option>
          </select>
        </label>
      </div>
    </section>

    <section class="site-settings__section">
      <h2 class="site-settings__title">音乐播放器</h2>
      <p class="site-settings__hint">
        页面角落的固定唱片按钮，点开后在面板内播放歌单。需要重新构建部署后生效。
      </p>
      <div class="site-settings__checks">
        <label><input v-model="form.music.enable" type="checkbox"> 启用音乐播放器</label>
      </div>
      <div class="site-settings__grid">
        <label class="site-settings__field">
          <span>音乐平台</span>
          <select v-model="form.music.server">
            <option value="netease">网易云</option>
            <option value="tencent">QQ 音乐</option>
            <option value="kugou">酷狗</option>
          </select>
        </label>
        <label class="site-settings__field">
          <span>资源类型</span>
          <select v-model="form.music.type">
            <option value="playlist">歌单</option>
            <option value="album">专辑</option>
            <option value="song">单曲</option>
          </select>
        </label>
        <label class="site-settings__field">
          <span>歌单 / 专辑 ID</span>
          <input v-model="form.music.id" type="text" placeholder="2489775340">
        </label>
        <label class="site-settings__field">
          <span>停靠位置</span>
          <select v-model="form.music.position">
            <option value="left">左下角</option>
            <option value="right">右下角</option>
          </select>
        </label>
      </div>
    </section>

    <section class="site-settings__section">
      <h2 class="site-settings__title">滚动与交互</h2>
      <div class="site-settings__checks">
        <label><input v-model="form.interaction.scrollDamping" type="checkbox"> 滚动阻尼</label>
        <label><input v-model="form.interaction.scrollAnimation" type="checkbox"> 滚动动画</label>
        <label><input v-model="form.interaction.scrollIndicator" type="checkbox"> 滚动进度指示</label>
        <label><input v-model="form.interaction.scrollLock" type="checkbox"> 滚动锁定</label>
        <label><input v-model="form.interaction.scrollToTop" type="checkbox"> 回到顶部按钮</label>
        <label><input v-model="form.interaction.scrollDown" type="checkbox"> 首页下滑按钮</label>
        <label><input v-model="form.interaction.postNavMerge" type="checkbox"> 合并上一篇/下一篇导航</label>
        <label><input v-model="form.interaction.tagsRainbow" type="checkbox"> 标签彩虹配色</label>
        <label><input v-model="form.interaction.mobileNoticeTicker" type="checkbox"> 移动端首页公告滚动条</label>
      </div>
    </section>

    <section class="site-settings__section">
      <h2 class="site-settings__title">阅读体验</h2>
      <div class="site-settings__checks">
        <label><input v-model="form.personalize.searchEnable" type="checkbox"> 启用全文搜索</label>
        <label><input v-model="form.personalize.fuseIgnoreLocation" type="checkbox"> 忽略匹配位置</label>
        <label><input v-model="form.personalize.mediumZoom" type="checkbox"> 图片点击放大预览</label>
        <label><input v-model="form.personalize.wordCount" type="checkbox"> 文章页显示字数与阅读时长</label>
        <label><input v-model="form.personalize.taxonomy" type="checkbox"> 文章页头显示分类与标签</label>
      </div>
      <div class="site-settings__grid">
        <label class="site-settings__field">
          <span>搜索实现</span>
          <select v-model="form.personalize.searchType">
            <option value="fuse">Fuse（模糊搜索）</option>
          </select>
        </label>
        <label class="site-settings__field">
          <span>模糊匹配阈值（0~1，越低越精确）</span>
          <input v-model.number="form.personalize.fuseThreshold" type="number" min="0" max="1" step="0.1">
        </label>
        <label class="site-settings__field">
          <span>代码块折叠行数（0 = 不折叠）</span>
          <input v-model.number="form.personalize.codeFoldLineLimit" type="number" min="0" max="500">
        </label>
      </div>
    </section>

    <section class="site-settings__section">
      <h2 class="site-settings__title">导航页</h2>
      <p class="site-settings__hint">
        抽卡随机跳转时使用的视频，一行一个，格式为 <code>视频地址|权重</code>，权重越大越容易抽到。
      </p>
      <label class="site-settings__field site-settings__field--wide">
        <span>抽卡视频</span>
        <textarea v-model="navigationVideosText" rows="3" placeholder="/img/1.mp4|1" />
      </label>
    </section>

    <section class="site-settings__section">
      <h2 class="site-settings__title">追番页</h2>
      <p class="site-settings__hint">
        数据来自 Bilibili 追番列表，构建时抓取并生成静态文件（需 B 站空间公开）。
        修改后需要重新构建部署才生效。
      </p>
      <div class="site-settings__checks">
        <label><input v-model="form.bangumi.enable" type="checkbox"> 启用追番页</label>
      </div>
      <div class="site-settings__grid">
        <label class="site-settings__field">
          <span>Bilibili UID</span>
          <input v-model="form.bangumi.vmid" type="text" placeholder="334423445">
        </label>
        <label class="site-settings__field">
          <span>页面引言</span>
          <input v-model="form.bangumi.quote" type="text" placeholder="生命不息，追番不止！">
        </label>
      </div>
    </section>

    <section class="site-settings__section">
      <h2 class="site-settings__title">周刊页</h2>
      <p class="site-settings__hint">
        周刊内容是普通文章，把文章分类设为下面的「归入分类」即可出现在周刊页。
      </p>
      <div class="site-settings__checks">
        <label><input v-model="form.weekly.enable" type="checkbox"> 启用周刊页</label>
      </div>
      <div class="site-settings__grid">
        <label class="site-settings__field">
          <span>页面标题</span>
          <input v-model="form.weekly.title" type="text" placeholder="周刊">
        </label>
        <label class="site-settings__field">
          <span>归入分类</span>
          <input v-model="form.weekly.category" type="text" placeholder="周刊">
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

  /* 区块说明文字 */
  &__hint {
    margin: -0.3rem 0 0.6rem;
    font-size: 0.8125rem;
    color: var(--admin-muted-color, #555);
    line-height: 1.5;
  }

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
    background: var(--admin-field-bg, #fff);
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
    background: var(--admin-page-bg, #f4f5f7);
    border-radius: 10px;
    padding: 0 0.5rem;
    color: #666;
  }

  &__hint {
    margin: 0;
    font-size: 0.8rem;
    color: var(--admin-muted-color, #555);

    code {
      background: var(--admin-page-bg, #f4f5f7);
      padding: 0 0.25rem;
      border-radius: 3px;
    }
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 0.85rem;
  }

  /* 占满整行的字段（多行文本框等） */
  &__field--wide {
    grid-column: 1 / -1;
  }

  &__field {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    font-size: 0.82rem;
    color: var(--admin-muted-color, #555);

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
      border: 1px solid var(--admin-subtle-border);
      border-radius: 6px;
      padding: 0.45rem 0.6rem;
      font-size: 0.85rem;
      font-family: inherit;
      background: var(--admin-field-bg, #fff);

      &:focus {
        outline: none;
        border-color: var(--admin-pink);
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
    border: 1px solid var(--admin-subtle-border);
    border-radius: 6px;
    background: var(--admin-field-bg, #fff);
  }

  &__checks {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    font-size: 0.82rem;
    color: var(--admin-muted-color, #555);

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
      border: 1px solid var(--admin-subtle-border);
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
      border: 1px solid var(--admin-subtle-border);
      background: var(--admin-field-bg, #fff);
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
      border-color: var(--admin-pink);
      color: #df9193;
    }
  }

  &__actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
    position: sticky;
    bottom: 0;
    background: var(--admin-page-bg, #f4f5f7);
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
      background: var(--admin-field-bg, #fff);
      border-color: #ddd;
      color: var(--admin-muted-color, #555);
    }

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }
}
</style>
