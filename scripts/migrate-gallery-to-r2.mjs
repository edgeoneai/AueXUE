#!/usr/bin/env node
/**
 * 导入相册（content/gallery/** → R2）
 *
 * 用法:
 *   npm run migrate:gallery
 *   npm run migrate:gallery:local
 *
 * 实际逻辑在 scripts/lib/content-import.mjs，等价于:
 *   npm run content:import -- --only gallery
 */

import { runSingleCategory } from './lib/migrate-entry.mjs'

runSingleCategory('gallery')
