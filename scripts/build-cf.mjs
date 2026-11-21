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
import { existsSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { importContent } from './lib/content-import.mjs'
import {
  applyMigrations,
  d1RowExists,
  ensureCloudflareBindings,
  r2ObjectExists,
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

  // 默认只补缺失，不覆盖云端已有内容。
  // 云端数据可能在后台改过，用仓库里的种子内容覆盖会造成「设置被重置」。
  const force = process.env.CONTENT_FORCE_IMPORT === '1'
  if (force)
    log('  CONTENT_FORCE_IMPORT=1，将覆盖云端已有内容')

  const summary = importContent(root, {
    databaseName: config.d1.databaseName,
    bucketName: config.r2.bucketName,
    local: false,
    log,
    force,
    exists(target) {
      if (target === 'notice')
        return d1RowExists(root, { databaseName: config.d1.databaseName, sql: 'SELECT id FROM notice_board WHERE id = 1;' })
      if (target.startsWith('post:'))
        return d1RowExists(root, { databaseName: config.d1.databaseName, sql: `SELECT slug FROM posts WHERE slug = '${target.slice(5).replace(/'/g, "''")}';` })
      return r2ObjectExists(root, { bucketName: config.r2.bucketName, r2Key: target })
    },
  })
  log(`  文章 ${summary.posts} 篇 / 相册 ${summary.albums} 个专辑`)

  log('')
  log('[4/4] 读取站点设置并构建前端')
  // 先取出后台「站点设置」，让预渲染 HTML、<title> 与 FOUC 加载屏
  // 都用当前值渲染，而不是仓库配置文件里的默认值
  runNode(['scripts/fetch-site-settings.mjs'])
  // 追番数据：B 站接口有来源校验与限流，构建时拉一次落成静态 JSON，
  // 未启用或拉取失败都只写空数据，绝不阻断构建
  try {
    runNode(['scripts/fetch-bangumi.mjs'])
  }
  catch {
    log('追番数据抓取失败，已跳过（不影响其它内容）')
  }
  runNpm(['run', 'build'])

  // Pages 专用的 _redirects 已不再使用（SPA 回退由 assets.not_found_handling 承担）。
  // Workers 会严格校验该文件并拒绝 200!/无限循环写法，这里兜底清理，避免旧产物混入部署包。
  const staleRedirects = join(root, config.assetsDirectory, '_redirects')
  if (existsSync(staleRedirects)) {
    rmSync(staleRedirects, { force: true })
    log('已移除构建产物中的 _redirects（Pages 专用格式，Workers 不兼容）')
  }

  log('')
  log('Build 阶段完成')
}
catch (error) {
  console.error(`\n[失败] ${error.message}`)
  if (error instanceof WranglerError && error.detail)
    console.error(error.detail)
  process.exit(1)
}
