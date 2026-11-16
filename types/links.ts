export interface FriendLinkItem {
  url: string
  avatar: string
  name: string
  blog?: string
  desc?: string
  descr?: string
  color?: string
  siteshot?: string
}

export interface FriendLinkGroup {
  name?: string
  desc?: string
  links: FriendLinkItem[]
}

/** 友链页顶部的「加入本站友链方式」提示 */
export interface FriendLinkRule {
  icon: string
  text: string
}

export interface FriendLinkSiteInfoItem {
  label: string
  value: string
  /** 值是否可从站点配置自动获取（如头像、站点名），自动时 value 仅作占位 */
  auto?: boolean
}

export interface FriendLinkNoticeConfig {
  /** 是否显示整块提示 */
  enable?: boolean
  /** 标题 */
  title?: string
  /** 副标题 */
  subtitle?: string
  /** YAML 模板代码块内容 */
  template?: string
  /** 规则列表 */
  rules?: FriendLinkRule[]
  /** 「本站信息」标题 */
  siteInfoTitle?: string
  /** 「本站信息」各项 */
  siteInfo?: FriendLinkSiteInfoItem[]
}

export interface LinksFrontmatter {
  layout?: string
  title?: string
  icon?: string
  cover?: string
  comment?: boolean
  random?: boolean
  errorImg?: string
  linkGroups?: FriendLinkGroup[]
  links?: FriendLinkItem[]
  /** 友链申请提示，可在后台编辑 */
  friendLinkNotice?: FriendLinkNoticeConfig
}

export interface LinksDetail {
  frontmatter: LinksFrontmatter
  linkGroups: FriendLinkGroup[]
  /** 友链申请提示（服务端已补全默认值） */
  friendLinkNotice?: FriendLinkNoticeConfig
  source?: string
}
