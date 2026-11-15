#!/usr/bin/env node
/**
 * 应用 D1 表结构迁移
 *
 * 用法:
 *   npm run d1:migrate        # 云端
 *   npm run d1:migrate:local  # 本地 .wrangler
 *
 * 数据库名取自 wrangler.toml 的 database_name，改名后无需再改脚本。
 */

import { applyMigrations, resolveProjectConfig, WranglerError } from './lib/wrangler-cli.mjs'

try {
  const local = process.argv.includes('--local')
  const config = resolveProjectConfig(process.cwd())
  applyMigrations(process.cwd(), {
    databaseName: config.d1.databaseName,
    local,
    log: console.log,
  })
  console.log('D1 表结构已是最新')
}
catch (error) {
  console.error(`\n[失败] ${error.message}`)
  if (error instanceof WranglerError && error.detail)
    console.error(error.detail)
  process.exit(1)
}
