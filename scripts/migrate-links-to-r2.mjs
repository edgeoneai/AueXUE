#!/usr/bin/env node
/**
 * 导入友链（content/links/index.md → R2）
 *
 * 用法:
 *   npm run migrate:links
 *   npm run migrate:links:local
 *
 * 实际逻辑在 scripts/lib/content-import.mjs，等价于:
 *   npm run content:import -- --only links
 */

import { runSingleCategory } from './lib/migrate-entry.mjs'

runSingleCategory('links')
