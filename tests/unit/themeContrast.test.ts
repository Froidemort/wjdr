import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

type Lab = [number, number, number]
type Rgb = [number, number, number]

const css = readFileSync(resolve(__dirname, '../../src/assets/css/theme.css'), 'utf8')

const THEMES = ['grimorium-dark', 'grimorium-light'] as const
const STATES = ['primary', 'error', 'success', 'info'] as const
const SOLID = ['primary', 'secondary', 'accent', 'neutral', 'info', 'success', 'warning', 'error'] as const
const BASES = ['base-100', 'base-200', 'base-300'] as const

function parseTheme(name: string): Record<string, Lab> {
  const block = new RegExp(`name:\\s*"${name}"[\\s\\S]*?\\n\\}`).exec(css)?.[0] ?? ''
  const tokens: Record<string, Lab> = {}
  for (const m of block.matchAll(/--color-([a-z0-9-]+):\s*oklch\(([\d.]+)%\s+([\d.]+)\s+([\d.]+)\)/g)) {
    const [, key, l, c, h] = m
    const hue = (Number(h) * Math.PI) / 180
    tokens[key] = [Number(l) / 100, Number(c) * Math.cos(hue), Number(c) * Math.sin(hue)]
  }
  return tokens
}

const mixLab = (a: Lab, weight: number, b: Lab): Lab => [
  a[0] * weight + b[0] * (1 - weight),
  a[1] * weight + b[1] * (1 - weight),
  a[2] * weight + b[2] * (1 - weight),
]

const clamp01 = (x: number): number => Math.min(1, Math.max(0, x))
const gamma = (c: number): number => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055)
const linear = (c: number): number => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)

function toSrgb([L, a, b]: Lab): Rgb {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const s = (L - 0.0894841775 * a - 1.2914855480 * b) ** 3
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s,
  ].map((v) => gamma(clamp01(v))) as Rgb
}

const luminance = ([r, g, b]: Rgb): number => 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b)

function ratio(a: Rgb, b: Rgb): number {
  const [x, y] = [luminance(a), luminance(b)]
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05)
}

// Browsers composite translucent colors in gamma-encoded sRGB.
const overBg = (fg: Lab, alpha: number, bg: Lab): Rgb => {
  const [f, b] = [toSrgb(fg), toSrgb(bg)]
  return f.map((v, i) => v * alpha + b[i] * (1 - alpha)) as Rgb
}

const contrast = (fg: Lab, bg: Lab): number => ratio(toSrgb(fg), toSrgb(bg))

describe.each(THEMES)('theme contrast: %s', (theme) => {
  const t = parseTheme(theme)

  it.each(BASES)('body text on %s reaches AAA', (base) => {
    expect(contrast(t['base-content'], t[base])).toBeGreaterThanOrEqual(7)
  })

  it.each(SOLID)('solid badge %s-content on %s reaches AAA', (name) => {
    expect(contrast(t[`${name}-content`], t[name])).toBeGreaterThanOrEqual(7)
  })

  it.each(STATES)('soft badge text %s reaches AAA', (name) => {
    const softBg = mixLab(t[name], 0.08, t['base-100'])
    expect(contrast(t[name], softBg)).toBeGreaterThanOrEqual(7)
  })

  it.each(['primary', 'accent', 'info', 'success', 'warning', 'error'] as const)(
    'colored text %s reaches AA on every base',
    (name) => {
      for (const base of BASES) {
        expect(contrast(t[name], t[base]), `${name} on ${base}`).toBeGreaterThanOrEqual(4.5)
      }
    },
  )

  it.each(BASES)('muted text (base-content at 70%%) reaches AA on %s', (base) => {
    expect(ratio(overBg(t['base-content'], 0.7, t[base]), toSrgb(t[base]))).toBeGreaterThanOrEqual(4.5)
  })

  it.each(BASES)('placeholder reaches AA on %s', (base) => {
    const alpha = Number(/::placeholder\s*\{\s*color:\s*color-mix\(in oklab, var\(--color-base-content\) (\d+)%/.exec(css)?.[1]) / 100
    expect(alpha).toBeGreaterThan(0)
    expect(ratio(overBg(t['base-content'], alpha, t[base]), toSrgb(t[base]))).toBeGreaterThanOrEqual(4.5)
  })

  it.each(BASES)('form field border reaches 3:1 on %s', (base) => {
    const rule = /\.input,\s*\.select,\s*\.textarea,\s*input,\s*select,\s*textarea\s*\{\s*border-color:\s*color-mix\(in oklab, var\(--color-base-content\) (\d+)%/.exec(css)
    const alpha = Number(rule?.[1]) / 100
    expect(alpha).toBeGreaterThan(0)
    expect(ratio(overBg(t['base-content'], alpha, t[base]), toSrgb(t[base]))).toBeGreaterThanOrEqual(3)
  })

  it.each(['accent', 'primary'] as const)('focus ring color %s reaches 3:1 on base-100', (name) => {
    expect(contrast(t[name], t['base-100'])).toBeGreaterThanOrEqual(3)
  })
})

describe.each(THEMES)('button contrast: %s', (theme) => {
  const t = parseTheme(theme)

  it.each(SOLID)('btn-%s label reaches AA on its daisyUI background', (name) => {
    expect(contrast(t[`${name}-content`], t[name])).toBeGreaterThanOrEqual(4.5)
  })

  it('default btn label reaches AA on base-200', () => {
    expect(contrast(t['base-content'], t['base-200'])).toBeGreaterThanOrEqual(4.5)
  })
})

describe('theme.css button rules', () => {
  it('leaves button colors to daisyUI bg-* / *-content pairs', () => {
    const rules = [...css.matchAll(/(^|\n)(\.btn[^{]*)\{([^}]*)\}/g)].filter(
      ([, , selector]) => !selector.includes(':focus-visible'),
    )
    expect(rules.length).toBeGreaterThan(0)
    for (const [, , selector, body] of rules) {
      expect(body, selector).not.toMatch(/color-mix|background|border-color|(^|[\s;])color:/)
    }
  })
})

describe('theme.css badge rules', () => {
  it('does not force a text color on state badges', () => {
    expect(css).not.toMatch(/\.badge-(success|warning|error|info)\s*[,{][^}]*\bcolor:/)
  })
})
