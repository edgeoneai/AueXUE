import type { Plugin } from 'vite'

/**
 * 把 valaxy 的模块级 valaxyConfigRef 暴露到 globalThis，
 * 供 utils/applySiteSettings.ts 在运行时覆盖站点信息。
 *
 * useSiteConfig() 是 `computed(() => valaxyConfigRef.value.siteConfig)`，
 * 改写这个 ref 即可让全站（含主题内部组件）响应式更新。
 */
export function exposeValaxyConfig(): Plugin {
  return {
    name: 'expose-valaxy-config',
    enforce: 'post',
    transform(code, id) {
      if (!id.includes('valaxy/client/config'))
        return

      if (!code.includes('valaxyConfigRef'))
        return

      return {
        code: `${code}
if (typeof globalThis !== 'undefined')
  globalThis.__VALAXY_CONFIG_REF__ = valaxyConfigRef
`,
        map: null,
      }
    },
  }
}
