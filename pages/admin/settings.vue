<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import AdminSiteSettingsEditor from '../../components/admin/AdminSiteSettingsEditor.vue'
import { useAdminAuth } from '../../composables/useAdminAuth'
import { useSiteSettings } from '../../composables/useSiteSettings'
import {
  fetchSiteSettings,
  resetSiteSettings,
  saveSiteSettings,
} from '../../utils/siteSettingsApi'
import { applySiteSettings } from '../../utils/applySiteSettings'
import type { SiteSettings, SiteSettingsDetail } from '../../types/siteSettings'
import { DEFAULT_SITE_SETTINGS } from '../../shared/site-settings-defaults'

const router = useRouter()
const { isAuthenticated, refresh, loading, username, logout } = useAdminAuth()
const { loadSettings } = useSiteSettings()

const editorRef = ref<InstanceType<typeof AdminSiteSettingsEditor> | null>(null)
const pageLoading = ref(true)
const error = ref<string | null>(null)
const initial = ref<SiteSettings>(JSON.parse(JSON.stringify(DEFAULT_SITE_SETTINGS)) as SiteSettings)

onMounted(async () => {
  await refresh()
  if (!isAuthenticated.value) {
    await router.replace('/admin')
    return
  }

  try {
    const data: SiteSettingsDetail = await fetchSiteSettings()
    const { updatedAt: _updatedAt, ...rest } = data
    initial.value = rest
  }
  catch (err) {
    error.value = err instanceof Error ? err.message : '加载站点设置失败'
  }
  finally {
    pageLoading.value = false
  }
})

async function handleSave(payload: SiteSettings) {
  editorRef.value?.setSaving(true)
  try {
    const saved = await saveSiteSettings(payload)
    const { updatedAt: _updatedAt, ...rest } = saved
    initial.value = rest
    // 让当前页面立刻看到新配置（标题、主题色等）
    applySiteSettings(saved)
    await loadSettings(true)
    editorRef.value?.setSuccess('站点设置已保存，前台刷新后即生效')
  }
  catch (err) {
    editorRef.value?.setError(err instanceof Error ? err.message : '保存失败')
  }
  finally {
    editorRef.value?.setSaving(false)
  }
}

async function handleReset() {
  if (!window.confirm('确定恢复为配置文件里的默认值吗？当前保存的设置会被清除。'))
    return

  editorRef.value?.setSaving(true)
  try {
    const restored = await resetSiteSettings()
    const { updatedAt: _updatedAt, ...rest } = restored
    initial.value = rest
    applySiteSettings(restored)
    await loadSettings(true)
    editorRef.value?.setSuccess('已恢复默认设置')
  }
  catch (err) {
    editorRef.value?.setError(err instanceof Error ? err.message : '恢复默认失败')
  }
  finally {
    editorRef.value?.setSaving(false)
  }
}

async function handleLogout() {
  await logout({ clearRemembered: true })
  await router.replace('/admin')
}
</script>

<template>
  <AdminShell :username="username" @logout="handleLogout">
    <template #topbar>
      <div class="admin-layout__page-head">
        <div>
          <h1 class="admin-layout__page-title">
            站点设置
          </h1>
          <p class="admin-layout__page-subtitle">
            修改站点名称、头像、主题色、首页与页脚等信息
          </p>
        </div>
      </div>
    </template>

    <div v-if="loading || pageLoading" class="admin-page-loading">
      加载中…
    </div>
    <p v-else-if="error" class="admin-page-error">
      {{ error }}
    </p>
    <AdminSiteSettingsEditor
      v-else-if="isAuthenticated"
      ref="editorRef"
      :initial="initial"
      @save="handleSave"
      @reset="handleReset"
    />
  </AdminShell>
</template>

<style scoped lang="scss">
.admin-page-loading,
.admin-page-error {
  text-align: center;
  padding: 2rem 0;
}

.admin-page-error {
  color: #c0392b;
}
</style>

<route lang="yaml">
meta:
  layout: false
</route>
