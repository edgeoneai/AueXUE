import { defineValaxyConfig } from 'valaxy'
import { addonVercount } from 'valaxy-addon-vercount'
import { addonMeting } from 'valaxy-addon-meting'
import { addonHitokoto } from 'valaxy-addon-hitokoto'
import { addonTwikoo } from 'valaxy-addon-twikoo'
import { vaFoucLoader } from './plugins/va-fouc-loader'
import { disableSsgHydration } from './plugins/disable-ssg-hydration'
import { albumWebdavConfigPlugin } from './plugins/album-webdav-config'
import { albumWebdavProxy } from './plugins/album-webdav-proxy'
import { twikooLocalPlugin } from './plugins/twikoo-local'
import { dynamicPostsDevApi } from './plugins/dynamic-posts-dev-api'
import { excludePagesPostsMd } from './plugins/exclude-pages-posts-md'
import { excludeThemePaginationPage } from './plugins/exclude-theme-pagination-page'
import { patchVercountNoPeer } from './plugins/patch-vercount-no-peer'
import siteConfig from './site.config'
import { mainNavItems, iconSafelist } from './shared/nav-icons'
import { loadGeneratedSiteSettings } from './shared/generated-site-settings'

// 后台「站点设置」在构建期注入的值（cf:build 从 D1 读取），没有时用下面的默认值
const gen = loadGeneratedSiteSettings()
const pick = <T>(value: T | undefined, fallback: T): T =>
  value === undefined || value === null || (typeof value === 'string' && value.trim() === '') ? fallback : value

const themePrimary = pick(gen.themePrimary, '#DF9193')   //主题色

/**
 * User Config
 */
export default defineValaxyConfig({
  // site config see site.config.ts

  unocss: {
    safelist: [
      ...iconSafelist,
      'i-mdi-search',
      'i-mdi-close',
      'i-mdi-account-outline',
      'i-mdi-lock-outline',
      'i-mdi-eye-outline',
      'i-mdi-eye-off-outline',
      'i-mdi-arrow-left',
      'i-mdi-menu',
      'i-mdi-file-document-outline',
      'i-mdi-file-code-outline',
      'i-mdi-open-in-new',
      'i-mdi-home-export-outline',
      'i-mdi-chevron-left',
      'i-mdi-chevron-down',
      'i-mdi-magnify',
      'i-mdi-refresh',
      'i-mdi-plus',
      'i-mdi-arrow-down',
      'i-mdi-arrow-up',
      'i-mdi-image-outline',
      'i-mdi-bullhorn-outline',
      'i-mdi-information-outline',
      'i-mdi-delete-outline',
      'i-mdi-pencil-outline',
      'i-mdi-close',
      'i-mdi-format-list-bulleted',
      'i-mdi-check-circle-outline',
      'i-ri-arrow-left-s-line',
      'i-ri-arrow-right-s-line',
    ],
  },

  vite: {
    plugins: [patchVercountNoPeer(), twikooLocalPlugin(), excludePagesPostsMd(), excludeThemePaginationPage(), albumWebdavConfigPlugin(), albumWebdavProxy(), dynamicPostsDevApi(), disableSsgHydration(), vaFoucLoader({
      avatar: pick(gen.avatar, '/favicon.png'),
      title: siteConfig.title,
      subtitle: siteConfig.subtitle,
      primary: themePrimary,
    })],
  },

  modules: {
    rss: {
      // 文章改由 /atom.xml Pages Function 动态生成
      enable: false,
      fullText: false,
      extractImagePathsFromHTML: true,
    },
  },
  
  build: {
    ssgForPagination: false,
    foucGuard: {
      enabled: true,
      maxDuration: 6000,
    },
  },
  
  
  
  
  siteConfig: {
    // 启用评论
    comment: {
      enable: true
    },
  },



  theme: 'sakura',  //主题不支持切换哦

  themeConfig: {
    notice: {
      rotateInterval: 5000,
      title: '公告栏',    //公告栏不支持在这里改了，集成到后台管理了
      // 【A4 开关】公告行是否按 Markdown 解析并对裸域名自动生成链接；默认 false = 保持现状（纯文本、不自动链接）
      allowMarkdown: false,
      sections: [
        {
          label: '--- 主域名 ---',
          lines: [
            'daily.yybb.us',
            'daily.20030327.xyz',
            // 也支持对象：{ text: '显示文字', url: 'https://example.com' }
          ],
        },
        {
          label: '--- 备用域名 ---',
          lines: [
            '这里改没有用',
          ],
        },
      ],
    },
    // 导航页「随机网站跳转」抽卡视频：weight 越大越容易抽到
    navigation: {
      randomDrawVideos: [
        {
          url: '/img/1.mp4',
          weight: 1,
        },
        {
          url: '/img/2.mp4',
          weight: 2,
        },
        {
          url: '/img/3.mp4',
          weight: 3,
        },
      ],
    },
    ui: {
      primary: themePrimary,
      postList: {
        responsive: {
          xl: 1,
        }
     }  
    },

    postList: {
      defaultImage: pick(gen.defaultCover, '/default-cover.png'), //文章默认封面
    },

    
    sidebar: [...mainNavItems],
    sidebarOptions: {
      position: 'left',
      offset: true,
      initialState: false,
      // null：不从 session/localStorage 恢复，避免 SSG hydration 不一致
      persistence: null,
    },    
    
    
    
    hero: {
      title: pick(gen.hero?.title, 'AIOVTUE'),   //首页中间的文字
      // 【A3】motto 现已支持 string | string[]：写成数组则每次加载随机取一句；保持单个字符串时行为与现状完全一致
      motto: pick(gen.hero?.motto, '雨是神的烟花'),
      urls: Array.isArray(gen.hero?.urls) && gen.hero.urls.length ? gen.hero.urls : [
      '/hero/tt3.png', 
      '/hero/hero-1.jpg',
      '/hero/hero-2.png',
      '/hero/hero-3.jpg',
      '/hero/hero-1.mp4',
      '/hero/hero-2.mp4',
      '/hero/tt1.png', 
      '/hero/tt2.png', 
      ],
      randomUrls: gen.hero?.randomUrls ?? true,
      // 自定义视频播放器
      playerUrl: pick(gen.hero?.playerUrl, '/hero/player.mp4'),
      style: pick(gen.hero?.style, 'dot'), // 使用扫描线效果
      fixedImg: gen.hero?.fixedImg ?? true, // 固定背景图片
      typewriter: gen.hero?.typewriter ?? true, // 启用打字机效果
      enableHitokoto: gen.hero?.enableHitokoto ?? true, // 启用一言
      socialStyle: pick(gen.hero?.socialStyle, 'merge'), // 一言下方显示社交图标
      waveTheme: pick(gen.hero?.waveTheme, 'horizontal'), // 设置水平波纹主题
    },
    
  postFooter: {
    navigationMerge: true // 合并导航显示
  }, 

  // 【A1 开关】文章页「本文字数 / 阅读时长」
  post: {
    meta: {
      // 是否在文章页显示本文字数与预计阅读时长；默认 false = 保持现状（不显示）
      wordCount: false,
    },
  },

  // 【A5 开关】首页相关（移动端公告滚动条）
  home: {
    // 是否在移动端首页启用公告单行滚动 ticker；默认 false = 保持现状（不启用）
    mobileNoticeTicker: false,
  },

  // 【A7 开关】友链相关
  links: {
    // 友链随机排序开关（三态，默认「不设」）：
    //   不设（undefined）= 沿用页面 frontmatter 的 random 字段，即当前表现
    //   显式 true        = 强制开启随机
    //   显式 false       = 强制关闭，覆盖 frontmatter
    // 之所以默认不设：content/links/index.md 目前没有 random 字段（当前即不随机），
    // 但若在此写死 false，今后用 frontmatter.random: true 开启随机的路径会失效。
    // shuffleGroups: true,
  },

   footer: {
      powered: false,
      since: gen.footer?.since ?? 2024,
      runtimeSince: pick(gen.footer?.runtimeSince, '2024-01-01'),   //页脚计时时间
      icon: {
        animated: true,
        url: 'https://your-website.com',
        title: 'Your Name',
      },
      icp: pick(gen.footer?.icp, '<a href="https://icp.gov.moe/?keyword=20260258" target="_blank" rel="noopener">萌ICP备20260258号</a>'),    //页脚网站备案
      // 【A6 开关】页脚是否显示访客统计（本站访客 site.uv + 本站访问 site.pv）；默认 false = 保持现状（不显示）
      // 说明：Vercount 只提供 page_pv/page_uv/site_pv/site_uv，无按日维度；且 online 已被 patch 成常量，故不做「今日访客」与「在线人数」
      visitors: false,
    }, 
  
    navbar: [...mainNavItems],
    navbarOptions: {
      title: Array.isArray(gen.navbar?.title) && gen.navbar.title.length ? gen.navbar.title : ['AIOVTUE-', '雪'],   //顶栏和侧边栏文字
      subTitle: pick(gen.navbar?.subTitle, '雨是神的烟花'),
      offset: 0,
      invert: ['home'],
      showMarker: false,
      autoHide: ['home'],
      // 勿设置 tools：Sakura 主题在检测到 tools 后会清空默认工具栏
    },

 
    pagination: {
      type: 'standard',
      itemsPerPage: gen.itemsPerPage ?? 10,   //分页设置
    },
 
    
    scrollDamping: true, // 启用滚动阻尼
    scrollAnimation: true, // 启用滚动动画
    scrollIndicator: true, // 显示滚动指示器
    scrollLock: false, // 禁用滚动锁定
    scrollToTop: false,
    scrollDown: {
      enable: true,
    },             //首页下滑按钮

    // 分类页样式：list 列表 / chart 环状图（玫瑰图或旭日图）
    categories: {
      style: pick(gen.pageStyles?.categories, 'chart'),
    },

    // 归档页样式：list 时间线 / chart 发布统计折线面积图
    archives: {
      style: pick(gen.pageStyles?.archives, 'chart'),
      startMonth: pick(gen.pageStyles?.archivesStartMonth, '2024-01'),
    },

    // 标签页样式：list 按钮列表 / chart 柱状统计图
    tagsPage: {
      style: pick(gen.pageStyles?.tags, 'chart'),
      chartLength: gen.pageStyles?.tagsChartLength ?? 10,
    },

    tags: {
      rainbow: false,
    },
  },

  addons: [
    addonTwikoo({
      envId: 'https://your-twikoo/',  //写你自己的twikoo评论地址
    }),
    addonVercount({
      api: 'cn'   //访问统计
    }),
    addonMeting({
      global: false,
      props: {
        id: '2489775340',    //原番剧页面id，该版本未配置
        server: 'netease',
        type: 'playlist',
      },
      options: {
        autoHidden: true,
        animationIn: true,
        lyricHidden: true,
      },
    }),
    // addonBackgrounds({}),
    addonHitokoto({
      api: 'intl',
    }),
  ],
})
