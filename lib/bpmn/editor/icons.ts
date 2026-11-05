/**
 * TRACE's own small icons for the palette and the context pad, as SVG markup
 * strings (the diagram-js context pad takes HTML strings). Drawn on a 20x20
 * grid with `currentColor`, so CSS theme tokens decide the colour.
 */

import type { PaletteIcon } from './palette.ts'

export type PadIcon = PaletteIcon | 'connect' | 'delete' | 'lane-above' | 'lane-below'

const wrap = (body: string) =>
  `<svg viewBox="0 0 20 20" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${body}</svg>`

const box = '<rect x="2" y="4" width="16" height="12" rx="2.5" />'

const ICONS: Readonly<Record<PadIcon, string>> = {
  'start-event': wrap('<circle cx="10" cy="10" r="7" />'),
  'end-event': wrap('<circle cx="10" cy="10" r="6.5" stroke-width="3" />'),
  task: wrap(box),
  'user-task': wrap(`${box}<circle cx="6.5" cy="7.4" r="1.3" stroke-width="1.1" /><path d="M4.4 11c0-1.4.9-2 2.1-2s2.1.6 2.1 2" stroke-width="1.1" />`),
  'manual-task': wrap(`${box}<path d="M4.5 11.5V8.6m1.4 2.4V7.3m1.4 3.7V7.6m1.3 3.4V8.4" stroke-width="1.1" />`),
  'service-task': wrap(`${box}<circle cx="6.6" cy="8.6" r="2.1" stroke-width="1.1" /><circle cx="6.6" cy="8.6" r="0.6" stroke-width="1" />`),
  'exclusive-gateway': wrap('<path d="M10 2.5 17.5 10 10 17.5 2.5 10Z" /><path d="m7.8 7.8 4.4 4.4m0-4.4-4.4 4.4" stroke-width="1.8" />'),
  pool: wrap('<rect x="2" y="4" width="16" height="12" rx="1" /><path d="M6 4v12" />'),
  lane: wrap('<rect x="2" y="4" width="16" height="12" rx="1" /><path d="M6 4v12M6 10h12" />'),
  'lane-above': wrap('<rect x="2" y="8" width="16" height="9" rx="1" /><path d="M6 8v9" /><path d="M12 2.5v4M10 4.5h4" />'),
  'lane-below': wrap('<rect x="2" y="3" width="16" height="9" rx="1" /><path d="M6 3v9" /><path d="M12 13.5v4M10 15.5h4" />'),
  connect: wrap('<path d="M3 16 15.5 4.5" /><path d="M9.5 4h6.5v6.5" />'),
  delete: wrap('<path d="M4 6h12M8 6V4h4v2m-6.5 0 .8 10h7.4l.8-10" /><path d="M8.6 9v4.5m2.8-4.5v4.5" />'),
}

export function iconSvg(icon: PadIcon): string {
  return ICONS[icon]
}
