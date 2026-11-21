import type { SiteSettingsDetail } from '../types/siteSettings'
import { valaxyConfigRef } from 'valaxy/client/config.ts'
import { buildThemeShades } from './colorShades'

/**
 * 把后台配置的站点信息写回 valaxy 的运行时配置。
 *
 * valaxy 的 `useSiteConfig()` 是 `computed(() => valaxyConfigRef.value.siteConfig)`，
 * 而 `valaxyConfigRef` 是模块级 shallowRef。因此改写这个 ref，
 * 所有用到 `useSiteConfig()` 的组件（含 sakura 主题内部）都会响应式更新，
 * 不必逐个组件改造。
 */

/**
 * 合并站点设置到运行时配置。
 * @returns 是否成功应用
 */
export function applySiteSettings(settings: SiteSettingsDetail | null) {
  if (!settings || !valaxyConfigRef.value)
    return false

  const config = valaxyConfigRef.value as Record<string, any>
  const siteConfig: Record<string, any> = { ...(config.siteConfig || {}) }
  const themeConfig: Record<string, any> = { ...(config.themeConfig || {}) }

  // --- site.config.ts 对应部分 ---
  siteConfig.url = settings.url
  siteConfig.lang = settings.lang
  siteConfig.title = settings.title
  siteConfig.subtitle = settings.subtitle
  siteConfig.description = settings.description
  siteConfig.favicon = settings.favicon
  siteConfig.author = {
    ...(siteConfig.author || {}),
    name: settings.authorName,
    avatar: settings.avatar,
    status: {
      emoji: settings.authorStatus?.emoji || '',
      message: settings.authorStatus?.message || '',
    },
  }
  siteConfig.social = settings.social.map(item => ({
    name: item.name,
    link: item.link,
    icon: item.icon,
    color: item.color,
  }))
  siteConfig.sponsor = {
    enable: settings.sponsor.enable,
    title: settings.sponsor.title,
    methods: settings.sponsor.methods.map(item => ({
      name: item.name,
      url: item.url,
      icon: item.icon,
      color: item.color,
    })),
  }

  // --- valaxy.config.ts 对应部分 ---
  themeConfig.ui = {
    ...(themeConfig.ui || {}),
    primary: settings.themePrimary,
  }
  themeConfig.postList = {
    ...(themeConfig.postList || {}),
    defaultImage: settings.defaultCover,
  }
  themeConfig.hero = {
    ...(themeConfig.hero || {}),
    title: settings.hero.title,
    motto: settings.hero.motto,
    urls: settings.hero.urls,
    randomUrls: settings.hero.randomUrls,
    playerUrl: settings.hero.playerUrl,
    style: settings.hero.style,
    fixedImg: settings.hero.fixedImg,
    typewriter: settings.hero.typewriter,
    enableHitokoto: settings.hero.enableHitokoto,
    socialStyle: settings.hero.socialStyle,
    waveTheme: settings.hero.waveTheme,
  }
  themeConfig.navbarOptions = {
    ...(themeConfig.navbarOptions || {}),
    title: settings.navbar.title,
    subTitle: settings.navbar.subTitle,
  }
  themeConfig.footer = {
    ...(themeConfig.footer || {}),
    runtimeSince: settings.footer.runtimeSince,
    since: settings.footer.since,
    icp: settings.footer.icp,
    icon: {
      ...(themeConfig.footer?.icon || {}),
      ...(settings.footer.icon || {}),
    },
  }
  themeConfig.pagination = {
    ...(themeConfig.pagination || {}),
    itemsPerPage: settings.itemsPerPage,
  }
  themeConfig.categories = {
    ...(themeConfig.categories || {}),
    style: settings.pageStyles.categories,
  }
  themeConfig.archives = {
    ...(themeConfig.archives || {}),
    style: settings.pageStyles.archives,
    startMonth: settings.pageStyles.archivesStartMonth,
  }
  themeConfig.tagsPage = {
    ...(themeConfig.tagsPage || {}),
    style: settings.pageStyles.tags,
    chartLength: settings.pageStyles.tagsChartLength,
  }

  // --- 滚动与交互 ---
  const interaction = settings.interaction
  if (interaction) {
    themeConfig.scrollDamping = interaction.scrollDamping
    themeConfig.scrollAnimation = interaction.scrollAnimation
    themeConfig.scrollIndicator = interaction.scrollIndicator
    themeConfig.scrollLock = interaction.scrollLock
    themeConfig.scrollToTop = interaction.scrollToTop
    themeConfig.scrollDown = {
      ...(themeConfig.scrollDown || {}),
      enable: interaction.scrollDown,
    }
    themeConfig.postFooter = {
      ...(themeConfig.postFooter || {}),
      navigationMerge: interaction.postNavMerge,
    }
    themeConfig.tags = {
      ...(themeConfig.tags || {}),
      rainbow: interaction.tagsRainbow,
    }
    themeConfig.home = {
      ...(themeConfig.home || {}),
      mobileNoticeTicker: interaction.mobileNoticeTicker,
    }
  }

  // --- 个性化：搜索 / 图片预览 / 代码折叠 ---
  const personalize = settings.personalize
  if (personalize) {
    siteConfig.search = {
      ...(siteConfig.search || {}),
      enable: personalize.searchEnable,
      type: personalize.searchType,
    }
    siteConfig.fuse = {
      ...(siteConfig.fuse || {}),
      options: {
        ...(siteConfig.fuse?.options || {}),
        threshold: personalize.fuseThreshold,
        ignoreLocation: personalize.fuseIgnoreLocation,
      },
    }
    siteConfig.mediumZoom = {
      ...(siteConfig.mediumZoom || {}),
      enable: personalize.mediumZoom,
    }
    siteConfig.codeFoldLineLimit = personalize.codeFoldLineLimit
    themeConfig.post = {
      ...(themeConfig.post || {}),
      meta: {
        ...(themeConfig.post?.meta || {}),
        wordCount: personalize.wordCount,
        taxonomy: personalize.taxonomy,
      },
    }
  }

  // --- 导航页抽卡视频 ---
  if (settings.navigationVideos?.length) {
    themeConfig.navigation = {
      ...(themeConfig.navigation || {}),
      randomDrawVideos: settings.navigationVideos.map(item => ({ url: item.url, weight: item.weight })),
    }
  }

  // --- 评论与第三方服务接入 ---
  // 注意：twikoo / vercount / meting / hitokoto 是 addons，在构建期就编译进产物，
  // 运行时无法替换。它们由 scripts/fetch-site-settings.mjs 写入 .site-settings.local.json，
  // 配置阶段经 loadGeneratedSiteSettings() 注入（见 valaxy.config.ts 的 addons 段），
  // 因此后台改完需要重新构建部署才生效，与加载动画、<title> 的行为一致。
  const service = settings.service
  if (service)
    siteConfig.comment = { ...(siteConfig.comment || {}), enable: Boolean(service.twikooEnvId?.trim()) }

  valaxyConfigRef.value = { ...config, siteConfig, themeConfig } as typeof valaxyConfigRef.value

  applyPrimaryColor(settings.themePrimary)
  return true
}

/**
 * 主题色在编译期写进 SCSS 变量（--va-c-primary 等），运行时改配置不会连带更新，
 * 因此单独覆盖这几个 CSS 变量。
 */
export function applyPrimaryColor(primary: string) {
  if (typeof document === 'undefined')
    return

  const shades = buildThemeShades(primary)
  if (!shades)
    return

  const style = document.documentElement.style
  style.setProperty('--va-c-primary', shades.primary)
  style.setProperty('--va-c-primary-light', shades.light)
  style.setProperty('--va-c-primary-lighter', shades.lighter)
  style.setProperty('--va-c-primary-dark', shades.dark)
}
