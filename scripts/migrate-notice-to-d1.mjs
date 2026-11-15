#!/usr/bin/env node
/**
 * 导入公告栏（content/notice.json → D1）
 *
 * 用法:
 *   npm run migrate:notice
 *   npm run migrate:notice:local
 *
 * 实际逻辑在 scripts/lib/content-import.mjs，等价于:
 *   npm run content:import -- --only notice
 */

import { runSingleCategory } from './lib/migrate-entry.mjs'

runSingleCategory('notice')
