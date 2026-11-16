#!/usr/bin/env node
/**
 * 本地完整预览：构建前端 + 本地 D1/R2 导入 + wrangler dev
 *
 * 用法: npm run dev:cf
 * 访问: http://localhost:8788
 *
 * 仅重建前端、不导入内容: npm run dev:cf:lite
 */
import { copyFileSync, existsSync } from 'node:fs'
import { spawn, spawnSync } from 'node:child_process'
import { join } from 'node:path'

const root = process.cwd()
const devVars = join(root, '.dev.vars')
const devVarsExample = join(root, '.dev.vars.example')
const lite = process.argv.includes('--lite')

if (!existsSync(devVars) && existsSync(devVarsExample)) {
  copyFileSync(devVarsExample, devVars)
  console.log('已从 .dev.vars.example 创建 .dev.vars（可按需修改）\n')
}

function run(cmd, args, opts = {}) {
  const result = spawnSync(cmd, args, {
    cwd: root,
    stdio: 'inherit',
    shell: true,
    ...opts,
  })
  if (result.status !== 0)
    process.exit(result.status || 1)
}

if (lite) {
  console.log('1/2 构建 SPA...')
  run('node', ['scripts/fetch-site-settings.mjs', '--local'])
  run('npm', ['run', 'build'])
  console.log('\n2/2 启动 wrangler dev（跳过内容导入）...\n')
}
else {
  console.log('1/3 读取站点设置并构建 SPA...')
  run('node', ['scripts/fetch-site-settings.mjs', '--local'])
  run('npm', ['run', 'build'])

  console.log('\n2/3 建表并导入 content/ 到本地 R2 + D1...')
  run('node', ['scripts/import-content.mjs', '--local'])

  console.log('\n3/3 启动 wrangler dev...\n')
}

console.log('  首页:     http://localhost:8788')
console.log('  文章 API: http://localhost:8788/api/posts')
console.log('  友链 API: http://localhost:8788/api/links')
console.log('  关于 API: http://localhost:8788/api/about')
console.log('  相册 API: http://localhost:8788/api/gallery')
console.log('  后台:     http://localhost:8788/admin\n')

const child = spawn('npx', ['wrangler', 'dev', '--port', '8788'], {
  cwd: root,
  stdio: 'inherit',
  shell: true,
})

child.on('exit', code => process.exit(code ?? 0))
