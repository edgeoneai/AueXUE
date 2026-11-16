/**
 * 本地 content/ 内容 → Cloudflare（R2 + D1）的统一导入实现
 *
 * 支持五类内容：文章、友链、关于页、相册、公告栏。
 * 所有写入都是幂等的（R2 put 覆盖、D1 upsert），可重复执行。
 */

import { existsSync, readdirSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs'
import { basename, join } from 'node:path'
import { tmpdir } from 'node:os'
import {
  executeSqlFile,
  putR2Object,
} from './wrangler-cli.mjs'

export const CATEGORIES = ['posts', 'links', 'about', 'gallery', 'notice']

const MARKDOWN_CONTENT_TYPE = 'text/markdown; charset=utf-8'

// ---------------------------------------------------------------- 解析工具

const FRONTMATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/

function unquote(value) {
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith('\'') && value.endsWith('\'')))
    return value.slice(1, -1)
  return value
}

function parseScalar(value) {
  const unquoted = unquote(value)
  if (unquoted === 'true')
    return true
  if (unquoted === 'false')
    return false
  if (/^-?\d+$/.test(unquoted))
    return Number(unquoted)
  return unquoted
}

/** 与 server/posts/frontmatter.ts 的 splitMarkdown 保持同一解析口径 */
export function splitMarkdown(source) {
  const match = String(source).match(FRONTMATTER_RE)
  if (!match)
    return { frontmatter: {}, content: source }

  const frontmatter = {}
  let currentKey = null
  let listItems = null

  const flushList = () => {
    if (currentKey && listItems)
      frontmatter[currentKey] = listItems
    listItems = null
  }

  for (const rawLine of match[1].split(/\r?\n/)) {
    const line = rawLine.trimEnd()
    if (!line.trim() || line.trim().startsWith('#'))
      continue

    const listMatch = line.match(/^\s*-\s+(.+)$/)
    if (listMatch && listItems) {
      listItems.push(unquote(listMatch[1].trim()))
      continue
    }

    flushList()

    const kvMatch = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/)
    if (!kvMatch)
      continue

    currentKey = kvMatch[1]
    const value = kvMatch[2].trim()
    if (!value) {
      listItems = []
      continue
    }
    frontmatter[currentKey] = parseScalar(value)
  }

  flushList()
  return { frontmatter, content: match[2] }
}

export function stripMarkdown(content) {
  return String(content)
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]+`/g, ' ')
    .replace(/!\[[^\]]*]\([^)]+\)/g, ' ')
    .replace(/\[[^\]]*]\([^)]+\)/g, ' ')
    .replace(/[#>*_~\-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function normalizeTags(tags) {
  if (!tags)
    return undefined
  if (Array.isArray(tags))
    return tags.map(String)
  return [String(tags)]
}

function categoryPathFrom(categories) {
  if (!categories)
    return 'Uncategorized'
  if (typeof categories === 'string')
    return categories.trim() || 'Uncategorized'
  const parts = categories.map(String).filter(Boolean)
  return parts.length ? parts.join('/') : 'Uncategorized'
}

function isPublished(fm) {
  return !(fm.draft === true || fm.hidden === true)
}

function normalizePinOrder(value) {
  if (value === undefined || value === null || value === '')
    return 0
  if (value === false)
    return 0
  if (value === true)
    return 1
  const n = Number(value)
  if (!Number.isFinite(n) || n <= 0)
    return 0
  return Math.floor(n)
}

function sqlEscape(value) {
  return String(value).replace(/'/g, '\'\'')
}

function sqlValue(value) {
  if (value === null || value === undefined)
    return 'NULL'
  return `'${sqlEscape(value)}'`
}

// ---------------------------------------------------------------- 数据源定位

export function resolvePostsDir(root) {
  const contentDir = join(root, 'content', 'posts')
  if (existsSync(contentDir))
    return contentDir
  const pagesDir = join(root, 'pages', 'posts')
  return existsSync(pagesDir) ? pagesDir : null
}

function resolveFirstExisting(root, candidates) {
  return candidates.map(path => join(root, path)).find(path => existsSync(path)) || null
}

export function resolveContentSources(root) {
  return {
    postsDir: resolvePostsDir(root),
    linksPath: resolveFirstExisting(root, ['content/links/index.md', 'pages/links/index.md']),
    aboutPath: resolveFirstExisting(root, ['content/about/index.md', 'pages/about/index.md']),
    galleryRoot: (() => {
      const contentRoot = join(root, 'content', 'gallery')
      if (existsSync(join(contentRoot, 'index.md')))
        return contentRoot
      const pagesRoot = join(root, 'pages', 'gallery')
      if (existsSync(join(pagesRoot, 'index.md')))
        return pagesRoot
      return null
    })(),
    noticePath: existsSync(join(root, 'content', 'notice.json'))
      ? join(root, 'content', 'notice.json')
      : null,
  }
}

// ---------------------------------------------------------------- 导入实现

function runSql(root, options, sql) {
  const file = join(tmpdir(), `aiovtue-import-${process.pid}-${Date.now()}.sql`)
  writeFileSync(file, sql, 'utf8')
  try {
    executeSqlFile(root, { databaseName: options.databaseName, file, local: options.local })
  }
  finally {
    try {
      unlinkSync(file)
    }
    catch {}
  }
}

function importPosts(root, options) {
  const { log, sources } = options
  const postsDir = sources.postsDir
  if (!postsDir) {
    log('未找到文章目录，跳过文章导入')
    return { posts: 0 }
  }

  const files = readdirSync(postsDir).filter(name => name.endsWith('.md')).sort()
  if (!files.length) {
    log('没有可导入的 Markdown 文章，跳过')
    return { posts: 0 }
  }

  let imported = 0

  for (const file of files) {
    const slug = basename(file, '.md')
    const sourcePath = join(postsDir, file)
    const source = readFileSync(sourcePath, 'utf8')
    const { frontmatter: fm, content } = splitMarkdown(source)
    const r2Key = `posts/${slug}.md`

    // 云端已有同 slug 的文章时默认跳过：仓库里的是种子文章，
    // 覆盖会冲掉后台编辑过的正文与元信息。
    if (!options.force && options.exists && options.exists(`post:${slug}`)) {
      log(`已存在，跳过文章 ${slug}（需要覆盖请加 --force）`)
      continue
    }

    // 先校验再写盘：与 server/posts/service.ts 的 upsertPost 同一口径。
    // 若缺 title/date 用默认值兜底，导入结果会随执行日期漂移，破坏幂等。
    if (fm.title === undefined || fm.date === undefined)
      throw new Error(`${file} 的 frontmatter 缺少 title 或 date，后台发布同样会拒绝该文章，请先补齐再导入`)

    putR2Object(root, {
      bucketName: options.bucketName,
      r2Key,
      file: sourcePath,
      local: options.local,
      contentType: MARKDOWN_CONTENT_TYPE,
    })

    const title = fm.title
    const date = fm.date
    // `lastmod` 是 Valaxy / Hexo 约定俗成的最后修改字段，与 `updated` 等价。
    // 只认 updated 会让这类文章的数据库 updated 落成 NULL，列表卡片就显示 Invalid Date。
    const updated = fm.updated ?? fm.lastmod
    const tags = normalizeTags(fm.tags)
    const categoryPath = categoryPathFrom(fm.categories)
    const tagList = tags || []

    const sql = `
      INSERT INTO posts (
        slug, title, excerpt, description, date, updated, categories, tags, cover, pin_order, published, r2_key, updated_at
      ) VALUES (
        ${sqlValue(slug)},
        ${sqlValue(String(title))},
        ${sqlValue(fm.excerpt !== undefined ? String(fm.excerpt) : null)},
        ${sqlValue(fm.description !== undefined ? String(fm.description) : null)},
        ${sqlValue(String(date))},
        ${sqlValue(updated !== undefined && updated !== null && String(updated).trim() !== '' ? String(updated) : null)},
        ${sqlValue(fm.categories ? JSON.stringify(fm.categories) : null)},
        ${sqlValue(tags ? JSON.stringify(tags) : null)},
        ${sqlValue(fm.cover !== undefined ? String(fm.cover) : null)},
        ${normalizePinOrder(fm.pin_order ?? fm.top)},
        ${isPublished(fm) ? 1 : 0},
        ${sqlValue(r2Key)},
        datetime('now')
      )
      ON CONFLICT(slug) DO UPDATE SET
        title = excluded.title,
        excerpt = excluded.excerpt,
        description = excluded.description,
        date = excluded.date,
        updated = excluded.updated,
        categories = excluded.categories,
        tags = excluded.tags,
        cover = excluded.cover,
        pin_order = excluded.pin_order,
        published = excluded.published,
        r2_key = excluded.r2_key,
        updated_at = datetime('now');

      DELETE FROM posts_fts WHERE slug = ${sqlValue(slug)};
      INSERT INTO posts_fts (slug, title, excerpt, content) VALUES (
        ${sqlValue(slug)},
        ${sqlValue(String(title))},
        ${sqlValue(fm.excerpt !== undefined ? String(fm.excerpt) : '')},
        ${sqlValue(stripMarkdown(content))}
      );

      DELETE FROM post_categories WHERE post_slug = ${sqlValue(slug)};
      DELETE FROM post_tags WHERE post_slug = ${sqlValue(slug)};
      INSERT INTO post_categories (post_slug, category_path) VALUES (${sqlValue(slug)}, ${sqlValue(categoryPath)});
      ${tagList.map(tag => `INSERT INTO post_tags (post_slug, tag) VALUES (${sqlValue(slug)}, ${sqlValue(String(tag))});`).join('\n      ')}
    `

    runSql(root, options, sql)
    log(`已导入文章: ${slug}`)
    imported += 1
  }

  return { posts: imported }
}

/**
 * 上传单个 Markdown 到 R2。
 *
 * 默认不覆盖云端已有对象——云端版本可能已在后台改过，
 * 用仓库里的模板覆盖会把这些修改冲掉。只有 force 时才覆盖。
 */
function importSingleMarkdown(root, options, localPath, r2Key) {
  const { log } = options
  if (!localPath) {
    log(`未找到 ${r2Key} 的源文件，跳过`)
    return false
  }

  if (!options.force && options.exists && options.exists(r2Key)) {
    log(`已存在，跳过 ${r2Key}（需要覆盖请加 --force）`)
    return true
  }

  putR2Object(root, {
    bucketName: options.bucketName,
    r2Key,
    file: localPath,
    local: options.local,
    contentType: MARKDOWN_CONTENT_TYPE,
  })
  log(`已导入 ${r2Key}`)
  return true
}

function importGallery(root, options) {
  const { log, sources } = options
  const galleryRoot = sources.galleryRoot
  if (!galleryRoot) {
    log('未找到相册源目录，跳过相册导入')
    return { albums: 0 }
  }

  const hubPath = join(galleryRoot, 'index.md')
  let albums = 0

  importSingleMarkdown(root, options, hubPath, 'gallery/index.md')

  for (const entry of readdirSync(galleryRoot, { withFileTypes: true })) {
    if (!entry.isDirectory())
      continue
    const albumPath = join(galleryRoot, entry.name, 'index.md')
    if (!existsSync(albumPath))
      continue
    if (importSingleMarkdown(root, options, albumPath, `gallery/${entry.name}/index.md`))
      albums += 1
  }

  return { albums }
}

function importNotice(root, options) {
  const { log, sources } = options
  const noticePath = sources.noticePath
  if (!noticePath) {
    log('未找到 content/notice.json，跳过公告栏导入')
    return { notice: false }
  }

  let parsed
  try {
    parsed = JSON.parse(readFileSync(noticePath, 'utf8'))
  }
  catch {
    throw new Error('content/notice.json 不是合法 JSON')
  }

  if (!options.force && options.exists && options.exists('notice')) {
    log('公告栏已存在，跳过（需要覆盖请加 --force）')
    return { notice: true }
  }

  const title = String(parsed?.title || '公告栏').trim() || '公告栏'
  const sections = Array.isArray(parsed?.sections) ? parsed.sections : []
  const sectionsJson = JSON.stringify(sections)

  const sql = `INSERT INTO notice_board (id, title, sections_json, updated_at)
VALUES (1, ${sqlValue(title)}, ${sqlValue(sectionsJson)}, datetime('now'))
ON CONFLICT(id) DO UPDATE SET
  title = excluded.title,
  sections_json = excluded.sections_json,
  updated_at = datetime('now');`

  runSql(root, options, sql)
  log('已导入公告栏')
  return { notice: true }
}

/**
 * 按需导入 content/ 下的内容
 * @param {string} root 项目根目录
 * @param {object} options { databaseName, bucketName, local, categories, log }
 */
export function importContent(root, options) {
  const {
    databaseName,
    bucketName,
    local = false,
    categories = CATEGORIES,
    log = () => {},
    force = false,
    exists,
  } = options
  if (!databaseName)
    throw new Error('importContent 需要 databaseName')
  if (!bucketName)
    throw new Error('importContent 需要 bucketName')

  const sources = resolveContentSources(root)
  const ctx = { databaseName, bucketName, local, log, sources, force, exists }
  const summary = { posts: 0, links: false, about: false, albums: 0, notice: false }

  if (categories.includes('posts'))
    summary.posts = importPosts(root, ctx).posts

  if (categories.includes('links'))
    summary.links = importSingleMarkdown(root, ctx, sources.linksPath, 'links/index.md')

  if (categories.includes('about'))
    summary.about = importSingleMarkdown(root, ctx, sources.aboutPath, 'about/index.md')

  if (categories.includes('gallery'))
    summary.albums = importGallery(root, ctx).albums

  if (categories.includes('notice'))
    summary.notice = importNotice(root, ctx).notice

  return summary
}
