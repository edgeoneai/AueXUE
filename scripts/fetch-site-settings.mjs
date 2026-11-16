#!/usr/bin/env node
/**
 * 从 D1 读取后台「站点设置」，写入 .site-settings.local.json
 *
 * 供 site.config.ts / valaxy.config.ts 在构建期读取。
 * 这样预渲染出的 HTML、FOUC 加载屏、<title> 等都用的是后台里的当前值，
 * 而不是仓库配置文件里的默认值。
 *
 * 用法:
 *   node scripts/fetch-site-settings.mjs            # 云端
 *   node scripts/fetch-site-settings.mjs --local    # 本地 .wrangler
 */

import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { resolveProjectConfig, runWranglerJson, WranglerError } from './lib/wrangler-cli.mjs'

const root = process.cwd()
const local = process.argv.includes('--local')
const outPath = join(root, '.site-settings.local.json')

function write(payload) {
  writeFileSync(outPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8')
}

try {
  const config = resolveProjectConfig(root)
  const databaseName = config.d1.databaseName

  const response = runWranglerJson([
    'd1', 'execute', databaseName,
    local ? '--local' : '--remote',
    '--command', 'SELECT payload_json FROM site_settings WHERE id = 1;',
  ], { cwd: root })

  const rows = response?.[0]?.results || []
  const raw = rows[0]?.payload_json

  if (!raw) {
    // 后台还没保存过：写空对象，让配置文件用自身默认值
    write({})
    console.log('站点设置: 表中暂无记录，构建将使用配置文件默认值')
    process.exit(0)
  }

  const parsed = JSON.parse(raw)
  write(parsed)
  console.log(`站点设置: 已读取后台配置（${Object.keys(parsed).length} 个字段）`)
}
catch (error) {
  // 取不到不应阻断构建：退回配置文件默认值，但要说清原因
  write({})
  const reason = error instanceof WranglerError ? error.message : String(error?.message || error)
  console.warn(`站点设置: 读取失败，构建将使用配置文件默认值。原因: ${reason}`)
}
