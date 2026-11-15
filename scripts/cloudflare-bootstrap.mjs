#!/usr/bin/env node
/**
 * 自动准备 Cloudflare 资源：D1 数据库 + R2 存储桶
 *
 * 用法:
 *   npm run cf:bootstrap              # 创建/复用 D1 与 R2，并回填 database_id
 *   npm run cf:bootstrap -- --dry-run # 只打印将要做的事
 *
 * 需要先登录：npx wrangler login
 */

import {
  ensureCloudflareBindings,
  resolveProjectConfig,
  WranglerError,
} from './lib/wrangler-cli.mjs'

const root = process.cwd()
const dryRun = process.argv.includes('--dry-run')

function log(message) {
  console.log(message)
}

function main() {
  const config = resolveProjectConfig(root)
  const databaseName = config.d1.databaseName
  const bucketName = config.r2.bucketName

  log(`Pages 项目: ${config.workerName}`)
  log(`D1 数据库:  ${databaseName}`)
  log(`R2 存储桶:  ${bucketName}`)

  if (dryRun) {
    log('')
    log('[dry-run] 将创建/复用上述资源，并把 database_id 回填到 wrangler.toml，不执行任何写操作')
    return
  }

  const { d1, r2 } = ensureCloudflareBindings(root, { log })
  if (d1.created || r2.created)
    log('已自动创建缺失的资源')

  log('')
  log('资源准备完成。下一步:')
  log('  npm run cf:deploy     # 建表 + 导入内容 + 构建 + 部署')
}

try {
  main()
}
catch (error) {
  console.error(`\n[失败] ${error.message}`)
  if (error instanceof WranglerError && error.detail)
    console.error(error.detail)
  process.exit(1)
}
