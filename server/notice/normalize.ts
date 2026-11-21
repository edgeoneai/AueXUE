import type { NoticeBoard, NoticeLine, NoticeLineInput, NoticeSection } from '../../types/notice'

function normalizeLine(line: NoticeLineInput): NoticeLine | null {
  if (typeof line === 'string') {
    const text = line.trim()
    return text ? { text } : null
  }

  const text = String(line.text || '').trim()
  if (!text)
    return null

  const url = line.url ? String(line.url).trim() : undefined
  return url ? { text, url } : { text }
}

export function normalizeSections(input: Array<{ label?: string, lines?: NoticeLineInput[] }> | undefined): NoticeSection[] {
  if (!Array.isArray(input))
    return []

  return input
    .map((section) => {
      const label = String(section.label || '').trim()
      const lines = (section.lines || [])
        .map(line => normalizeLine(line))
        .filter((line): line is NoticeLine => Boolean(line))

      if (!label && !lines.length)
        return null

      return {
        label: label || '分组',
        lines,
      }
    })
    .filter((section): section is NoticeSection => Boolean(section))
}

/** 轮播间隔收到合理区间，太小学不动、太大显得静止 */
function normalizeRotateInterval(value: unknown): number {
  const n = Number(value)
  if (!Number.isFinite(n))
    return 5000
  return Math.min(60000, Math.max(1000, Math.floor(n)))
}

export function normalizeNoticeBoard(input: Partial<NoticeBoard> | null | undefined): NoticeBoard {
  return {
    title: String(input?.title || '公告栏').trim() || '公告栏',
    rotateInterval: normalizeRotateInterval(input?.rotateInterval),
    allowMarkdown: input?.allowMarkdown === true,
    sections: normalizeSections(input?.sections),
  }
}

export function parseNoticePayload(raw: string): NoticeBoard {
  const parsed = JSON.parse(raw) as Partial<NoticeBoard>
  return normalizeNoticeBoard(parsed)
}
