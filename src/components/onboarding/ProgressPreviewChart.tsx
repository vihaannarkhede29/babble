import { motion } from 'framer-motion'

interface ProgressPreviewChartProps {
  childName: string
}

const points = [
  { label: 'Wk 1', value: 28 },
  { label: 'Wk 2', value: 34 },
  { label: 'Wk 3', value: 42 },
  { label: 'Wk 4', value: 53 },
  { label: 'Wk 5', value: 67 },
  { label: 'Wk 6', value: 84 },
]

const chartWidth = 280
const chartHeight = 100
const padding = { left: 8, right: 8, top: 8, bottom: 24 }

function toCoords(index: number, value: number) {
  const innerW = chartWidth - padding.left - padding.right
  const innerH = chartHeight - padding.top - padding.bottom
  const x = padding.left + (index / (points.length - 1)) * innerW
  const y = padding.top + innerH - (value / 100) * innerH
  return { x, y }
}

function buildSmoothLinePath(coords: { x: number; y: number }[]): string {
  if (coords.length === 0) return ''
  if (coords.length === 1) return `M ${coords[0].x} ${coords[0].y}`

  let path = `M ${coords[0].x} ${coords[0].y}`

  for (let i = 0; i < coords.length - 1; i++) {
    const current = coords[i]
    const next = coords[i + 1]
    const midX = (current.x + next.x) / 2
    path += ` C ${midX} ${current.y}, ${midX} ${next.y}, ${next.x} ${next.y}`
  }

  return path
}

function buildAreaPath(linePath: string, coords: { x: number; y: number }[]): string {
  const baseline = chartHeight - padding.bottom
  const last = coords[coords.length - 1]
  const first = coords[0]
  return `${linePath} L ${last.x} ${baseline} L ${first.x} ${baseline} Z`
}

export function ProgressPreviewChart({ childName }: ProgressPreviewChartProps) {
  const coords = points.map((point, index) => toCoords(index, point.value))
  const linePath = buildSmoothLinePath(coords)
  const areaPath = buildAreaPath(linePath, coords)

  const title = childName.trim()
    ? `${childName}'s potential`
    : 'Your child\'s potential'

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.55, duration: 0.45 }}
      className="mt-6 rounded-2xl border-2 border-forest/10 bg-white p-4 shadow-[0_2px_12px_rgba(27,58,45,0.06)]"
    >
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-sm font-black text-forest">{title}</p>
          <p className="text-xs font-semibold text-forest/50">
            Phoneme accuracy with steady practice
          </p>
        </div>
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 1.2, type: 'spring', stiffness: 300 }}
          className="rounded-full bg-sunshine/30 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-forest/70"
        >
          Potential
        </motion.span>
      </div>

      <svg
        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
        className="w-full"
        aria-hidden="true"
      >
        {[25, 50, 75].map((tick) => {
          const y =
            padding.top +
            (chartHeight - padding.top - padding.bottom) -
            (tick / 100) * (chartHeight - padding.top - padding.bottom)
          return (
            <line
              key={tick}
              x1={padding.left}
              x2={chartWidth - padding.right}
              y1={y}
              y2={y}
              stroke="#1B3A2D"
              strokeOpacity={0.08}
              strokeDasharray="4 4"
            />
          )
        })}

        <motion.path
          d={areaPath}
          fill="url(#progressGradient)"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9, duration: 0.6 }}
        />

        <motion.path
          d={linePath}
          fill="none"
          stroke="#3BBFBF"
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ delay: 0.7, duration: 1.2, ease: 'easeOut' }}
        />

        {points.map((point, index) => {
          const { x, y } = coords[index]

          return (
            <g key={point.label}>
              <motion.circle
                cx={x}
                cy={y}
                r={5}
                fill="#FFD166"
                stroke="#1B3A2D"
                strokeWidth={1.5}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.85 + index * 0.1, type: 'spring', stiffness: 400 }}
              />
              <text
                x={x}
                y={chartHeight - 4}
                textAnchor="middle"
                className="fill-forest/45 text-[9px] font-bold"
                style={{ fontFamily: 'Nunito, sans-serif' }}
              >
                {point.label.replace('Wk ', '')}
              </text>
            </g>
          )
        })}

        <defs>
          <linearGradient id="progressGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3BBFBF" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#3BBFBF" stopOpacity={0.02} />
          </linearGradient>
        </defs>
      </svg>

      <p className="mt-2 text-center text-[10px] font-semibold text-forest/40">
        Illustrative potential — not a guarantee
      </p>
    </motion.div>
  )
}
