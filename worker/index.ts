/**
 * Cloudflare Workers 入口
 *
 * Pages 版靠 functions/ 目录约定自动路由；Workers 没有这个约定，
 * 因此这里显式做一张路由表，把请求分派给 functions/ 下已有的 onRequest，
 * 保持两套部署方式的业务代码完全一致。
 */

import type { CloudflareEnv } from '../types/env'
import { onRequest as handlePosts } from '../functions/api/posts/[[path]]'
import { onRequest as handleGallery } from '../functions/api/gallery/[[path]]'
import { onRequest as handleHtmlFilesApi } from '../functions/api/html-files/[[path]]'
import { onRequest as handleAdmin } from '../functions/api/admin/[[path]]'
import { onRequest as handleAbout } from '../functions/api/about/[[path]]'
import { onRequest as handleLinks } from '../functions/api/links/[[path]]'
import { onRequest as handleNotice } from '../functions/api/notice/[[path]]'
import { onRequest as handleAlbumWebdav } from '../functions/api/album-webdav/[[path]]'
import { onRequest as handleAtomXml } from '../functions/atom.xml'
import { onRequest as handleHtmlFile } from '../functions/[[path]]'

interface WorkerEnv extends CloudflareEnv {
  ASSETS: { fetch: (request: Request) => Promise<Response> }
}

type Handler = (context: any) => Promise<Response>

/** 前缀路由：/api/<prefix>/<剩余段>，剩余段以数组形式作为 params.path 传入 */
interface PrefixRoute {
  prefix: string
  handler: Handler
  withParams: boolean
}

const PREFIX_ROUTES: PrefixRoute[] = [
  { prefix: '/api/posts', handler: handlePosts, withParams: true },
  { prefix: '/api/gallery', handler: handleGallery, withParams: true },
  { prefix: '/api/html-files', handler: handleHtmlFilesApi, withParams: true },
  { prefix: '/api/admin', handler: handleAdmin, withParams: true },
  { prefix: '/api/about', handler: handleAbout, withParams: false },
  { prefix: '/api/links', handler: handleLinks, withParams: false },
  { prefix: '/api/notice', handler: handleNotice, withParams: false },
  { prefix: '/api/album-webdav', handler: handleAlbumWebdav, withParams: false },
]

/** 把以 prefix 开头的 pathname 拆出剩余段 */
function splitAfterPrefix(pathname: string, prefix: string): string[] | null {
  if (pathname === prefix)
    return []
  if (!pathname.startsWith(`${prefix}/`))
    return null
  return pathname
    .slice(prefix.length + 1)
    .split('/')
    .filter(Boolean)
}

async function route(request: Request, env: WorkerEnv, url: URL): Promise<Response | null> {
  if (url.pathname === '/atom.xml')
    return handleAtomXml({ request, env })

  for (const route of PREFIX_ROUTES) {
    const segments = splitAfterPrefix(url.pathname, route.prefix)
    if (!segments)
      continue

    // 与 Pages Functions 的 [[path]] 行为对齐：无剩余段时 params.path 为 undefined
    const params = route.withParams && segments.length
      ? { path: segments }
      : {}

    return route.handler({ request, env, params })
  }

  return null
}

export default {
  async fetch(request: Request, env: WorkerEnv): Promise<Response> {
    const url = new URL(request.url)

    const handled = await route(request, env, url)
    if (handled)
      return handled

    // 后台可维护的独立 HTML 文件：/xxx.html
    if (url.pathname.endsWith('.html')) {
      const htmlResponse = await handleHtmlFile({ request, env })
      if (htmlResponse.status !== 404)
        return htmlResponse
    }

    // 其余交给静态资源（dist 产物）
    return env.ASSETS.fetch(request)
  },
}
