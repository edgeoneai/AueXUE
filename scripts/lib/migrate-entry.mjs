/**
 * 单个内容类型的导入入口（供 scripts/migrate-*.mjs 薄封装调用）
 *
 * 保持旧命令可用，同时把实现集中到 content-import.mjs。
 */

import { importContent } from './content-import.mjs'
import {
  applyMigrations,
  ensureCloudflareBindings,
  resolveProjectConfig,
  WranglerError,
} from './wrangler-cli.mjs'

const LABELS = {
  posts: '文章',
  links: '友链',
  about: '关于页',
  gallery: '相册',
  notice: '公告栏',
}

export function runSingleCategory(category) {
  const root = process.cwd()
  const local = process.argv.includes('--local')
  const skipMigrations = process.argv.includes('--skip-migrations')

  try {
    const config = resolveProjectConfig(root)
    const databaseName = config.d1.databaseName
    const bucketName = config.r2.bucketName

    console.log(`导入${LABELS[category] || category} (${local ? 'local' : 'remote'})`)

    if (!local)
      ensureCloudflareBindings(root, { log: console.log })

    if (!skipMigrations)
      applyMigrations(root, { databaseName, local, log: console.log })

    const summary = importContent(root, {
      databaseName,
      bucketName,
      local,
      categories: [category],
      log: console.log,
    })

    if (category === 'posts')
      console.log(`\n共导入 ${summary.posts} 篇文章`)
    else
      console.log(`\n${LABELS[category] || category}导入完成`)
  }
  catch (error) {
    console.error(`\n[失败] ${error.message}`)
    if (error instanceof WranglerError && error.detail)
      console.error(error.detail)
    process.exit(1)
  }
}
