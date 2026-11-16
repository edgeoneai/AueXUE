import type { CloudflareEnv } from '../../../types/env'
import { verifyAdminRequest } from '../../../server/auth/adminSession'
import {
  getSiteSettings,
  resetSiteSettings,
  saveSiteSettings,
} from '../../../server/siteSettings/service'

function json(data: unknown, status = 200, privateResponse = false) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': privateResponse
        ? 'private, no-store'
        : 'public, max-age=0, must-revalidate',
    },
  })
}

export async function onRequest(context: {
  request: Request
  env: CloudflareEnv
  params: { path?: string[] }
}) {
  const { request, env, params } = context
  const segments = params.path || []
  const method = request.method
  const isAdmin = await verifyAdminRequest(request, env)

  try {
    // GET /api/site-settings —— 公开读取（前台渲染需要）
    if (!segments.length && method === 'GET')
      return json(await getSiteSettings(env), 200, isAdmin)

    // PUT /api/site-settings —— 管理员保存
    if (!segments.length && method === 'PUT') {
      if (!isAdmin)
        return json({ message: '未授权' }, 401)

      let body: unknown
      try {
        body = await request.json()
      }
      catch {
        return json({ message: '请求体不是合法 JSON' }, 400)
      }

      return json(await saveSiteSettings(env, body), 200, true)
    }

    // POST /api/site-settings/reset —— 恢复默认值
    if (segments[0] === 'reset' && method === 'POST') {
      if (!isAdmin)
        return json({ message: '未授权' }, 401)
      return json(await resetSiteSettings(env), 200, true)
    }

    return json({ message: 'Not found' }, 404)
  }
  catch (error) {
    const message = error instanceof Error ? error.message : '服务器错误'
    return json({ message }, 500)
  }
}
