#!/usr/bin/env node
/**
 * 导入关于页（content/about/index.md → R2）
 *
 * 用法:
 *   npm run migrate:about
 *   npm run migrate:about:local
 *
 * 实际逻辑在 scripts/lib/content-import.mjs，等价于:
 *   npm run content:import -- --only about
 */

import { runSingleCategory } from './lib/migrate-entry.mjs'

runSingleCategory('about')
