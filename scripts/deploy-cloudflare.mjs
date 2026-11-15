#!/usr/bin/env node
/**
 * 一键部署到 Cloudflare Pages：资源 → 建表 → 导入内容 → 构建 → 部署
 *
 * 用法:
 *   npm run cf:deploy               # 全流程
 *   npm run cf:deploy -- --dry-run  # 只打印计划
 *   npm run cf:deploy -- --skip-import   # 内容已是最新，只建表 + 构建 + 部署
 *   npm run cf:deploy -- --skip-build    # 复用已有 dist
 *
 * 前置: npx wrangler login
 */

import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import {
  applyMigrations,
  ensureCloudflareBindings,
  resolveProjectConfig,
  runWrangler,
  WranglerError,
} from './lib/wrangler-cli.mjs'
import { importContent } from './lib/content-import.mjs'

const root = process.cwd()
const argv = process.argv.slice(2)
const dryRun = argv.includes('--dry-run')
const skipImport = argv.includes('--skip-import')
const skipBuild = argv.includes('--skip-build')

function log(message) {
  console.log(message)
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
  const databaseName = config.d1.databaseName
  const bucketName = config.r2.bucketName
  const outputDir = join(root, config.pagesBuildOutputDir)

  log('部署计划:')
  log(`  Pages 项目   ${config.workerName}`)
  log(`  D1 数据库    ${databaseName}`)
  log(`  R2 存储桶    ${bucketName}`)
  log(`  构建产物     ${config.pagesBuildOutputDir}`)
  log(`  步骤         资源准备 → 建表 → 导入内容 → 构建 → 部署`)

  if (dryRun) {
    log('')
    log('[dry-run] 未执行任何操作')
    return
  }

  log('')
  log('[1/5] 准备 D1 与 R2 资源')
  const { d1, r2 } = ensureCloudflareBindings(root, { log })
  if (d1.created || r2.created)
    log('已自动创建缺失的资源')

  log('')
  log('[2/5] 应用 D1 表结构')
  applyMigrations(root, { databaseName, log })

  if (skipImport) {
    log('')
    log('[3/5] 已跳过内容导入（--skip-import）')
  }
  else {
    log('')
    log('[3/5] 导入 content/ 内容到 R2 + D1')
    const summary = importContent(root, { databaseName, bucketName, local: false, log })
    log(`  文章 ${summary.posts} 篇 / 相册 ${summary.albums} 个专辑`)
  }

  if (skipBuild) {
    log('')
    log('[4/5] 已跳过构建（--skip-build）')
    if (!existsSync(join(outputDir, 'index.html')))
      throw new WranglerError(`${config.pagesBuildOutputDir}/ 下没有构建产物，请先执行 npm run build`)
  }
  else {
    log('')
    log('[4/5] 构建站点')
    runNpm(['run', 'build'])
  }

  log('')
  log('[5/5] 部署到 Cloudflare Pages')
  runWrangler([
    'pages',
    'deploy',
    config.pagesBuildOutputDir,
    '--project-name',
    config.workerName,
    '--commit-dirty=true',
  ], { cwd: root })

  log('')
  log(`部署完成: https://${config.workerName}.pages.dev`)
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
