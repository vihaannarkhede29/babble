import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { AccuracyDataPoint } from '../../lib/mockProgress'

interface AccuracyChartProps {
  data: AccuracyDataPoint[]
}

export function AccuracyChart({ data }: AccuracyChartProps) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1B3A2D20" />
          <XAxis dataKey="day" tick={{ fill: '#1B3A2D', fontSize: 12 }} />
          <YAxis
            domain={[0, 100]}
            tick={{ fill: '#1B3A2D', fontSize: 12 }}
            tickFormatter={(value) => `${value}%`}
          />
          <Tooltip
            formatter={(value) => [`${value}%`, 'Accuracy']}
            contentStyle={{
              borderRadius: 12,
              border: 'none',
              boxShadow: '0 4px 16px rgba(27,58,45,0.15)',
            }}
          />
          <Line
            type="monotone"
            dataKey="accuracy"
            stroke="#3BBFBF"
            strokeWidth={3}
            dot={{ fill: '#FFD166', stroke: '#1B3A2D', strokeWidth: 2, r: 5 }}
            activeDot={{ r: 7 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
