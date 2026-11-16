import type { CloudflareEnv } from '../../types/env'
import type { SiteSettings, SiteSettingsDetail } from '../../types/siteSettings'
import { DEFAULT_SITE_SETTINGS } from '../../shared/site-settings-defaults'
import { normalizeSiteSettings } from './normalize'

const SETTINGS_ROW_ID = 1

interface SiteSettingsRecord {
  id: number
  payload_json: string
  updated_at: string
}

/**
 * 读取站点设置。
 *
 * 表为空或数据损坏时返回默认值（而不是 null），
 * 让前台与后台都能拿到结构完整的对象，避免各处再做兜底。
 */
export async function getSiteSettings(env: CloudflareEnv): Promise<SiteSettingsDetail> {
  let row: SiteSettingsRecord | null = null
  try {
    row = await env.DB.prepare('SELECT * FROM site_settings WHERE id = ?')
      .bind(SETTINGS_ROW_ID)
      .first<SiteSettingsRecord>()
  }
  catch {
    // 迁移尚未应用时也要能用默认值渲染
    return { ...DEFAULT_SITE_SETTINGS }
  }

  if (!row)
    return { ...DEFAULT_SITE_SETTINGS }

  let parsed: unknown = {}
  try {
    parsed = JSON.parse(row.payload_json)
  }
  catch {
    parsed = {}
  }

  return {
    ...normalizeSiteSettings(parsed),
    updatedAt: row.updated_at,
  }
}

export async function saveSiteSettings(env: CloudflareEnv, input: unknown): Promise<SiteSettingsDetail> {
  const normalized: SiteSettings = normalizeSiteSettings(input)

  await env.DB.prepare(`
    INSERT INTO site_settings (id, payload_json, updated_at)
    VALUES (?, ?, datetime('now'))
    ON CONFLICT(id) DO UPDATE SET
      payload_json = excluded.payload_json,
      updated_at = datetime('now')
  `).bind(
    SETTINGS_ROW_ID,
    JSON.stringify(normalized),
  ).run()

  return getSiteSettings(env)
}

/** 清除自定义设置，回到配置文件里的默认值 */
export async function resetSiteSettings(env: CloudflareEnv): Promise<SiteSettingsDetail> {
  await env.DB.prepare('DELETE FROM site_settings WHERE id = ?').bind(SETTINGS_ROW_ID).run()
  return getSiteSettings(env)
}

export { DEFAULT_SITE_SETTINGS }
