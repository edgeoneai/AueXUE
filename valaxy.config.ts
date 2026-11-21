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
    // 公告栏（标题、分组、每行内容、轮播间隔、Markdown 开关）全部由后台「公告管理」维护，
    // 数据存 D1 的 notice_board 表，此处不再保留配置文件兜底。
    // 导航页「随机网站跳转」抽卡视频：weight 越大越容易抽到
    // 导航页抽卡视频：优先取后台「站点设置 → 导航页」
    navigation: {
      randomDrawVideos: Array.isArray(gen.navigationVideos) && gen.navigationVideos.length
        ? gen.navigationVideos
        : [
            { url: '/img/1.mp4', weight: 1 },
            { url: '/img/2.mp4', weight: 2 },
            { url: '/img/3.mp4', weight: 3 },
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
      // 一言/格言：数组形式，每次加载随机取一句；只有一句时行为与单个字符串完全一致
      motto: Array.isArray(gen.hero?.motto) && gen.hero.motto.length
        ? gen.hero.motto
        : ['雨是神的烟花'],
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

  // 文章页显示项（字数/阅读时长、分类与标签）：优先取后台「站点设置 → 个性化」
  post: {
    meta: {
      wordCount: gen.personalize?.wordCount ?? false,
      taxonomy: gen.personalize?.taxonomy ?? false,
    },
  },

  // 移动端首页公告滚动条：优先取后台「站点设置 → 滚动与交互」
  home: {
    mobileNoticeTicker: gen.interaction?.mobileNoticeTicker ?? false,
  },

  // 友链相关（随机排序、分组布局）全部由后台「友链管理」维护，数据存 R2 的 links frontmatter，
  // 此处不再保留配置文件开关。

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
      // 页脚是否显示访客统计（本站访客 site.uv + 本站访问 site.pv）；默认 false = 保持现状（不显示）
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

  // 评论与第三方服务接入：优先取后台「站点设置 → 评论与接入」，没有则回落下面的默认值。
  // 这些是 addons，构建期编译进产物，后台改完需要重新构建部署才生效。
  addons: [
    addonTwikoo({
      envId: pick(gen.service?.twikooEnvId, 'https://your-twikoo/'),  //twikoo评论地址
    }),
    addonVercount({
      api: pick(gen.service?.vercountApi, 'cn')   //访问统计
    }),
    addonMeting({
      global: false,
      props: {
        id: pick(gen.service?.metingId, '2489775340'),    //歌单id
        server: pick(gen.service?.metingServer, 'netease'),
        type: pick(gen.service?.metingType, 'playlist'),
      },
      options: {
        autoHidden: true,
        animationIn: true,
        lyricHidden: true,
      },
    }),
    // addonBackgrounds({}),
    addonHitokoto({
      api: pick(gen.service?.hitokotoApi, 'intl'),
    }),
  ],
})
