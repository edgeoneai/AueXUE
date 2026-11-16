import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

/**
 * 读取构建期由 scripts/fetch-site-settings.mjs 写出的后台站点设置。
 *
 * 只在 Node（valaxy 的配置加载阶段）里执行，不会进入浏览器产物。
 * 文件不存在或解析失败时返回空对象，调用方回落到配置文件里的默认值。
 */
export function loadGeneratedSiteSettings(): Record<string, any> {
  const filePath = join(process.cwd(), '.site-settings.local.json')
  if (!existsSync(filePath))
    return {}

  try {
    const parsed = JSON.parse(readFileSync(filePath, 'utf8'))
    return parsed && typeof parsed === 'object' ? parsed : {}
  }
  catch {
    return {}
  }
}
