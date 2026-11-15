#!/usr/bin/env node
/**
 * Workers Builds 的 Deploy command 入口
 *
 * 只做部署：复用 build 阶段产出的 dist/ 与 wrangler.build.toml，
 * 避免在 Deploy 阶段重复建表与导入。
 *
 * 也可本地运行：npm run cf:deploy:only
 */

import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { resolveProjectConfig, runWrangler, WranglerError } from './lib/wrangler-cli.mjs'

const root = process.cwd()
const buildConfig = join(root, 'wrangler.build.toml')

try {
  const config = resolveProjectConfig(root)

  if (!existsSync(buildConfig)) {
    throw new WranglerError(
      '未找到 wrangler.build.toml，请先执行 Build 阶段（npm run cf:build）',
    )
  }

  const outputDir = join(root, config.assetsDirectory)
  if (!existsSync(join(outputDir, 'index.html')))
    throw new WranglerError(`${config.assetsDirectory}/ 下没有构建产物，请先执行 npm run build`)

  console.log('部署 Worker（使用 wrangler.build.toml）')
  runWrangler(['deploy', '--config', 'wrangler.build.toml'], { cwd: root })
  console.log('部署完成')
}
catch (error) {
  console.error(`\n[失败] ${error.message}`)
  if (error instanceof WranglerError && error.detail)
    console.error(error.detail)
  process.exit(1)
}
