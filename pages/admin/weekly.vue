<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import AdminWeeklyEditor from '../../components/admin/AdminWeeklyEditor.vue'
import { useAdminAuth } from '../../composables/useAdminAuth'
import { useSiteSettings } from '../../composables/useSiteSettings'
import { fetchSiteSettings, saveSiteSettings } from '../../utils/siteSettingsApi'
import { applySiteSettings } from '../../utils/applySiteSettings'
import type { SiteSettings, SiteSettingsDetail } from '../../types/siteSettings'
import { DEFAULT_SITE_SETTINGS } from '../../shared/site-settings-defaults'

const router = useRouter()
const { isAuthenticated, refresh, loading, username, logout } = useAdminAuth()
const { loadSettings } = useSiteSettings()

const editorRef = ref<InstanceType<typeof AdminWeeklyEditor> | null>(null)
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
    error.value = err instanceof Error ? err.message : '加载周刊设置失败'
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
    // 保存后立刻把新设置应用到当前运行时，无需刷新即可看到变化
    applySiteSettings({ ...rest, updatedAt: saved.updatedAt })
    await loadSettings(true)
    editorRef.value?.setSuccess('周刊设置已保存')
  }
  catch (err) {
    editorRef.value?.setError(err instanceof Error ? err.message : '保存失败')
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
    <div v-if="loading || pageLoading" class="admin-page-loading">
      加载中…
    </div>
    <p v-else-if="error" class="admin-page-error">
      {{ error }}
    </p>
    <AdminWeeklyEditor
      v-else-if="isAuthenticated"
      ref="editorRef"
      :initial="initial"
      @save="handleSave"
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
