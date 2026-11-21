/** 站点信息设置：后台可编辑，前台运行时读取并覆盖 site.config.ts / valaxy.config.ts 的构建期默认值 */

export interface SiteSocialLink {
  name: string
  link: string
  icon: string
  color?: string
}

export interface SponsorMethod {
  name: string
  url: string
  icon?: string
  color?: string
}

export interface HeroSettings {
  /** 首页中间大标题 */
  title: string
  /** 首页格言 / 副标题；多句时每次加载随机取一句 */
  motto: string[]
  /** 背景图或视频地址列表 */
  urls: string[]
  /** 是否随机挑选背景 */
  randomUrls: boolean
  /** 自定义播放器视频地址 */
  playerUrl?: string
  /** 背景切换指示点样式 */
  style?: string
  /** 固定背景图 */
  fixedImg: boolean
  /** 打字机效果 */
  typewriter: boolean
  /** 一言 */
  enableHitokoto: boolean
  /** 社交图标展示方式 */
  socialStyle?: string
  /** 波纹主题 */
  waveTheme?: string
}

export interface NavbarSettings {
  /** 顶栏与侧边栏文字，数组形式支持多段着色 */
  title: string[]
  subTitle: string
}

export interface FooterSettings {
  /** 页脚计时起始时间 */
  runtimeSince: string
  /** 建站年份 */
  since: number
  /** 备案信息（可含 HTML） */
  icp?: string
  /** 页脚图标 */
  icon?: {
    animated?: boolean
    url?: string
    title?: string
  }
}

/**
 * 评论与第三方服务接入。
 * 这些值原本硬编码在 valaxy.config.ts 的 addons 里，改为后台可配。
 */
export interface ServiceSettings {
  /** Twikoo 评论服务地址 */
  twikooEnvId: string
  /** 访问统计接口区域：cn = 国内节点，空 = 默认节点 */
  vercountApi: string
  /** 音乐播放器歌单 ID（网易云） */
  metingId: string
  /** 音乐平台：netease / tencent / kugou 等 */
  metingServer: string
  /** 资源类型：playlist / album / song 等 */
  metingType: string
  /** 一言接口区域：intl = 国际，cn = 国内 */
  hitokotoApi: string
}

/** 追番页（Bilibili 追番列表，构建时拉取） */
export interface BangumiSettings {
  /** 是否启用追番页与构建时数据拉取 */
  enable: boolean
  /** Bilibili 用户 UID（追番列表需空间公开） */
  vmid: string
  /** 页面引言 */
  quote: string
}

/** 导航页抽卡视频 */
export interface NavigationVideo {
  url: string
  weight: number
}

/** 滚动与交互：控制页面滚动手感、文章上下篇合并、标签彩虹色 */
export interface InteractionSettings {
  scrollDamping: boolean
  scrollAnimation: boolean
  scrollIndicator: boolean
  scrollLock: boolean
  scrollToTop: boolean
  /** 首页下滑按钮 */
  scrollDown: boolean
  /** 合并上一篇/下一篇导航 */
  postNavMerge: boolean
  /** 标签彩虹配色 */
  tagsRainbow: boolean
  /** 移动端首页公告滚动条 */
  mobileNoticeTicker: boolean
}

/** 个性化：搜索、图片预览、代码块折叠等阅读体验参数 */
export interface PersonalizeSettings {
  /** 启用全文搜索 */
  searchEnable: boolean
  /** 搜索实现：fuse 等 */
  searchType: string
  /** 模糊匹配阈值，越低越精确（0~1） */
  fuseThreshold: number
  /** 忽略匹配位置 */
  fuseIgnoreLocation: boolean
  /** 图片点击放大预览 */
  mediumZoom: boolean
  /** 代码块超过该行数自动折叠 */
  codeFoldLineLimit: number
  /** 文章页显示本文字数与阅读时长 */
  wordCount: boolean
  /** 文章页头显示分类与标签 */
  taxonomy: boolean
}

export interface SiteSettings {
  /** 站点主 URL */
  url: string
  /** 语言 */
  lang: string
  /** 站点标题 */
  title: string
  /** 站点副标题 */
  subtitle: string
  /** 站点描述 */
  description: string
  /** 作者名 */
  authorName: string
  /** 站点头像 */
  avatar: string
  /** 作者状态 */
  authorStatus?: {
    emoji?: string
    message?: string
  }
  /** 站点图标 */
  favicon: string
  /** 主题色 */
  themePrimary: string
  /** 社交链接 */
  social: SiteSocialLink[]
  /** 打赏 */
  sponsor: {
    enable: boolean
    title: string
    methods: SponsorMethod[]
  }
  /** 文章列表默认封面 */
  defaultCover: string
  /** 首页 hero */
  hero: HeroSettings
  /** 顶栏 */
  navbar: NavbarSettings
  /** 页脚 */
  footer: FooterSettings
  /** 每页文章数 */
  itemsPerPage: number
  /** 评论与第三方服务接入 */
  service: ServiceSettings
  /** 滚动与交互 */
  interaction: InteractionSettings
  /** 个性化（搜索、图片预览、代码折叠、文章页显示项） */
  personalize: PersonalizeSettings
  /** 导航页抽卡视频（weight 越大越容易抽到） */
  navigationVideos: NavigationVideo[]
  /** 追番页 */
  bangumi: BangumiSettings
  /** 各列表页样式 */
  pageStyles: {
    categories: string
    archives: string
    archivesStartMonth: string
    tags: string
    tagsChartLength: number
  }
}

export interface SiteSettingsDetail extends SiteSettings {
  updatedAt?: string
}
