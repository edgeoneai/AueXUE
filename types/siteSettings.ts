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
  /** 首页格言 / 副标题 */
  motto: string
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
