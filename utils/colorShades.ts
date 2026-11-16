/**
 * 由主色推导主题所需的三档变体色。
 *
 * sakura 主题在编译期用 SCSS 生成 --va-c-primary / -light / -lighter / -dark。
 * 运行时改主题色时这些变量不会自动更新，需要按同样的规律重算：
 * 实测主题只调整 HSL 的亮度（色相、饱和度基本不变），
 * light +2.7、lighter +5.4、dark -7.3 个百分点。
 */

const LIGHT_DELTA = 2.75
const LIGHTER_DELTA = 5.5
const DARK_DELTA = -7.3

function parseHex(input: string): [number, number, number] | null {
  const raw = input.trim()
  const short = raw.match(/^#([0-9a-f])([0-9a-f])([0-9a-f])$/i)
  if (short) {
    return [
      Number.parseInt(`${short[1]}${short[1]}`, 16),
      Number.parseInt(`${short[2]}${short[2]}`, 16),
      Number.parseInt(`${short[3]}${short[3]}`, 16),
    ]
  }

  const full = raw.match(/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i)
  if (full) {
    return [
      Number.parseInt(full[1], 16),
      Number.parseInt(full[2], 16),
      Number.parseInt(full[3], 16),
    ]
  }

  return null
}

function rgbToHsl([r255, g255, b255]: [number, number, number]): [number, number, number] {
  const r = r255 / 255
  const g = g255 / 255
  const b = b255 / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2

  if (max === min)
    return [0, 0, l * 100]

  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)

  let h: number
  if (max === r)
    h = ((g - b) / d + (g < b ? 6 : 0)) / 6
  else if (max === g)
    h = ((b - r) / d + 2) / 6
  else
    h = ((r - g) / d + 4) / 6

  return [h * 360, s * 100, l * 100]
}

function hslToHex([hDeg, sPct, lPct]: [number, number, number]): string {
  const h = ((hDeg % 360) + 360) % 360
  const s = Math.max(0, Math.min(100, sPct)) / 100
  const l = Math.max(0, Math.min(100, lPct)) / 100

  const c = (1 - Math.abs(2 * l - 1)) * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = l - c / 2

  let rgb: [number, number, number]
  if (h < 60)
    rgb = [c, x, 0]
  else if (h < 120)
    rgb = [x, c, 0]
  else if (h < 180)
    rgb = [0, c, x]
  else if (h < 240)
    rgb = [0, x, c]
  else if (h < 300)
    rgb = [x, 0, c]
  else
    rgb = [c, 0, x]

  return `#${rgb
    .map(v => Math.round((v + m) * 255).toString(16).padStart(2, '0'))
    .join('')}`
}

export interface ThemeShades {
  primary: string
  light: string
  lighter: string
  dark: string
}

/** 输入 #RGB / #RRGGBB，输出主题所需的四档颜色；无法解析时返回 null */
export function buildThemeShades(primary: string): ThemeShades | null {
  const rgb = parseHex(primary)
  if (!rgb)
    return null

  const [h, s, l] = rgbToHsl(rgb)
  return {
    primary: hslToHex([h, s, l]),
    light: hslToHex([h, s, l + LIGHT_DELTA]),
    lighter: hslToHex([h, s, l + LIGHTER_DELTA]),
    dark: hslToHex([h, s, l + DARK_DELTA]),
  }
}
