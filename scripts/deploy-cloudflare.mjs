#!/usr/bin/env node
/**
 * 部署到 Cloudflare Workers（本地一条命令，或 Workers Builds 自动执行）
 *
 * 流程：解析/创建 D1 R2 绑定 → 应用 migrations 建表 → 导入 content/ → 构建前端 → 部署
 *
 * 用法:
 *   npm run cf:deploy                 全流程
 *   npm run cf:deploy -- --dry-run    只打印计划
 *   npm run cf:deploy -- --skip-import    内容未变时跳过导入
 *   npm run cf:deploy -- --skip-build     复用已有 dist
 *   npm run cf:deploy -- --deploy-only    仅部署（build:cf 阶段已构建并导入过）
 */

import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { importContent } from './lib/content-import.mjs'
import {
  applyMigrations,
  d1RowExists,
  ensureCloudflareBindings,
  r2ObjectExists,
  resolveProjectConfig,
  runWrangler,
  WranglerError,
} from './lib/wrangler-cli.mjs'

const root = process.cwd()
const argv = process.argv.slice(2)
const dryRun = argv.includes('--dry-run')
const skipImport = argv.includes('--skip-import')
const skipBuild = argv.includes('--skip-build')
const skipDeploy = argv.includes('--skip-deploy')

/** Workers Builds 环境：CF_PAGES 不再适用，改用 CI + WORKERS_CI 判定 */
const isBuildsCI = Boolean(process.env.WORKERS_CI || process.env.CI)

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

function main() {
  const config = resolveProjectConfig(root)
  const { d1, r2 } = { d1: config.d1, r2: config.r2 }

  log('部署计划:')
  log(`  Worker           ${config.workerName}`)
  log(`  D1 数据库        ${d1.databaseName}`)
  log(`  R2 存储桶        ${r2.bucketName}`)
  log(`  静态资源目录     ${config.assetsDirectory}`)
  log(`  运行环境         ${isBuildsCI ? 'Workers Builds (CI)' : '本地'}`)

  if (dryRun) {
    log('')
    log('[dry-run] 未执行任何操作')
    return
  }

  log('')
  log('[1/5] 确认 D1 与 R2 绑定')
  const binding = ensureCloudflareBindings(root, { log })
  log(`  D1 ${binding.d1.created ? '已创建' : '已复用'}，R2 ${binding.r2.created ? '已创建' : '已复用'}`)

  log('')
  log('[2/5] 应用 D1 表结构')
  applyMigrations(root, { databaseName: d1.databaseName, log })

  if (skipImport) {
    log('')
    log('[3/5] 已跳过内容导入（--skip-import）')
  }
  else {
    log('')
    log('[3/5] 导入 content/ 到 R2 + D1')
    // 默认只补缺失，不覆盖云端已有内容（云端可能已在后台改过）。
    // 需要强制覆盖仓库内容时：--force 或 CONTENT_FORCE_IMPORT=1
    const force = argv.includes('--force') || process.env.CONTENT_FORCE_IMPORT === '1'
    if (force)
      log('  将以仓库内容覆盖云端已有数据')
    const summary = importContent(root, {
      databaseName: d1.databaseName,
      bucketName: r2.bucketName,
      local: false,
      log,
      force,
      exists(target) {
        if (target === 'notice')
          return d1RowExists(root, { databaseName: d1.databaseName, sql: 'SELECT id FROM notice_board WHERE id = 1;' })
        if (target.startsWith('post:'))
          return d1RowExists(root, { databaseName: d1.databaseName, sql: `SELECT slug FROM posts WHERE slug = '${target.slice(5).replace(/'/g, "''")}';` })
        return r2ObjectExists(root, { bucketName: r2.bucketName, r2Key: target })
      },
    })
    log(`  文章 ${summary.posts} 篇 / 相册 ${summary.albums} 个专辑`)
  }

  if (skipBuild) {
    log('')
    log('[4/5] 已跳过构建（--skip-build）')
    if (!existsSync(join(root, config.assetsDirectory, 'index.html')))
      throw new WranglerError(`${config.assetsDirectory}/ 下没有构建产物，请先执行 npm run build`)
  }
  else {
    log('')
    log('[4/5] 读取站点设置并构建站点')
    runNode(['scripts/fetch-site-settings.mjs'])
    runNpm(['run', 'build'])
  }

  if (skipDeploy) {
    log('')
    log('[5/5] 已跳过部署（--skip-deploy）')
    return
  }

  log('')
  log('[5/5] 部署 Worker')
  runWrangler(['deploy'], { cwd: root })

  log('')
  log('部署完成')
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
