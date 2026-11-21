#!/usr/bin/env node
/**
 * Workers Builds 的 Deploy command 入口
 *
 * 只做部署：复用 build 阶段产出的 dist/ 与 wrangler.build.toml，
 * 避免在 Deploy 阶段重复建表与导入。
 *
 * 也可本地运行：npm run cf:deploy:only
 */

import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import {
  ensureCloudflareBindings,
  resolveProjectConfig,
  runWrangler,
  WranglerError,
} from './lib/wrangler-cli.mjs'

const root = process.cwd()
const buildConfig = join(root, 'wrangler.build.toml')

try {
  const config = resolveProjectConfig(root)

  // wrangler.build.toml 是生成文件（已被 .gitignore 忽略）。
  // 若这一步拿不到 Build 阶段的产物，就按当前绑定重新渲染一份，避免整个部署卡死。
  if (!existsSync(buildConfig)) {
    console.log('未找到 wrangler.build.toml，按当前绑定重新生成…')
    const binding = ensureCloudflareBindings(root, { log: message => console.log(message) })
    const render = spawnSync(
      process.execPath,
      ['scripts/render-build-config.mjs', binding.d1.databaseId],
      { cwd: root, stdio: 'inherit' },
    )
    if (render.error)
      throw new WranglerError(`生成 wrangler.build.toml 失败: ${render.error.message}`)
    if (render.status !== 0)
      throw new WranglerError(`生成 wrangler.build.toml 退出码 ${render.status}`)
  }

  const outputDir = join(root, config.assetsDirectory)

  // Deploy 阶段可能拿不到 Build 阶段的产物（CI 只缓存了部分目录），
  // 这里做一次自愈：缺 index.html 就补跑前端构建，而不是直接失败。
  if (!existsSync(join(outputDir, 'index.html'))) {
    console.log(`${config.assetsDirectory}/index.html 缺失，先补跑前端构建…`)
    const build = spawnSync('npm', ['run', 'build'], {
      cwd: root,
      stdio: 'inherit',
      shell: process.platform === 'win32',
    })
    if (build.error)
      throw new WranglerError(`补跑构建失败: ${build.error.message}`)
    if (build.status !== 0)
      throw new WranglerError(`补跑构建退出码 ${build.status}`)
    if (!existsSync(join(outputDir, 'index.html')))
      throw new WranglerError(`${config.assetsDirectory}/index.html 仍未生成，构建未产出可用静态文件`)
  }

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
