#!/usr/bin/env node
/**
 * 把 content/ 下的内容导入 Cloudflare（R2 + D1）
 *
 * 用法:
 *   npm run content:import                     # 导入到云端
 *   npm run content:import -- --local          # 导入到本地 .wrangler 预览环境
 *   npm run content:import -- --only posts,links
 *   npm run content:import -- --skip-migrations  # 表结构已就绪时跳过建表
 *
 * 会先自动应用 migrations（建表），再逐项导入；全部幂等，可反复执行。
 */

import { CATEGORIES, importContent } from './lib/content-import.mjs'
import {
  applyMigrations,
  ensureCloudflareBindings,
  resolveProjectConfig,
  WranglerError,
} from './lib/wrangler-cli.mjs'

const root = process.cwd()
const argv = process.argv.slice(2)
const local = argv.includes('--local')
const skipMigrations = argv.includes('--skip-migrations')

function readOption(name) {
  const index = argv.indexOf(name)
  return index === -1 ? undefined : argv[index + 1]
}

function log(message) {
  console.log(message)
}

function parseCategories(raw) {
  if (!raw)
    return CATEGORIES
  const requested = raw.split(',').map(item => item.trim()).filter(Boolean)
  const unknown = requested.filter(item => !CATEGORIES.includes(item))
  if (unknown.length)
    throw new Error(`未知的内容类型: ${unknown.join(', ')}（可选: ${CATEGORIES.join(', ')}）`)
  return requested
}

async function main() {
  const categories = parseCategories(readOption('--only'))
  const config = resolveProjectConfig(root)
  const databaseName = config.d1.databaseName
  const bucketName = config.r2.bucketName

  log(`目标环境: ${local ? '本地 (.wrangler)' : '云端 Cloudflare'}`)
  log(`D1 数据库: ${databaseName}`)
  log(`R2 存储桶: ${bucketName}`)
  log(`内容类型: ${categories.join(', ')}`)

  if (!local)
    ensureCloudflareBindings(root, { log })

  if (skipMigrations)
    log('已跳过 D1 迁移（--skip-migrations）')
  else
    applyMigrations(root, { databaseName, local, log })

  const summary = importContent(root, { databaseName, bucketName, local, categories, log })

  const describe = (selected, done, skippedText = '未选中') => {
    if (!selected)
      return skippedText
    return done ? '已导入' : '未找到源文件'
  }

  log('')
  log('导入完成:')
  log(`  文章        ${categories.includes('posts') ? `${summary.posts} 篇` : '未选中'}`)
  log(`  友链        ${describe(categories.includes('links'), summary.links)}`)
  log(`  关于页      ${describe(categories.includes('about'), summary.about)}`)
  log(`  相册        ${categories.includes('gallery') ? `${summary.albums} 个专辑` : '未选中'}`)
  log(`  公告栏      ${describe(categories.includes('notice'), summary.notice)}`)
}

main().catch((error) => {
  console.error(`\n[失败] ${error.message}`)
  if (error instanceof WranglerError && error.detail)
    console.error(error.detail)
  process.exit(1)
})
