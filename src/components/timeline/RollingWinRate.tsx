import { useMemo } from 'react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  ReferenceLine,
  ReferenceArea,
  Tooltip,
} from 'recharts'
import Card from '@/components/ui/Card'
import type { Match } from '@/db/types'

interface RollingWinRateProps {
  matches: Match[]
}

interface DataPoint {
  index: number
  date: string
  winRate: number
}

const WINDOW_SIZE = 10

function formatShortDate(date: Date): string {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${months[date.getMonth()]} ${date.getDate()}`
}

export default function RollingWinRate({ matches }: RollingWinRateProps) {
  const data = useMemo(() => {
    if (matches.length < WINDOW_SIZE) return []

    const sorted = [...matches].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    )

    const points: DataPoint[] = []

    for (let i = WINDOW_SIZE - 1; i < sorted.length; i++) {
      const window = sorted.slice(i - WINDOW_SIZE + 1, i + 1)
      const wins = window.filter((m) => m.result.startsWith('W')).length
      const winRate = Math.round((wins / WINDOW_SIZE) * 100)

      points.push({
        index: i + 1,
        date: formatShortDate(new Date(sorted[i].date)),
        winRate,
      })
    }

    return points
  }, [matches])

  if (matches.length < WINDOW_SIZE) {
    const remaining = WINDOW_SIZE - matches.length
    return (
      <Card>
        <h3 className="text-sm font-semibold text-text-primary mb-2">Rolling Win Rate</h3>
        <div className="flex flex-col items-center py-6 opacity-50">
          <span className="text-3xl mb-2">🔒</span>
          <p className="text-xs text-text-secondary text-center">
            Log {remaining} more match{remaining !== 1 ? 'es' : ''} to unlock
          </p>
          <div className="w-full bg-surface rounded-full h-1.5 mt-3 max-w-[200px]">
            <div
              className="bg-primary h-1.5 rounded-full"
              style={{ width: `${(matches.length / WINDOW_SIZE) * 100}%` }}
            />
          </div>
        </div>
      </Card>
    )
  }

  if (data.length === 0) {
    return (
      <Card>
        <h3 className="text-sm font-semibold text-text-primary mb-2">Rolling Win Rate</h3>
        <p className="text-xs text-text-secondary">No matches in this time range.</p>
      </Card>
    )
  }

  return (
    <Card>
      <h3 className="text-sm font-semibold text-text-primary mb-3">Rolling Win Rate</h3>

      <div className="w-full h-56">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
            <defs>
              <linearGradient id="rwrGreenGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#00E676" stopOpacity={0.15} />
                <stop offset="100%" stopColor="#00E676" stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id="rwrRedGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FF5252" stopOpacity={0.05} />
                <stop offset="100%" stopColor="#FF5252" stopOpacity={0.15} />
              </linearGradient>
            </defs>

            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: '#B0B0B0' }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fontSize: 10, fill: '#B0B0B0' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v: number) => `${v}%`}
            />

            {/* Shaded areas above/below 50% */}
            <ReferenceArea
              y1={50}
              y2={100}
              fill="url(#rwrGreenGrad)"
              fillOpacity={1}
              ifOverflow="hidden"
            />
            <ReferenceArea
              y1={0}
              y2={50}
              fill="url(#rwrRedGrad)"
              fillOpacity={1}
              ifOverflow="hidden"
            />

            <ReferenceLine
              y={50}
              stroke="#B0B0B0"
              strokeDasharray="4 4"
              strokeWidth={1}
              label={{
                value: '50%',
                position: 'right',
                fill: '#B0B0B0',
                fontSize: 10,
              }}
            />

            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null
                const d = payload[0].payload as DataPoint
                const above = d.winRate >= 50
                return (
                  <div className="bg-surface-elevated rounded-lg px-3 py-2 text-xs shadow-lg border border-white/10">
                    <p className="text-text-secondary mb-1">{d.date}</p>
                    <p className={`font-bold ${above ? 'text-win' : 'text-loss'}`}>
                      {d.winRate}%
                    </p>
                    <p className="text-text-secondary">Last {WINDOW_SIZE} matches</p>
                  </div>
                )
              }}
            />

            <Line
              type="monotone"
              dataKey="winRate"
              stroke="#00E676"
              strokeWidth={2}
              dot={(props: Record<string, unknown>) => {
                const { cx, cy, payload } = props as {
                  cx: number
                  cy: number
                  payload: DataPoint
                }
                const above = payload.winRate >= 50
                return (
                  <circle
                    key={payload.index}
                    cx={cx}
                    cy={cy}
                    r={3}
                    fill={above ? '#00E676' : '#FF5252'}
                    stroke="none"
                  />
                )
              }}
              activeDot={{ r: 5, stroke: '#fff', strokeWidth: 1 }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <p className="text-xs text-text-secondary mt-2">
        Win rate over a rolling window of {WINDOW_SIZE} matches
      </p>
    </Card>
  )
}
