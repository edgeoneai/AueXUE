import type { FriendLinkNoticeConfig, FriendLinkRule, FriendLinkSiteInfoItem } from '../../types/links'

/**
 * 友链申请提示的默认值。
 *
 * 这些文案原先硬编码在 components/FriendLinkNotice.vue 里，
 * 现在改为可在后台「友链管理」编辑，存入 links/index.md 的 frontmatter。
 * 未配置时回落到这里，表现与改造前一致。
 */
export const DEFAULT_FRIEND_LINK_NOTICE: FriendLinkNoticeConfig = {
  enable: true,
  title: '加入本站友链方式',
  subtitle: '参照以下格式留言即可',
  template: `- name: #站点名称
  link: #站点链接
  avatar: #站长头像
  descr: #站点描述
  siteshot: #站点截图`,
  rules: [
    { icon: '🎉', text: '本站支持交换友链，在您提出申请之前，请将本站添加到友链' },
    { icon: '🍵', text: '为了保障本站用户，本站仅支持个人网站的友链申请' },
    { icon: '💡', text: '申请本站友链需要拥有独立域名（非免费域名），建议开启全站 HTTPS' },
    { icon: '⌛', text: '如果友情链接已经添加，请保持网站的正常访问，会定期清理僵尸网站' },
    { icon: '🐚', text: '网站有一定的实质性内容和主题，不能是空壳网站和练手网站' },
    { icon: '💕', text: '感谢您对本站的支持，如果您已经满足上述要求，请在下方表单提交友链申请~~~' },
  ],
  siteInfoTitle: '本站友链信息如下：',
  siteInfo: [
    { label: '站点名称', value: '', auto: true },
    { label: '站点链接', value: '', auto: true },
    { label: '站长头像', value: '', auto: true },
    { label: '站点描述', value: '', auto: true },
    { label: '站点截图', value: '' },
  ],
}

/** 把任意输入规范成完整的提示配置，缺失项回落默认值 */
export function normalizeFriendLinkNotice(input: unknown): FriendLinkNoticeConfig {
  const fallback = DEFAULT_FRIEND_LINK_NOTICE
  const raw = (input && typeof input === 'object' ? input : {}) as Record<string, unknown>

  const rules: FriendLinkRule[] = Array.isArray(raw.rules)
    ? raw.rules
        .map((item): FriendLinkRule | null => {
          if (!item || typeof item !== 'object')
            return null
          const r = item as Record<string, unknown>
          const text = String(r.text ?? '').trim()
          if (!text)
            return null
          return { icon: String(r.icon ?? '').trim(), text }
        })
        .filter((item): item is FriendLinkRule => Boolean(item))
    : []

  const siteInfo: FriendLinkSiteInfoItem[] = Array.isArray(raw.siteInfo)
    ? raw.siteInfo
        .map((item): FriendLinkSiteInfoItem | null => {
          if (!item || typeof item !== 'object')
            return null
          const r = item as Record<string, unknown>
          const label = String(r.label ?? '').trim()
          if (!label)
            return null
          return {
            label,
            value: String(r.value ?? ''),
            auto: r.auto === true ? true : undefined,
          }
        })
        .filter((item): item is FriendLinkSiteInfoItem => Boolean(item))
    : []

  return {
    enable: raw.enable === undefined ? fallback.enable : raw.enable === true,
    title: String(raw.title ?? '').trim() || fallback.title,
    subtitle: String(raw.subtitle ?? '').trim() || fallback.subtitle,
    template: typeof raw.template === 'string' && raw.template.trim() ? raw.template : fallback.template,
    rules: rules.length ? rules : fallback.rules,
    siteInfoTitle: String(raw.siteInfoTitle ?? '').trim() || fallback.siteInfoTitle,
    siteInfo: siteInfo.length ? siteInfo : fallback.siteInfo,
  }
}
