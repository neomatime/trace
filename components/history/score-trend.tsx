import { Tooltip } from '@/components/ui/tooltip'

export function ScoreTrend() {
  const points = [58, 64, 64, 64, 68, 76, 78, 85]
  const dates = ['Sep 2025','Nov 2025','Dec 2025','Feb 2026','Mar 2026','May 2026','Jul 2026','Aug 2026']
  const coordinates = points.map((score, index) => ({ x: 12 + index * 30, y: 78 - score * 0.55 }))
  const line = coordinates.map(({ x, y }) => `${x},${y}`).join(' ')
  const area = `12,84 ${line} 222,84`

  return (
    <div>
      <div className="mb-1 flex justify-between text-[10px] text-muted-foreground"><span>100</span></div>
      <svg viewBox="0 0 234 94" className="h-28 w-full" role="img" aria-label="Average score increased from 58 to 85">
        {[20, 40, 60, 80].map((y) => <line key={y} x1="12" x2="222" y1={y} y2={y} stroke="var(--border)" strokeWidth="1" />)}
        <defs>
          <linearGradient id="history-score-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="var(--brand)" stopOpacity="0.22" />
            <stop offset="1" stopColor="var(--brand)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon points={area} fill="url(#history-score-area)" />
        <polyline points={line} fill="none" stroke="var(--brand)" strokeWidth="2" />
        {coordinates.map(({ x, y }, index) => <Tooltip key={dates[index]} content={<><span className="block font-semibold">Average assessment score</span><span className="block text-white/75">{dates[index]} · {points[index]}/100{index>0?` · ${points[index]-points[index-1]>=0?'+':''}${points[index]-points[index-1]} change`:''}</span></>}><circle cx={x} cy={y} r="3.5" fill="var(--brand)" tabIndex={0} aria-label={`${dates[index]} score ${points[index]} out of 100`} className="cursor-help outline-none" /></Tooltip>)}
      </svg>
      <div className="flex justify-between text-[10px] text-muted-foreground"><span>Sep 2025</span><span>Nov 2025</span><span>Feb 2026</span><span>May 2026</span><span>Aug 2026</span></div>
    </div>
  )
}
