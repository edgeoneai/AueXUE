import type { SiteSettings } from '../types/siteSettings'

/**
 * 站点设置默认值，对应 site.config.ts 与 valaxy.config.ts 的当前内容。
 *
 * 放在 shared/ 是为了让服务端（无值时的兜底）和前端（表单初始值）共用同一份，
 * 避免两处各写一份导致不一致。
 *
 * 修改那两个配置文件时记得同步这里，否则后台「恢复默认」会回到旧值。
 */
export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  url: 'https://your.site',
  lang: 'zh-CN',
  title: 'AIOVTUE',
  subtitle: '雪',
  description: '雨是神的烟花',
  authorName: 'AIOVTUE',
  avatar: 'https://r2tc.20030327.xyz/file/博客/主题/1780655293662_avatar_me.jpg.PNG',
  authorStatus: {
    emoji: '🌸',
    message: '发呆ing...',
  },
  favicon: '/favicon.png',
  themePrimary: '#DF9193',
  social: [
    { name: 'RSS', link: '/atom.xml', icon: 'i-ri-rss-line', color: 'orange' },
    { name: 'GitHub', link: 'https://github.com/AIOVTUE', icon: 'i-ri-github-line', color: '#6e5494' },
    {
      name: '微信公众号',
      link: 'https://r2tc.20030327.xyz/file/博客/主题/1780654223927_mmexport1780654189207.jpeg',
      icon: 'i-ri-wechat-2-line',
      color: '#1AAD19',
    },
    { name: 'E-Mail', link: 'mailto:x@yybb.us', icon: 'i-ri-mail-line', color: '#8E71C1' },
    { name: 'Travelling', link: 'https://www.travellings.cn/go.html', icon: 'i-ri-train-line', color: '#8cb1b3' },
  ],
  sponsor: {
    enable: true,
    title: '我很可爱，请给我钱！',
    methods: [
      {
        name: '支付宝',
        url: 'https://i.postimg.cc/fyYTncnJ/IMG-20240915-155521.jpg',
        color: '#00A3EE',
        icon: 'i-ri-alipay-line',
      },
      {
        name: '微信支付',
        url: 'https://i.postimg.cc/26s8KHts/IMG-20240915-155547.png',
        color: '#2DC100',
        icon: 'i-ri-wechat-pay-line',
      },
    ],
  },
  defaultCover: '/default-cover.png',
  hero: {
    title: 'AIOVTUE',
    motto: ['雨是神的烟花'],
    urls: [
      '/hero/tt3.png',
      '/hero/hero-1.jpg',
      '/hero/hero-2.png',
      '/hero/hero-3.jpg',
      '/hero/hero-1.mp4',
      '/hero/hero-2.mp4',
      '/hero/tt1.png',
      '/hero/tt2.png',
    ],
    randomUrls: true,
    playerUrl: '/hero/player.mp4',
    style: 'dot',
    fixedImg: true,
    typewriter: true,
    enableHitokoto: true,
    socialStyle: 'merge',
    waveTheme: 'horizontal',
  },
  navbar: {
    title: ['AIOVTUE-', '雪'],
    subTitle: '雨是神的烟花',
  },
  footer: {
    runtimeSince: '2024-01-01',
    since: 2024,
    icp: '<a href="https://icp.gov.moe/?keyword=20260258" target="_blank" rel="noopener">萌ICP备20260258号</a>',
    icon: {
      animated: true,
      url: 'https://your-website.com',
      title: 'Your Name',
    },
  },
  service: {
    twikooEnvId: 'https://your-twikoo/',
    vercountApi: 'cn',
    metingId: '2489775340',
    metingServer: 'netease',
    metingType: 'playlist',
    hitokotoApi: 'intl',
  },
  interaction: {
    scrollDamping: true,
    scrollAnimation: true,
    scrollIndicator: true,
    scrollLock: false,
    scrollToTop: false,
    scrollDown: true,
    postNavMerge: true,
    tagsRainbow: false,
    mobileNoticeTicker: false,
  },
  personalize: {
    searchEnable: true,
    searchType: 'fuse',
    fuseThreshold: 0.4,
    fuseIgnoreLocation: true,
    mediumZoom: false,
    codeFoldLineLimit: 10,
    wordCount: false,
    taxonomy: false,
  },
  bangumi: {
    enable: false,
    vmid: '',
    quote: '生命不息，追番不止！',
  },
  home: {
    layout: 'cards',
    listSidebar: true,
  },
  weekly: {
    enable: true,
    title: '周刊',
    category: '周刊',
  },
  navigationVideos: [
    { url: '/img/1.mp4', weight: 1 },
    { url: '/img/2.mp4', weight: 2 },
    { url: '/img/3.mp4', weight: 3 },
  ],
  itemsPerPage: 10,
  pageStyles: {
    categories: 'chart',
    archives: 'chart',
    archivesStartMonth: '2024-01',
    tags: 'chart',
    tagsChartLength: 10,
  },
}
