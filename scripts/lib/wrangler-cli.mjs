/**
 * wrangler 调用的统一入口
 *
 * 负责：读取 wrangler.toml、跨平台执行 wrangler、自动创建 D1/R2、
 * 回填 database_id、应用 migrations。
 * 只依赖 Node 内置模块，无需额外安装依赖。
 */

import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

export class WranglerError extends Error {
  constructor(message, detail = '') {
    super(message)
    this.name = 'WranglerError'
    this.detail = detail
  }
}

const DEFAULT_D1_NAME = 'aiovtue-blog'
const DEFAULT_R2_NAME = 'aiovtue-blog'
const DEFAULT_BINDING_DB = 'DB'
const DEFAULT_BINDING_BUCKET = 'BUCKET'

function stripComment(line) {
  let inString = false
  let quote = ''
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index]
    if (inString) {
      if (char === quote && line[index - 1] !== '\\')
        inString = false
      continue
    }
    if (char === '"' || char === '\'') {
      inString = true
      quote = char
      continue
    }
    if (char === '#')
      return line.slice(0, index)
  }
  return line
}

function splitSections(text) {
  const sections = new Map()
  let current = ''
  sections.set('', [])
  for (const rawLine of text.split(/\r?\n/)) {
    const trimmed = stripComment(rawLine).trim()
    const header = trimmed.match(/^\[\[?\s*([^\]]+?)\s*\]\]?$/)
    if (header) {
      current = header[1]
      if (!sections.has(current))
        sections.set(current, [])
      continue
    }
    sections.get(current).push(rawLine)
  }
  return sections
}

function readKey(lines, key) {
  for (const rawLine of lines) {
    const match = stripComment(rawLine).match(new RegExp(`^\\s*${key}\\s*=\\s*(.+)$`))
    if (!match)
      continue
    const value = match[1].trim()
    const quoted = value.match(/^["'](.*)["']$/)
    return quoted ? quoted[1] : value
  }
  return undefined
}

/** 判断 wrangler.toml 里是否已声明某个 TOML 段（[[d1_databases]] 等） */
export function hasSection(text, section) {
  return splitSections(text).has(section)
}

export function parseWranglerConfig(text) {
  const sections = splitSections(text)
  const root = sections.get('') || []
  const d1 = sections.get('d1_databases') || []
  const r2 = sections.get('r2_buckets') || []

  return {
    workerName: readKey(root, 'name'),

    compatibilityDate: readKey(root, 'compatibility_date'),
    d1: {
      binding: readKey(d1, 'binding') || DEFAULT_BINDING_DB,
      databaseName: readKey(d1, 'database_name') || DEFAULT_D1_NAME,
      databaseId: readKey(d1, 'database_id') || '',
    },
    r2: {
      binding: readKey(r2, 'binding') || DEFAULT_BINDING_BUCKET,
      bucketName: readKey(r2, 'bucket_name') || DEFAULT_R2_NAME,
    },
    assets: {
      directory: readKey(sections.get('assets') || [], 'directory')?.replace(/^\.\//, '') || 'dist',
      binding: readKey(sections.get('assets') || [], 'binding') || 'ASSETS',
    },
    main: readKey(root, 'main'),
  }
}

export function resolveProjectConfig(root) {
  const configPath = join(root, 'wrangler.toml')
  if (!existsSync(configPath))
    throw new WranglerError(`未找到 wrangler.toml: ${configPath}`)

  const text = readFileSync(configPath, 'utf8')
  const config = parseWranglerConfig(text)

  const workerName = process.env.WORKER_NAME || process.env.PAGES_PROJECT_NAME || config.workerName
  if (!workerName)
    throw new WranglerError('wrangler.toml 缺少 name 字段，无法确定 Worker 名')

  return {
    configPath,
    text,
    assetsDirectory: process.env.ASSETS_DIRECTORY || config.assets.directory,
    mainEntry: config.main,
    workerName,
    d1: {
      binding: config.d1.binding,
      databaseName: process.env.D1_DATABASE_NAME || config.d1.databaseName,
      databaseId: process.env.D1_DATABASE_ID || config.d1.databaseId,
    },
    r2: {
      binding: config.r2.binding,
      bucketName: process.env.R2_BUCKET_NAME || config.r2.bucketName,
    },
  }
}

/** 只有 database_id 明显是占位符或为空时才需要回填 */
export function isPlaceholderDatabaseId(value) {
  if (!value)
    return true
  if (/^0{8}-0{4}-0{4}-0{4}-0{12}$/i.test(value))
    return true
  return /[^\x20-\x7e]/.test(value)
}

/**
 * 把 database_id 回填进 wrangler.toml 的 [[d1_databases]] 段，
 * 保留其余各段（含注释、空行）原样不变。
 */
export function patchDatabaseId(text, databaseId) {
  const lines = text.split(/\r?\n/)
  const output = []
  let section = ''
  let buffer = []

  const flush = () => {
    if (section === 'd1_databases') {
      let patched = false
      const next = buffer.map((rawLine) => {
        const match = rawLine.match(/^(\s*database_id\s*=\s*)(.+)$/)
        if (!match || patched)
          return rawLine
        patched = true
        return `${match[1]}"${databaseId}"`
      })

      if (!patched) {
        const bindingIndex = next.findIndex(line => /^\s*binding\s*=/.test(line))
        const insertAt = bindingIndex >= 0 ? bindingIndex + 1 : next.length
        next.splice(insertAt, 0, `database_id = "${databaseId}"`)
      }

      output.push(...next)
    }
    else {
      output.push(...buffer)
    }
    buffer = []
  }

  for (const rawLine of lines) {
    const trimmed = stripComment(rawLine).trim()
    const header = trimmed.match(/^\[\[?\s*([^\]]+?)\s*\]\]?$/)
    if (header) {
      flush()
      section = header[1]
      output.push(rawLine)
      continue
    }
    buffer.push(rawLine)
  }
  flush()

  return output.join('\n')
}

/**
 * 在 wrangler.toml 里确保存在某个段并写好键值。
 *
 * 已存在则只补缺失的键（不覆盖已有值、不动注释）；
 * 不存在则新增该段，插在 [vars] 之前（没有 [vars] 就追加到末尾）。
 */
function ensureSection(text, section, keys) {
  const lines = text.split(/\r?\n/)
  const output = []
  let current = ''
  let buffer = []
  let found = false

  const flush = () => {
    if (current === section && !found) {
      found = true
      const existingKeys = new Set(
        buffer
          .map(line => stripComment(line).match(/^\s*([A-Za-z0-9_]+)\s*=/)?.[1])
          .filter(Boolean),
      )
      const next = [...buffer]
      for (const [key, value] of Object.entries(keys)) {
        if (existingKeys.has(key))
          continue
        next.push(`${key} = "${value}"`)
      }
      output.push(...next)
    }
    else {
      output.push(...buffer)
    }
    buffer = []
  }

  for (const rawLine of lines) {
    const trimmed = stripComment(rawLine).trim()
    const header = trimmed.match(/^\[\[?\s*([^\]]+?)\s*\]\]?$/)
    if (header) {
      flush()
      current = header[1]
      output.push(rawLine)
      continue
    }
    buffer.push(rawLine)
  }
  flush()

  if (found)
    return output.join('\n')

  // 段不存在：新增一段，优先插到 [vars] 之前
  const block = [`[[${section}]]`, ...Object.entries(keys).map(([key, value]) => `${key} = "${value}"`), '']
  const varsIndex = output.findIndex(line => stripComment(line).trim() === '[vars]')
  if (varsIndex === -1) {
    while (output.length && output[output.length - 1].trim() === '')
      output.pop()
    output.push('', ...block)
    return output.join('\n')
  }

  output.splice(varsIndex, 0, ...block)
  return output.join('\n')
}

function quoteArg(arg) {
  return /[\s"]/.test(arg) ? `"${String(arg).replace(/"/g, '\\"')}"` : String(arg)
}

/** npx 兜底时使用的 wrangler 主版本，可用 WRANGLER_MAJOR 覆盖 */
export const WRANGLER_VERSION = `wrangler@${process.env.WRANGLER_MAJOR || '4'}`

/** 优先用项目内安装的 wrangler，避免 npx 临时下载导致版本漂移或 CI 无网络时失败 */
function resolveWranglerCommand() {
  // 项目内安装了就用本地的；否则退回 npx（Workers Builds 默认就是这么跑 wrangler 的）。
  // 固定主版本，避免 npx 每次都解析到不同的大版本导致构建行为漂移。
  const local = join(process.cwd(), 'node_modules', '.bin', process.platform === 'win32' ? 'wrangler.cmd' : 'wrangler')
  if (existsSync(local))
    return { command: local, args: [] }
  return { command: 'npx', args: ['--yes', WRANGLER_VERSION] }
}

export function runWrangler(args, options = {}) {
  const { cwd = process.cwd(), capture = false, allowFailure = false } = options
  const { command, args: prefix } = resolveWranglerCommand()
  const result = process.platform === 'win32'
    ? spawnSync(`${command} ${[...prefix, ...args].map(quoteArg).join(' ')}`, {
        cwd,
        shell: true,
        encoding: 'utf8',
        stdio: capture ? 'pipe' : 'inherit',
      })
    : spawnSync(command, [...prefix, ...args], {
        cwd,
        shell: false,
        encoding: 'utf8',
        stdio: capture ? 'pipe' : 'inherit',
      })

  if (result.error)
    throw new WranglerError(`执行 wrangler 失败: ${result.error.message}`)

  if (result.status !== 0 && !allowFailure) {
    const detail = [result.stdout, result.stderr].filter(Boolean).join('\n').trim()
    throw new WranglerError(`wrangler ${args.join(' ')} 退出码 ${result.status}`, detail)
  }

  if (result.status !== 0)
    return { ok: false, stdout: result.stdout || '', stderr: result.stderr || '' }

  return { ok: true, stdout: result.stdout || '', stderr: result.stderr || '' }
}

function extractJson(text) {
  const lines = String(text || '').split(/\r?\n/)
  for (let index = 0; index < lines.length; index += 1) {
    const trimmed = lines[index].trim()
    if (!trimmed.startsWith('[') && !trimmed.startsWith('{'))
      continue
    try {
      return JSON.parse(lines.slice(index).join('\n'))
    }
    catch {
      continue
    }
  }
  throw new WranglerError('wrangler 未返回可解析的 JSON', text)
}

export function runWranglerJson(args, options = {}) {
  const includesJsonFlag = args.includes('--json')
  const finalArgs = includesJsonFlag ? args : [...args, '--json']
  const result = runWrangler(finalArgs, { ...options, capture: true })
  return extractJson(result.stdout)
}

/**
 * 查询账号下的 D1 列表。
 *
 * 查询失败必须抛出而不是返回空数组：否则「未登录 / 无权限」会被当成
 * 「数据库不存在」，接着去创建同名库并覆盖 wrangler.toml 里的 database_id，
 * 把一个鉴权问题变成一条错误数据。
 */
/** 是否运行在 CI / Workers Builds 环境 */
export function isCI() {
  return Boolean(process.env.WORKERS_CI || process.env.CI || process.env.CF_PAGES)
}

export function listD1Databases(root) {
  const result = runWranglerJson(['d1', 'list'], { cwd: root })
  const list = Array.isArray(result) ? result : result?.result
  if (!Array.isArray(list))
    throw new WranglerError('无法解析 D1 数据库列表，请确认已执行 wrangler login 或配置了 CLOUDFLARE_API_TOKEN')
  return list
}

/**
 * 解析 D1 database_id，安全优先。
 *
 * 1. wrangler.toml 里已有合法 database_id → **直接采用**，不查询、不创建。
 *    配置是唯一权威：CI 里 `d1 list` 可能因 token 权限不足或分页返回不全，
 *    据此「纠正」id 会建出重复空库并把线上数据指向错误的库。
 * 2. id 为空/占位 → 按 database_name 查询：
 *    - 命中 → 采用其 uuid
 *    - 未命中 → 仅在允许创建时创建；CI 中直接报错，提示手动填写
 *
 * @returns {{ databaseId: string, created: boolean, source: 'config'|'list'|'created' }}
 */
export function ensureD1Database(root, databaseName, options = {}) {
  const { create = true, configuredId = '', log = () => {} } = options

  const byName = listD1Databases(root).find(item => item?.name === databaseName)

  // 1) 云端已有同名库 → 以云端 uuid 为准（配置里的 id 可能过期或填错）
  if (byName?.uuid) {
    if (!isPlaceholderDatabaseId(configuredId) && configuredId !== byName.uuid)
      log(`database_id 与云端不一致（配置 ${configuredId} → 云端 ${byName.uuid}），以云端为准`)
    else
      log(`D1 数据库已存在: ${databaseName} (${byName.uuid})`)
    return { databaseId: byName.uuid, created: false, source: 'list' }
  }

  // 2) 云端没有同名库 → 需要创建
  if (!create)
    throw new WranglerError(`D1 数据库不存在: ${databaseName}`)

  log(`未在云端找到数据库 "${databaseName}"，正在创建`)
  const result = runWrangler(['d1', 'create', databaseName], { cwd: root, capture: true, allowFailure: true })
  const output = `${result.stdout}\n${result.stderr}`

  const createdId = extractCreatedDatabaseId(output)
  if (createdId) {
    log(`已创建 D1 数据库 ${databaseName} (${createdId})`)
    return { databaseId: createdId, created: true, source: 'created' }
  }

  // 创建失败但库其实存在：说明列表因权限/分页没返回它。
  // 此时回退到配置里的 id，避免重复创建。
  if (/already exists|already owns|already has|已存在/i.test(output)) {
    if (!isPlaceholderDatabaseId(configuredId)) {
      log(`数据库 "${databaseName}" 已存在（列表未返回），沿用配置中的 database_id`)
      return { databaseId: configuredId, created: false, source: 'config' }
    }
    const retried = listD1Databases(root).find(item => item?.name === databaseName)
    if (retried?.uuid) {
      log(`D1 数据库已存在: ${databaseName} (${retried.uuid})`)
      return { databaseId: retried.uuid, created: false, source: 'list' }
    }
  }

  throw new WranglerError(
    `无法创建或定位 D1 数据库 "${databaseName}"。`
    + '\n请确认 CLOUDFLARE_API_TOKEN 具有 D1 Read/Write 权限，或在 wrangler.toml 中直接填写 database_id。',
    output,
  )
}

function extractCreatedDatabaseId(output) {
  const toml = output.match(/database_id\s*=\s*["']([^"']+)["']/)
  if (toml)
    return toml[1]

  const json = output.match(/"database_id"\s*:\s*"([^"]+)"/)
  if (json)
    return json[1]

  const uuid = output.match(/\b([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\b/i)
  return uuid ? uuid[1] : null
}

/**
 * 确保 R2 存储桶可用。
 *
 * R2 绑定只按名字引用，不需要 id；且 `wrangler r2 bucket list` 不支持 --json，
 * 因此这里不查列表：
 * - 需要时可以尝试创建，已存在(Bucket already exists)视为成功；
 * - CI 中不创建，桶不存在时交由首次写入给出明确错误。
 *
 * @returns {{ created: boolean }}
 */
export function ensureR2Bucket(root, bucketName, options = {}) {
  const { create = true, log = () => {} } = options

  if (!create)
    return { created: false }

  // R2 绑定只按名字引用、不需要 id；`r2 bucket list` 也不支持 --json，
  // 所以这里不做列表查询，直接用「创建 + 容忍已存在」的方式确保桶可用。
  log(`检查/创建 R2 存储桶: ${bucketName}`)
  const result = runWrangler(['r2', 'bucket', 'create', bucketName], { cwd: root, capture: true, allowFailure: true })
  if (result.ok) {
    log(`已创建 R2 存储桶 ${bucketName}`)
    return { created: true }
  }

  const detail = `${result.stdout}\n${result.stderr}`
  // 已存在是最常见的结果，属正常情况
  if (/already (exists|owned|has)|bucket.*exists|已存在/i.test(detail)) {
    log(`R2 存储桶已存在: ${bucketName}`)
    return { created: false }
  }

  // 创建权限不足等情况不阻塞流程：桶可能已存在，只是当前凭据没有创建权限。
  // 真正的可用性由后续写入验证，失败时会给出更具体的错误。
  log(`未能确认 R2 存储桶状态（${bucketName}），继续执行；若写入失败请检查桶名与 API Token 的 R2 权限`)
  return { created: false }
}

/**
 * 确保 wrangler.toml 里有可用的 D1 绑定。
 *
 * - 已有合法 database_id → 原样使用（不做任何网络查询与写入）
 * - id 缺失 → 按 database_name 查/建，并回填配置（CI 中只读不写）
 * - 绑定段缺失 → 补段
 *
 * @returns {{ databaseId: string, created: boolean, changed: boolean }}
 */
export function ensureD1Binding(root, options = {}) {
  const { log = () => {} } = options
  const config = resolveProjectConfig(root)

  const { databaseId, created } = ensureD1Database(root, config.d1.databaseName, {
    configuredId: config.d1.databaseId,
    create: true,
    log,
  })

  // CI 里的 wrangler.toml 是一次性检出，改写不会回流到仓库，
  // 因此只提示建议值，不写盘（真正生效的是下面渲染出的 wrangler.build.toml）。
  if (isCI()) {
    if (created)
      log(`建议把 database_id = "${databaseId}" 提交到 wrangler.toml，避免每次构建重新创建`)
    return { databaseId, created, changed: false }
  }

  let nextText = config.text

  if (!hasSection(config.text, 'd1_databases')) {
    nextText = ensureSection(nextText, 'd1_databases', {
      binding: config.d1.binding,
      database_name: config.d1.databaseName,
      database_id: databaseId,
    })
    log('wrangler.toml 缺少 [[d1_databases]] 绑定，已自动补上')
  }
  else if (config.d1.databaseId !== databaseId) {
    nextText = patchDatabaseId(nextText, databaseId)
  }

  const changed = nextText === config.text ? false : writeFileIfChanged(config.configPath, nextText)
  if (changed)
    log('已写入 database_id 到 wrangler.toml')

  return { databaseId, created, changed }
}

/**
 * 确保 wrangler.toml 里有 R2 绑定段；桶本身按名字引用，不强制查询。
 *
 * @returns {{ created: boolean, changed: boolean }}
 */
export function ensureR2Binding(root, options = {}) {
  const { log = () => {} } = options
  const config = resolveProjectConfig(root)
  const { created } = ensureR2Bucket(root, config.r2.bucketName, { log })

  if (isCI() || hasSection(config.text, 'r2_buckets'))
    return { created, changed: false }

  const nextText = ensureSection(config.text, 'r2_buckets', {
    binding: config.r2.binding,
    bucket_name: config.r2.bucketName,
  })
  const changed = writeFileIfChanged(config.configPath, nextText)
  if (changed)
    log('wrangler.toml 缺少 [[r2_buckets]] 绑定，已自动补上')

  return { created, changed }
}

/** 一次性确保 D1 与 R2 绑定都已就绪 */
export function ensureCloudflareBindings(root, options = {}) {
  const { log = () => {} } = options
  const d1 = ensureD1Binding(root, { log })
  const r2 = ensureR2Binding(root, { log })
  return { d1, r2 }
}

export function applyMigrations(root, options = {}) {
  const { databaseName, local = false, log = () => {} } = options
  log(`应用 D1 迁移 (${local ? 'local' : 'remote'}): ${databaseName}`)
  runWrangler(['d1', 'migrations', 'apply', databaseName, local ? '--local' : '--remote'], { cwd: root })
}

export function executeSqlFile(root, options = {}) {
  const { databaseName, file, local = false } = options
  runWrangler(['d1', 'execute', databaseName, local ? '--local' : '--remote', '--file', file], { cwd: root })
}

export function executeSqlCommand(root, options = {}) {
  const { databaseName, sql, local = false } = options
  runWrangler(['d1', 'execute', databaseName, local ? '--local' : '--remote', '--command', sql], { cwd: root })
}

export function putR2Object(root, options = {}) {
  const { bucketName, r2Key, file, local = false, contentType } = options
  const args = ['r2', 'object', 'put', `${bucketName}/${r2Key}`, local ? '--local' : '--remote', '--file', file]
  if (contentType)
    args.push('--content-type', contentType)
  runWrangler(args, { cwd: root })
}

export function writeFileIfChanged(path, content) {
  const previous = existsSync(path) ? readFileSync(path, 'utf8') : null
  if (previous === content)
    return false
  writeFileSync(path, content, 'utf8')
  return true
}
