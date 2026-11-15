#!/usr/bin/env node
/**
 * 从 posts 表已有 categories/tags JSON 回填 post_categories / post_tags
 *
 * 用法:
 *   npm run d1:backfill-taxonomy
 *   npm run d1:backfill-taxonomy:local
 *
 * 内容导入本身已写好分类/标签，这个脚本只用于修复历史数据。
 */

import { executeSqlCommand, resolveProjectConfig, runWranglerJson } from './lib/wrangler-cli.mjs'

const root = process.cwd()
const local = process.argv.includes('--local')
const { d1 } = resolveProjectConfig(root)
const databaseName = d1.databaseName

function sqlEscape(value) {
  return String(value).replace(/'/g, '\'\'')
}

function runSql(sql) {
  executeSqlCommand(root, { databaseName, sql, local })
}

function categoryPath(categoriesJson) {
  if (!categoriesJson)
    return 'Uncategorized'
  try {
    const value = JSON.parse(categoriesJson)
    if (typeof value === 'string')
      return value.trim() || 'Uncategorized'
    if (Array.isArray(value)) {
      const parts = value.map(String).filter(Boolean)
      return parts.length ? parts.join('/') : 'Uncategorized'
    }
  }
  catch {}
  return 'Uncategorized'
}

function parseTags(tagsJson) {
  if (!tagsJson)
    return []
  try {
    const value = JSON.parse(tagsJson)
    if (Array.isArray(value))
      return value.map(String)
    return [String(value)]
  }
  catch {
    return []
  }
}

console.log(`[backfill-taxonomy] 开始回填 (${local ? 'local' : 'remote'})`)

runSql('DELETE FROM post_categories; DELETE FROM post_tags;')

const response = runWranglerJson(
  ['d1', 'execute', databaseName, local ? '--local' : '--remote', '--command', 'SELECT slug, categories, tags FROM posts;'],
  { cwd: root },
)
const posts = response?.[0]?.results || []

for (const row of posts) {
  runSql(`INSERT INTO post_categories (post_slug, category_path) VALUES ('${sqlEscape(row.slug)}', '${sqlEscape(categoryPath(row.categories))}');`)
  for (const tag of parseTags(row.tags))
    runSql(`INSERT INTO post_tags (post_slug, tag) VALUES ('${sqlEscape(row.slug)}', '${sqlEscape(tag)}');`)
}

console.log(`[backfill-taxonomy] 完成，处理 ${posts.length} 篇文章`)
