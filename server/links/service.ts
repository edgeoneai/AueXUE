import type { CloudflareEnv } from '../../types/env'
import type { LinksDetail } from '../../types/links'
import { LINKS_R2_KEY } from './constants'
import { parseLinksSource, serializeLinksFrontmatter } from './frontmatter'
import { normalizeFriendLinkNotice } from './notice'

export async function getLinks(env: CloudflareEnv, options: { includeSource?: boolean } = {}): Promise<LinksDetail | null> {
  const object = await env.BUCKET.get(LINKS_R2_KEY)
  if (!object)
    return null

  const source = await object.text()
  const parsed = parseLinksSource(source)

  return {
    frontmatter: parsed.frontmatter,
    linkGroups: parsed.linkGroups,
    // 始终返回完整配置（未配置时是默认值），前端不必再兜底
    friendLinkNotice: normalizeFriendLinkNotice(parsed.frontmatter.friendLinkNotice),
    source: options.includeSource ? source : undefined,
  }
}

export async function upsertLinks(env: CloudflareEnv, source: string) {
  const parsed = parseLinksSource(source)
  const normalized = serializeLinksFrontmatter(parsed.frontmatter, parsed.content)

  await env.BUCKET.put(LINKS_R2_KEY, normalized, {
    httpMetadata: { contentType: 'text/markdown; charset=utf-8' },
  })

  return {
    r2Key: LINKS_R2_KEY,
    frontmatter: parsed.frontmatter,
    linkGroups: parsed.linkGroups,
    friendLinkNotice: normalizeFriendLinkNotice(parsed.frontmatter.friendLinkNotice),
  }
}
