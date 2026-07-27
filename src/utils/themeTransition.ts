export type ThemeTransitionVariant =
  | 'circle'
  | 'square'
  | 'triangle'
  | 'diamond'
  | 'hexagon'
  | 'rectangle'
  | 'star'

export interface AnimatedThemeToggleOptions {
  applyTheme: () => void
  button?: HTMLElement | null
  duration?: number
  variant?: ThemeTransitionVariant
  fromCenter?: boolean
}

function polygonCollapsed(point: string, vertexCount: number): string {
  const pairs = Array.from({ length: vertexCount }, () => point).join(', ')
  return `polygon(${pairs})`
}

function getThemeTransitionClipPaths(
  variant: ThemeTransitionVariant,
  cx: number,
  cy: number,
  maxRadius: number,
  viewportWidth: number,
  viewportHeight: number,
): [string, string] {
  const toX = (x: number) => `${(x / viewportWidth) * 100}%`
  const toY = (y: number) => `${(y / viewportHeight) * 100}%`
  const point = (x: number, y: number) => `${toX(x)} ${toY(y)}`
  const toRadius = (r: number) =>
    `${(r / (Math.hypot(viewportWidth, viewportHeight) / Math.SQRT2)) * 100}%`

  switch (variant) {
    case 'circle':
      return [
        `circle(0% at ${point(cx, cy)})`,
        `circle(${toRadius(maxRadius)} at ${point(cx, cy)})`,
      ]
    case 'square': {
      const halfW = Math.max(cx, viewportWidth - cx)
      const halfH = Math.max(cy, viewportHeight - cy)
      const halfSide = Math.max(halfW, halfH) * 1.05
      const end = [
        point(cx - halfSide, cy - halfSide),
        point(cx + halfSide, cy - halfSide),
        point(cx + halfSide, cy + halfSide),
        point(cx - halfSide, cy + halfSide),
      ].join(', ')
      return [polygonCollapsed(point(cx, cy), 4), `polygon(${end})`]
    }
    case 'triangle': {
      const scale = maxRadius * 2.2
      const dx = (Math.sqrt(3) / 2) * scale
      const verts = [
        point(cx, cy - scale),
        point(cx + dx, cy + 0.5 * scale),
        point(cx - dx, cy + 0.5 * scale),
      ].join(', ')
      return [polygonCollapsed(point(cx, cy), 3), `polygon(${verts})`]
    }
    case 'diamond': {
      const radius = maxRadius * Math.SQRT2
      const end = [
        point(cx, cy - radius),
        point(cx + radius, cy),
        point(cx, cy + radius),
        point(cx - radius, cy),
      ].join(', ')
      return [polygonCollapsed(point(cx, cy), 4), `polygon(${end})`]
    }
    case 'hexagon': {
      const radius = maxRadius * Math.SQRT2
      const verts: string[] = []
      for (let i = 0; i < 6; i++) {
        const angle = -Math.PI / 2 + (i * Math.PI) / 3
        verts.push(point(cx + radius * Math.cos(angle), cy + radius * Math.sin(angle)))
      }
      return [polygonCollapsed(point(cx, cy), 6), `polygon(${verts.join(', ')})`]
    }
    case 'rectangle': {
      const halfW = Math.max(cx, viewportWidth - cx)
      const halfH = Math.max(cy, viewportHeight - cy)
      const end = [
        point(cx - halfW, cy - halfH),
        point(cx + halfW, cy - halfH),
        point(cx + halfW, cy + halfH),
        point(cx - halfW, cy + halfH),
      ].join(', ')
      return [polygonCollapsed(point(cx, cy), 4), `polygon(${end})`]
    }
    case 'star': {
      const radius = maxRadius * Math.SQRT2 * 1.03
      const innerRatio = 0.42
      const starPolygon = (r: number) => {
        const verts: string[] = []
        for (let i = 0; i < 5; i++) {
          const outerAngle = -Math.PI / 2 + (i * 2 * Math.PI) / 5
          verts.push(
            point(cx + r * Math.cos(outerAngle), cy + r * Math.sin(outerAngle)),
          )
          const innerAngle = outerAngle + Math.PI / 5
          verts.push(
            point(
              cx + r * innerRatio * Math.cos(innerAngle),
              cy + r * innerRatio * Math.sin(innerAngle),
            ),
          )
        }
        return `polygon(${verts.join(', ')})`
      }
      return [starPolygon(Math.max(2, radius * 0.025)), starPolygon(radius)]
    }
    default:
      return [
        `circle(0% at ${point(cx, cy)})`,
        `circle(${toRadius(maxRadius)} at ${point(cx, cy)})`,
      ]
  }
}

let isTransitioning = false

export function runAnimatedThemeToggle({
  applyTheme,
  button = null,
  duration = 400,
  variant = 'circle',
  fromCenter = false,
}: AnimatedThemeToggleOptions): void {
  const root = document.documentElement

  if (isTransitioning || root.dataset.magicuiThemeVt === 'active') {
    return
  }

  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight

  let x: number
  let y: number
  if (fromCenter) {
    x = viewportWidth / 2
    y = viewportHeight / 2
  } else if (button) {
    const { top, left, width, height } = button.getBoundingClientRect()
    x = left + width / 2
    y = top + height / 2
  } else {
    x = viewportWidth / 2
    y = viewportHeight / 2
  }

  const maxRadius = Math.hypot(
    Math.max(x, viewportWidth - x),
    Math.max(y, viewportHeight - y),
  )

  const applyThemeChange = () => {
    applyTheme()
  }

  if (typeof document.startViewTransition !== 'function') {
    applyThemeChange()
    return
  }

  const clipPath = getThemeTransitionClipPaths(
    variant,
    x,
    y,
    maxRadius,
    viewportWidth,
    viewportHeight,
  )

  const cleanup = () => {
    isTransitioning = false
    delete root.dataset.magicuiThemeVt
    root.style.removeProperty('--magicui-theme-toggle-vt-duration')
    root.style.removeProperty('--magicui-theme-vt-clip-from')
  }

  root.dataset.magicuiThemeVt = 'active'
  root.style.setProperty('--magicui-theme-toggle-vt-duration', `${duration}ms`)
  root.style.setProperty('--magicui-theme-vt-clip-from', clipPath[0])

  isTransitioning = true
  const transition = document.startViewTransition(() => {
    applyThemeChange()
  })

  if (typeof transition?.finished?.finally === 'function') {
    transition.finished.finally(cleanup).catch(() => {})
  } else {
    cleanup()
  }

  const ready = transition?.ready
  if (ready && typeof ready.then === 'function') {
    ready
      .then(() => {
        root.animate(
          { clipPath },
          {
            duration,
            easing: variant === 'star' ? 'linear' : 'ease-in-out',
            fill: 'forwards',
            pseudoElement: '::view-transition-new(root)',
          },
        )
      })
      .catch(() => {})
  }
}
