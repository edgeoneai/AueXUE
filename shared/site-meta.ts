/** 供 Cloudflare Functions 使用的轻量站点元数据（避免打包 valaxy） */
export const siteMeta = {
  url: '',  // 运行时优先取后台设置或 SITE_URL
  lang: 'zh-CN',
  title: 'AIOVTUE',
  subtitle: '雪',
  description: '雨是神的烟花',
  author: {
    name: 'AIOVTUE',
  },
  themePrimary: '#DF9193',
} as const
