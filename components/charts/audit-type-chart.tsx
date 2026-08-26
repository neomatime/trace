import { Tooltip } from '@/components/ui/tooltip'

export type DonutSegment = {
  label: string
  value: number
  color: string
}

export function DonutChart({
  data,
  size = 96,
  thickness = 16,
}: {
  data: DonutSegment[]
  size?: number
  thickness?: number
}) {
  const total = data.reduce((sum, d) => sum + d.value, 0) || 1
  const radius = (size - thickness) / 2
  const circumference = 2 * Math.PI * radius
  const center = size / 2

  const gap = 2 // px gap between segments

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0" role="img" aria-label={data.map(item=>`${item.label}: ${item.value}`).join(', ')}>
      <g transform={`rotate(-90 ${center} ${center})`}>
        {data.map((d, i) => {
          const fraction = d.value / total
          const length = fraction * circumference
          const dash = Math.max(length - gap, 0)
          const offset = data
            .slice(0, i)
            .reduce((sum, previous) => sum + (previous.value / total) * circumference, 0)
          return (
            <Tooltip key={i} content={<><span className="block font-semibold">{d.label}</span><span className="block text-white/75">{d.value} · {Math.round(fraction*100)}% of total</span></>}>
              <circle cx={center} cy={center} r={radius} fill="none" stroke={d.color} strokeWidth={thickness} strokeDasharray={`${dash} ${circumference - dash}`} strokeDashoffset={-offset} tabIndex={0} aria-label={`${d.label}: ${d.value}, ${Math.round(fraction*100)} percent of total`} className="cursor-help outline-none transition-opacity hover:opacity-80 focus:opacity-80" />
            </Tooltip>
          )
        })}
      </g>
    </svg>
  )
}

export function DonutLegend({
  data,
}: {
  data: (DonutSegment & { display?: string })[]
}) {
  return (
    <ul className="flex flex-col gap-1.5 text-[10px]">
      {data.map((d, i) => (
        <li key={i} className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-2 whitespace-nowrap text-foreground">
            <span
              className="size-2 shrink-0 rounded-full"
              style={{ backgroundColor: d.color }}
            />
            {d.label}
          </span>
          <span className="whitespace-nowrap text-muted-foreground">{d.display}</span>
        </li>
      ))}
    </ul>
  )
}
