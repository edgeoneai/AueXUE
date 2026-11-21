import type {
  BangumiSettings,
  FooterSettings,
  HeroSettings,
  InteractionSettings,
  NavigationVideo,
  PersonalizeSettings,
  ServiceSettings,
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

/** 允许小数的数值收敛（用于 0~1 的阈值一类配置） */
function frac(value: unknown, fallback: number, min: number, max: number): number {
  const n = Number(value)
  if (!Number.isFinite(n))
    return fallback
  return Math.min(max, Math.max(min, n))
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

/** 一言/格言：兼容旧数据里的单个字符串，统一收敛成数组 */
function mottoList(value: unknown, fallback: string[]): string[] {
  if (typeof value === 'string') {
    const list = value.split('\n').map(item => item.trim()).filter(Boolean)
    return list.length ? list : fallback
  }
  return strList(value, fallback)
}

function normalizeHero(value: unknown, fallback: HeroSettings): HeroSettings {
  const raw = (value && typeof value === 'object' ? value : {}) as Record<string, unknown>
  return {
    title: str(raw.title, fallback.title),
    motto: mottoList(raw.motto, fallback.motto),
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

function normalizeBangumi(raw: Record<string, unknown>, fallback: BangumiSettings): BangumiSettings {
  // uid 只允许数字，避免把任意字符串拼进 B 站接口 URL
  const vmid = str(raw.vmid).trim().replace(/\D/g, '')
  return {
    enable: bool(raw.enable, fallback.enable),
    vmid,
    quote: str(raw.quote, fallback.quote),
  }
}

function normalizeService(raw: Record<string, unknown>, fallback: ServiceSettings): ServiceSettings {
  return {
    twikooEnvId: str(raw.twikooEnvId, fallback.twikooEnvId),
    vercountApi: str(raw.vercountApi, fallback.vercountApi),
    metingId: str(raw.metingId, fallback.metingId),
    metingServer: str(raw.metingServer, fallback.metingServer),
    metingType: str(raw.metingType, fallback.metingType),
    hitokotoApi: str(raw.hitokotoApi, fallback.hitokotoApi),
  }
}

function normalizeInteraction(raw: Record<string, unknown>, fallback: InteractionSettings): InteractionSettings {
  return {
    scrollDamping: bool(raw.scrollDamping, fallback.scrollDamping),
    scrollAnimation: bool(raw.scrollAnimation, fallback.scrollAnimation),
    scrollIndicator: bool(raw.scrollIndicator, fallback.scrollIndicator),
    scrollLock: bool(raw.scrollLock, fallback.scrollLock),
    scrollToTop: bool(raw.scrollToTop, fallback.scrollToTop),
    scrollDown: bool(raw.scrollDown, fallback.scrollDown),
    postNavMerge: bool(raw.postNavMerge, fallback.postNavMerge),
    tagsRainbow: bool(raw.tagsRainbow, fallback.tagsRainbow),
    mobileNoticeTicker: bool(raw.mobileNoticeTicker, fallback.mobileNoticeTicker),
  }
}

function normalizePersonalize(raw: Record<string, unknown>, fallback: PersonalizeSettings): PersonalizeSettings {
  return {
    searchEnable: bool(raw.searchEnable, fallback.searchEnable),
    searchType: str(raw.searchType, fallback.searchType),
    fuseThreshold: frac(raw.fuseThreshold, fallback.fuseThreshold, 0, 1),
    fuseIgnoreLocation: bool(raw.fuseIgnoreLocation, fallback.fuseIgnoreLocation),
    mediumZoom: bool(raw.mediumZoom, fallback.mediumZoom),
    codeFoldLineLimit: Math.min(500, num(raw.codeFoldLineLimit, fallback.codeFoldLineLimit, 0)),
    wordCount: bool(raw.wordCount, fallback.wordCount),
    taxonomy: bool(raw.taxonomy, fallback.taxonomy),
  }
}

/** 抽卡视频：只保留有 url 的项，weight 收敛到 1~100，缺省 1 */
function navigationVideos(value: unknown, fallback: NavigationVideo[]): NavigationVideo[] {
  if (!Array.isArray(value))
    return fallback
  const list = value
    .map((item): NavigationVideo | null => {
      if (!item || typeof item !== 'object')
        return null
      const raw = item as Record<string, unknown>
      const url = str(raw.url).trim()
      if (!url)
        return null
      return { url, weight: Math.min(100, num(raw.weight, 1, 1)) }
    })
    .filter((item): item is NavigationVideo => Boolean(item))
  return list.length ? list : fallback
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
  const bangumiRaw = (raw.bangumi && typeof raw.bangumi === 'object' ? raw.bangumi : {}) as Record<string, unknown>
  const serviceRaw = (raw.service && typeof raw.service === 'object' ? raw.service : {}) as Record<string, unknown>
  const interactionRaw = (raw.interaction && typeof raw.interaction === 'object' ? raw.interaction : {}) as Record<string, unknown>
  const personalizeRaw = (raw.personalize && typeof raw.personalize === 'object' ? raw.personalize : {}) as Record<string, unknown>

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
    service: normalizeService(serviceRaw, fallback.service),
    interaction: normalizeInteraction(interactionRaw, fallback.interaction),
    personalize: normalizePersonalize(personalizeRaw, fallback.personalize),
    navigationVideos: navigationVideos(raw.navigationVideos, fallback.navigationVideos),
    bangumi: normalizeBangumi(bangumiRaw, fallback.bangumi),
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
