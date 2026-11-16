import { computed, ref } from 'vue'
import type { SiteSettingsDetail } from '../types/siteSettings'
import { fetchSiteSettings } from '../utils/siteSettingsApi'

const settings = ref<SiteSettingsDetail | null>(null)
const loading = ref(false)
const loaded = ref(false)
let inflight: Promise<SiteSettingsDetail | null> | null = null

export function useSiteSettings() {
  /**
   * 加载站点设置。失败时静默回落到 null，
   * 调用方据此继续使用 site.config.ts 里的构建期默认值。
   */
  async function loadSettings(force = false) {
    if (loaded.value && !force)
      return settings.value

    if (inflight && !force)
      return inflight

    loading.value = true
    inflight = fetchSiteSettings()
      .then((data) => {
        settings.value = data
        loaded.value = true
        return data
      })
      .catch(() => {
        settings.value = null
        loaded.value = true
        return null
      })
      .finally(() => {
        loading.value = false
        inflight = null
      })

    return inflight
  }

  return {
    settings,
    loading,
    loaded,
    loadSettings,
    /** 便于在模板里直接取某个字段并回落到默认值 */
    pick: computed(() => settings.value),
  }
}
