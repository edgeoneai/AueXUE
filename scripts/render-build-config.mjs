#!/usr/bin/env node
/**
 * 用 worker/wrangler.toml.template 渲染出部署专用配置 wrangler.build.toml
 *
 * 调用方式（由 deploy-cloudflare.mjs 自动调用）：
 *   node scripts/render-build-config.mjs <D1_DATABASE_ID> [ACCOUNT_ID]
 *
 * 渲染结果含有账号专属 ID，已加入 .gitignore，不要提交。
 */

import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { resolveProjectConfig, writeFileIfChanged } from './lib/wrangler-cli.mjs'

const root = process.cwd()
const d1Id = process.argv[2]
if (!d1Id) {
  console.error('用法: node scripts/render-build-config.mjs <D1_DATABASE_ID> [ACCOUNT_ID]')
  process.exit(1)
}

const config = resolveProjectConfig(root)
const templatePath = join(root, 'worker', 'wrangler.toml.template')
const template = readFileSync(templatePath, 'utf8')

const rendered = template
  .replaceAll('__WORKER_NAME__', config.workerName)
  .replaceAll('__D1_DATABASE_NAME__', config.d1.databaseName)
  .replaceAll('__D1_DATABASE_ID__', d1Id)
  .replaceAll('__R2_BUCKET_NAME__', config.r2.bucketName)
  .replaceAll('__SITE_URL__', process.env.SITE_URL || 'https://live.yybb.us')

const outPath = join(root, 'wrangler.build.toml')
writeFileIfChanged(outPath, rendered)
console.log('已生成 wrangler.build.toml')
