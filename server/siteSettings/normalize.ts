import type {
  FooterSettings,
  HeroSettings,
  SiteSettings,
  SiteSocialLink,
  SponsorMethod,
} from '../../types/siteSettings'
import { DEFAULT_SITE_SETTINGS } from '../../shared/site-settings-defaults'

function str(value: unknown, fallback = ''): string {
  if (value === undefined || value === null)
    return fallback
  return String(value)
}

function bool(value: unknown, fallback: boolean): boolean {
  if (typeof value === 'boolean')
    return value
  if (value === 'true')
    return true
  if (value === 'false')
    return false
  return fallback
}

function num(value: unknown, fallback: number, min = Number.NEGATIVE_INFINITY): number {
  const n = Number(value)
  if (!Number.isFinite(n))
    return fallback
  return Math.max(min, Math.floor(n))
}

/** 颜色只接受 #RGB / #RRGGBB / 具名色，避免把任意字符串写进内联样式 */
function color(value: unknown, fallback?: string): string | undefined {
  const raw = str(value).trim()
  if (!raw)
    return fallback
  if (/^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(raw) || /^[a-z]+$/i.test(raw))
    return raw
  return fallback
}

function strList(value: unknown, fallback: string[]): string[] {
  if (!Array.isArray(value))
    return fallback
  const list = value.map(item => str(item).trim()).filter(Boolean)
  return list.length ? list : fallback
}

function socialList(value: unknown, fallback: SiteSocialLink[]): SiteSocialLink[] {
  if (!Array.isArray(value))
    return fallback
  const list = value
    .map((item): SiteSocialLink | null => {
      if (!item || typeof item !== 'object')
        return null
      const raw = item as Record<string, unknown>
      const name = str(raw.name).trim()
      const link = str(raw.link).trim()
      const icon = str(raw.icon).trim()
      if (!name || !link || !icon)
        return null
      return { name, link, icon, color: color(raw.color) }
    })
    .filter((item): item is SiteSocialLink => Boolean(item))
  return list.length ? list : fallback
}

function sponsorMethods(value: unknown, fallback: SponsorMethod[]): SponsorMethod[] {
  if (!Array.isArray(value))
    return fallback
  const list = value
    .map((item): SponsorMethod | null => {
      if (!item || typeof item !== 'object')
        return null
      const raw = item as Record<string, unknown>
      const name = str(raw.name).trim()
      const url = str(raw.url).trim()
      if (!name || !url)
        return null
      return {
        name,
        url,
        icon: str(raw.icon).trim() || undefined,
        color: color(raw.color),
      }
    })
    .filter((item): item is SponsorMethod => Boolean(item))
  return list.length ? list : fallback
}

function normalizeHero(value: unknown, fallback: HeroSettings): HeroSettings {
  const raw = (value && typeof value === 'object' ? value : {}) as Record<string, unknown>
  return {
    title: str(raw.title, fallback.title),
    motto: str(raw.motto, fallback.motto),
    urls: strList(raw.urls, fallback.urls),
    randomUrls: bool(raw.randomUrls, fallback.randomUrls),
    playerUrl: str(raw.playerUrl, fallback.playerUrl || '') || undefined,
    style: str(raw.style, fallback.style || 'dot'),
    fixedImg: bool(raw.fixedImg, fallback.fixedImg),
    typewriter: bool(raw.typewriter, fallback.typewriter),
    enableHitokoto: bool(raw.enableHitokoto, fallback.enableHitokoto),
    socialStyle: str(raw.socialStyle, fallback.socialStyle || 'merge'),
    waveTheme: str(raw.waveTheme, fallback.waveTheme || 'horizontal'),
  }
}

function normalizeFooter(value: unknown, fallback: FooterSettings): FooterSettings {
  const raw = (value && typeof value === 'object' ? value : {}) as Record<string, unknown>
  const iconRaw = (raw.icon && typeof raw.icon === 'object' ? raw.icon : {}) as Record<string, unknown>
  return {
    runtimeSince: str(raw.runtimeSince, fallback.runtimeSince),
    since: num(raw.since, fallback.since),
    icp: str(raw.icp, fallback.icp || '') || undefined,
    icon: {
      animated: bool(iconRaw.animated, fallback.icon?.animated ?? true),
      url: str(iconRaw.url, fallback.icon?.url || '') || undefined,
      title: str(iconRaw.title, fallback.icon?.title || '') || undefined,
    },
  }
}

/**
 * 把任意输入规范成完整的 SiteSettings。
 * 缺失字段回落到默认值，保证前台永远拿到结构完整的对象。
 */
export function normalizeSiteSettings(input: unknown): SiteSettings {
  const fallback = DEFAULT_SITE_SETTINGS
  const raw = (input && typeof input === 'object' ? input : {}) as Record<string, unknown>

  const sponsorRaw = (raw.sponsor && typeof raw.sponsor === 'object' ? raw.sponsor : {}) as Record<string, unknown>
  const navbarRaw = (raw.navbar && typeof raw.navbar === 'object' ? raw.navbar : {}) as Record<string, unknown>
  const pageStylesRaw = (raw.pageStyles && typeof raw.pageStyles === 'object' ? raw.pageStyles : {}) as Record<string, unknown>
  const statusRaw = (raw.authorStatus && typeof raw.authorStatus === 'object' ? raw.authorStatus : {}) as Record<string, unknown>

  return {
    url: str(raw.url, fallback.url).trim() || fallback.url,
    lang: str(raw.lang, fallback.lang).trim() || fallback.lang,
    title: str(raw.title, fallback.title).trim() || fallback.title,
    subtitle: str(raw.subtitle, fallback.subtitle),
    description: str(raw.description, fallback.description),
    authorName: str(raw.authorName, fallback.authorName).trim() || fallback.authorName,
    avatar: str(raw.avatar, fallback.avatar),
    authorStatus: {
      emoji: str(statusRaw.emoji, fallback.authorStatus?.emoji || ''),
      message: str(statusRaw.message, fallback.authorStatus?.message || ''),
    },
    favicon: str(raw.favicon, fallback.favicon),
    themePrimary: color(raw.themePrimary, fallback.themePrimary) || fallback.themePrimary,
    social: socialList(raw.social, fallback.social),
    sponsor: {
      enable: bool(sponsorRaw.enable, fallback.sponsor.enable),
      title: str(sponsorRaw.title, fallback.sponsor.title),
      methods: sponsorMethods(sponsorRaw.methods, fallback.sponsor.methods),
    },
    defaultCover: str(raw.defaultCover, fallback.defaultCover),
    hero: normalizeHero(raw.hero, fallback.hero),
    navbar: {
      title: strList(navbarRaw.title, fallback.navbar.title),
      subTitle: str(navbarRaw.subTitle, fallback.navbar.subTitle),
    },
    footer: normalizeFooter(raw.footer, fallback.footer),
    itemsPerPage: Math.min(100, num(raw.itemsPerPage, fallback.itemsPerPage, 1)),
    pageStyles: {
      categories: str(pageStylesRaw.categories, fallback.pageStyles.categories),
      archives: str(pageStylesRaw.archives, fallback.pageStyles.archives),
      archivesStartMonth: str(pageStylesRaw.archivesStartMonth, fallback.pageStyles.archivesStartMonth),
      tags: str(pageStylesRaw.tags, fallback.pageStyles.tags),
      tagsChartLength: Math.min(100, num(pageStylesRaw.tagsChartLength, fallback.pageStyles.tagsChartLength, 1)),
    },
  }
}
