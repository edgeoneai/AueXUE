/**
 * 构建期拉取 Bilibili 追番列表，输出到 public/data/bangumi.json。
 *
 * 为什么放在构建期而不是运行时：
 * B 站 API 有来源校验与限流，浏览器直连会被 CORS 拦，Worker 每次请求都去拉也容易被封。
 * 构建期拉一次、产出静态 JSON，前端只读文件，稳定且零运行时开销。
 *
 * 配置来源：后台「站点设置 → 追番」写入 D1 的 site_settings，
 * 构建前由 scripts/fetch-site-settings.mjs 落到 .site-settings.local.json。
 * 未启用或没有 uid 时写入空数据，页面显示「未启用」，不阻断构建。
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { loadGeneratedSiteSettings } from '../shared/generated-site-settings.ts'

const ROOT = join(import.meta.dirname, '..')
const OUTPUT = join(ROOT, 'public', 'data', 'bangumi.json')
const API_BASE = 'https://api.bilibili.com/x/space/bangumi/follow/list'
const PAGE_SIZE = 24
const FETCH_TIMEOUT_MS = 15000
const MAX_RETRIES = 3

const STATUS_KEYS = [
  { status: 1, key: 'wantWatch' },
  { status: 2, key: 'watching' },
  { status: 3, key: 'watched' },
]

function formatNumber(num) {
  if (!num) return '-'
  if (num >= 100000000) return `${(num / 100000000).toFixed(1)} 亿`
  if (num >= 10000) return `${(num / 10000).toFixed(1)} 万`
  return String(num)
}

function formatTotal(count) {
  if (!count) return '-'
  if (count === -1) return '未完结'
  return `全 ${count} 话`
}

/** B 站封面统一转 https 并压成小尺寸，避免原图过大拖慢页面 */
function normalizeCoverUrl(cover) {
  const raw = String(cover || '').replace(/^http:/, 'https:').trim()
  if (!raw) return ''
  if (/@\d+w_\d+h\.(webp|jpg|png)/i.test(raw)) return raw
  try {
    const parsed = new URL(raw)
    return `${parsed.origin}${parsed.pathname}@96w_128h.webp`
  }
  catch {
    return raw
  }
}

function normalizeItem(item) {
  const cover = normalizeCoverUrl(item?.cover)
  const newEp = item?.new_ep?.index_show || ''
  const totalCount = item?.total_count > 0
    ? formatTotal(item.total_count)
    : (newEp || '-')

  return {
    title: String(item?.title || '').trim(),
    cover,
    url: String(item?.url || item?.short_url || '').trim(),
    seasonTypeName: String(item?.season_type_name || '').trim(),
    area: String(item?.areas?.[0]?.name || '').trim(),
    score: item?.rating?.score ?? null,
    follow: formatNumber(item?.stat?.follow),
    view: formatNumber(item?.stat?.view),
    summary: String(item?.summary || item?.evaluate || '').trim(),
    totalCount,
    newEp,
    badge: String(item?.badge || '').trim(),
    styles: Array.isArray(item?.styles) ? item.styles.slice(0, 4) : [],
    seasonId: item?.season_id || 0,
  }
}

async function fetchJson(url, retries = MAX_RETRIES) {
  for (let attempt = 0; attempt < retries; attempt += 1) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
    try {
      const res = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; AueXUE-Bangumi/1.0)',
          Referer: 'https://space.bilibili.com/',
        },
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      if (json?.code !== 0)
        throw new Error(json?.message || `API code ${json?.code}`)
      return json.data
    }
    catch (err) {
      if (attempt === retries - 1) throw err
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
    finally {
      clearTimeout(timer)
    }
  }
  return null
}

async function fetchStatusList(vmid, followStatus) {
  const first = await fetchJson(
    `${API_BASE}?playform=web&type=1&follow_status=${followStatus}&vmid=${vmid}&ps=1&pn=1`,
  )
  const total = Number(first?.total || 0)
  if (!total) return []

  const pages = Math.ceil(total / PAGE_SIZE)
  const items = []

  for (let pn = 1; pn <= pages; pn += 1) {
    const data = await fetchJson(
      `${API_BASE}?playform=web&type=1&follow_status=${followStatus}&vmid=${vmid}&ps=${PAGE_SIZE}&pn=${pn}`,
    )
    for (const item of data?.list || []) {
      const normalized = normalizeItem(item)
      if (normalized.title) items.push(normalized)
    }
  }

  return items
}

async function buildBangumiData(vmid) {
  const result = { wantWatch: [], watching: [], watched: [] }

  for (const { status, key } of STATUS_KEYS) {
    try {
      result[key] = await fetchStatusList(vmid, status)
      console.log(`[bangumi] ${key}: ${result[key].length} item(s)`)
    }
    catch (err) {
      console.warn(`[bangumi] 跳过 status ${status}:`, err.message || err)
      result[key] = []
    }
  }

  return {
    updatedAt: new Date().toISOString(),
    vmid,
    ...result,
  }
}

function writeOutput(payload) {
  mkdirSync(dirname(OUTPUT), { recursive: true })
  writeFileSync(OUTPUT, `${JSON.stringify(payload, null, 2)}\n`, 'utf8')
}

const gen = loadGeneratedSiteSettings()
const bangumi = gen.bangumi || {}
const enabled = bangumi.enable === true
const vmid = String(bangumi.vmid || '').trim()

if (!enabled || !vmid) {
  writeOutput({
    updatedAt: new Date().toISOString(),
    vmid,
    enabled: false,
    quote: String(bangumi.quote || '').trim(),
    wantWatch: [],
    watching: [],
    watched: [],
  })
  console.log('[bangumi] 未启用或未配置 uid，已写入空数据')
  process.exit(0)
}

const data = await buildBangumiData(vmid)
writeOutput({ ...data, enabled: true, quote: String(bangumi.quote || '').trim() })
const total = data.wantWatch.length + data.watching.length + data.watched.length
console.log(`[bangumi] 已写入 ${total} 部 -> public/data/bangumi.json`)
