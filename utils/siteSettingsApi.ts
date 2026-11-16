import type { SiteSettings, SiteSettingsDetail } from '../types/siteSettings'
import { adminFetch } from './adminApi'

/** 公开读取站点设置（前台渲染用） */
export async function fetchSiteSettings(): Promise<SiteSettingsDetail> {
  const res = await fetch('/api/site-settings')
  if (!res.ok)
    throw new Error(`加载站点设置失败 (${res.status})`)
  return res.json() as Promise<SiteSettingsDetail>
}

/** 管理员保存站点设置 */
export async function saveSiteSettings(payload: SiteSettings) {
  return adminFetch('/api/site-settings', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify(payload),
  }) as Promise<SiteSettingsDetail>
}

/** 管理员恢复默认值 */
export async function resetSiteSettings() {
  return adminFetch('/api/site-settings/reset', { method: 'POST' }) as Promise<SiteSettingsDetail>
}
