#!/usr/bin/env node
/**
 * 导入文章（content/posts/*.md → R2 + D1）
 *
 * 用法:
 *   npm run migrate:posts
 *   npm run migrate:posts:local
 *
 * 实际逻辑在 scripts/lib/content-import.mjs，等价于:
 *   npm run content:import -- --only posts
 */

import { runSingleCategory } from './lib/migrate-entry.mjs'

runSingleCategory('posts')
