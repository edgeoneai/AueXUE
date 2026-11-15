#!/usr/bin/env node
/**
 * Workers Builds 的 Build command 入口
 *
 * 在 Cloudflare 构建环境里做三件事：
 *   1. 解析 D1/R2 绑定并渲染 wrangler.build.toml（含 database_id）
 *   2. 应用 migrations 建表，并把 content/ 导入 R2 + D1
 *   3. 构建前端静态产物
 *
 * 这样网页部署（push 触发）就自动完成了建表与内容导入，无需本地人工介入。
 *
 * 也可本地运行：npm run cf:build
 */

import { spawnSync } from 'node:child_process'
import { importContent } from './lib/content-import.mjs'
import {
  applyMigrations,
  ensureCloudflareBindings,
  resolveProjectConfig,
  WranglerError,
} from './lib/wrangler-cli.mjs'

const root = process.cwd()

function log(message) {
  console.log(message)
}

function runNode(args) {
  const result = spawnSync(process.execPath, args, { cwd: root, stdio: 'inherit' })
  if (result.error)
    throw new WranglerError(`执行 node ${args.join(' ')} 失败: ${result.error.message}`)
  if (result.status !== 0)
    throw new WranglerError(`node ${args.join(' ')} 退出码 ${result.status}`)
}

function runNpm(args) {
  const result = spawnSync('npm', args, {
    cwd: root,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  })
  if (result.error)
    throw new WranglerError(`执行 npm ${args.join(' ')} 失败: ${result.error.message}`)
  if (result.status !== 0)
    throw new WranglerError(`npm ${args.join(' ')} 退出码 ${result.status}`)
}

try {
  const config = resolveProjectConfig(root)

  log('[1/4] 确认 D1 与 R2 绑定')
  const binding = ensureCloudflareBindings(root, { log })

  log('')
  log('[2/4] 生成部署专用配置 wrangler.build.toml')
  runNode(['scripts/render-build-config.mjs', binding.d1.databaseId])

  log('')
  log('[3/4] 建表并导入 content/')
  applyMigrations(root, { databaseName: config.d1.databaseName, log })
  const summary = importContent(root, {
    databaseName: config.d1.databaseName,
    bucketName: config.r2.bucketName,
    local: false,
    log,
  })
  log(`  文章 ${summary.posts} 篇 / 相册 ${summary.albums} 个专辑`)

  log('')
  log('[4/4] 构建前端')
  runNpm(['run', 'build'])

  log('')
  log('Build 阶段完成')
}
catch (error) {
  console.error(`\n[失败] ${error.message}`)
  if (error instanceof WranglerError && error.detail)
    console.error(error.detail)
  process.exit(1)
}
