export type NoticeLineInput = string | {
  text: string
  url?: string
}

export interface NoticeLine {
  text: string
  url?: string
}

export interface NoticeSection {
  label: string
  lines: NoticeLine[]
}

export interface NoticeBoard {
  title: string
  /** 左侧随机文章轮播间隔（毫秒），缺省 5000 */
  rotateInterval?: number
  /** 公告行是否按 Markdown 解析并对裸域名自动成链 */
  allowMarkdown?: boolean
  sections: NoticeSection[]
}

export interface NoticeBoardDetail extends NoticeBoard {
  updatedAt?: string
}
