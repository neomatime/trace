/**
 * Tiny SVG helpers for the TRACE renderer, plus the task-type icons. All
 * geometry here is TRACE's own; colours come from CSS classes defined in
 * components/process-flows/bpmn-editor.css (theme tokens), never inline.
 */

const SVG_NS = 'http://www.w3.org/2000/svg'

export function svg<K extends keyof SVGElementTagNameMap>(
  parent: SVGElement,
  tag: K,
  attrs: Record<string, string | number>,
  className?: string,
): SVGElementTagNameMap[K] {
  const el = document.createElementNS(SVG_NS, tag)
  for (const [key, value] of Object.entries(attrs)) el.setAttribute(key, String(value))
  if (className) el.setAttribute('class', className)
  parent.appendChild(el)
  return el
}

export function group(parent: SVGElement, className: string, transform?: string): SVGGElement {
  return svg(parent, 'g', transform ? { transform } : {}, className)
}

/** Person: head and shoulders. Drawn in a 16x16 box. */
function drawUserIcon(parent: SVGGElement): void {
  svg(parent, 'circle', { cx: 8, cy: 5, r: 3.2 }, 'tb-icon')
  svg(parent, 'path', { d: 'M2 15.5C2 11 4.8 9.2 8 9.2s6 1.8 6 6.3Z' }, 'tb-icon')
}

/** Open hand: thumb and four fingers. Drawn in a 16x16 box. */
function drawManualIcon(parent: SVGGElement): void {
  const d = [
    'M3.5 15.5V9a1 1 0 0 1 2 0v1.5',
    'V4a1 1 0 0 1 2 0v5',
    'V2.8a1 1 0 0 1 2 0V9',
    'V4a1 1 0 0 1 2 0v5.5',
    'V6.2a1 1 0 0 1 2 0v5.8c0 2-1.5 3.5-3.5 3.5Z',
  ].join(' ')
  svg(parent, 'path', { d }, 'tb-icon')
}

/** Gear: eight teeth around a hub. Drawn in a 16x16 box. */
function drawServiceIcon(parent: SVGGElement): void {
  const cx = 8
  const cy = 8
  const inner = 5.2
  const outer = 7.4
  const point = (deg: number, r: number) => {
    const rad = (deg * Math.PI) / 180
    return `${(cx + r * Math.cos(rad)).toFixed(2)} ${(cy + r * Math.sin(rad)).toFixed(2)}`
  }
  const parts: string[] = []
  for (let i = 0; i < 8; i += 1) {
    const base = i * 45
    parts.push(
      `${i === 0 ? 'M' : 'L'}${point(base, inner)}`,
      `L${point(base + 8, outer)}`,
      `L${point(base + 22, outer)}`,
      `L${point(base + 30, inner)}`,
    )
  }
  svg(parent, 'path', { d: `${parts.join(' ')}Z` }, 'tb-icon')
  svg(parent, 'circle', { cx, cy, r: 2.2 }, 'tb-icon')
}

export function drawTaskIcon(parent: SVGElement, icon: 'user' | 'manual' | 'service'): void {
  const box = group(parent, `tb-task-icon tb-task-icon-${icon}`, 'translate(7 7)')
  if (icon === 'user') drawUserIcon(box)
  else if (icon === 'manual') drawManualIcon(box)
  else drawServiceIcon(box)
}

export type Pt = { x: number; y: number }

/** Triangle arrowhead whose tip sits on `tip`, pointing away from `from`. */
export function arrowHeadPoints(from: Pt, tip: Pt, length = 10, halfWidth = 4): string {
  const dx = tip.x - from.x
  const dy = tip.y - from.y
  const len = Math.hypot(dx, dy) || 1
  const ux = dx / len
  const uy = dy / len
  const bx = tip.x - ux * length
  const by = tip.y - uy * length
  const left = `${bx - uy * halfWidth},${by + ux * halfWidth}`
  const right = `${bx + uy * halfWidth},${by - ux * halfWidth}`
  return `${tip.x},${tip.y} ${left} ${right}`
}
