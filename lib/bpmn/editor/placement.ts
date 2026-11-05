/**
 * Where to put an element appended to another one ("add next step"): to the
 * right of the source on its mid line; if that slot is taken, the nearest
 * free slot below or above it (decision branches fan out downward first); if
 * the whole column is taken, the next column to the right. Pure geometry, no
 * diagram-js imports.
 */

export interface Rect {
  x: number
  y: number
  width: number
  height: number
}

export interface Point {
  x: number
  y: number
}

export interface AppendPlacement {
  source: Rect
  size: { width: number; height: number }
  /** Shapes the new element must not overlap (other flow nodes). */
  obstacles: readonly Rect[]
  /** The lane or pool the new element must stay inside vertically. */
  container?: Rect
  /** Horizontal gap between source and new element. */
  gap?: number
}

const PAD = 10
const ROW_GAP = 40
const MAX_ROWS = 6
const MAX_COLUMNS = 20

function overlaps(a: Rect, b: Rect, pad: number): boolean {
  return a.x < b.x + b.width + pad && b.x < a.x + a.width + pad && a.y < b.y + b.height + pad && b.y < a.y + a.height + pad
}

/** Centre point for the new element (diagram-js positions shapes by centre). */
export function findAppendPosition({ source, size, obstacles, container, gap = 50 }: AppendPlacement): Point {
  const midY = source.y + source.height / 2
  const firstX = source.x + source.width + gap + size.width / 2
  const rowStep = Math.max(size.height, 50) + ROW_GAP
  const columnStep = size.width + gap

  const fitsContainer = (centre: Point) => {
    if (!container) return true
    const top = centre.y - size.height / 2
    return top >= container.y + 5 && top + size.height <= container.y + container.height - 5
  }
  const isFree = (centre: Point) => {
    const box = { x: centre.x - size.width / 2, y: centre.y - size.height / 2, width: size.width, height: size.height }
    return obstacles.every((o) => !overlaps(box, o, PAD))
  }

  // Rows in preference order: mid line, then +1, -1, +2, -2 ...
  const rows: number[] = [midY]
  for (let k = 1; k <= MAX_ROWS; k += 1) rows.push(midY + k * rowStep, midY - k * rowStep)

  for (let column = 0; column < MAX_COLUMNS; column += 1) {
    const x = firstX + column * columnStep
    for (const y of rows) {
      const centre = { x, y }
      if (fitsContainer(centre) && isFree(centre)) return centre
    }
  }
  return { x: firstX, y: midY }
}
