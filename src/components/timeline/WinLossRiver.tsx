import { useMemo } from 'react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ReferenceLine,
  Tooltip,
  ReferenceDot,
} from 'recharts'
import Card from '@/components/ui/Card'
import type { Match, Player } from '@/db/types'
import type { Milestone } from '@/lib/milestones'

interface WinLossRiverProps {
  matches: Match[]
  playersMap: Map<number, Player>
  milestones?: Milestone[]
}

interface DataPoint {
  index: number
  momentum: number
  date: string
  opponent: string
  result: string
}

function formatShortDate(date: Date): string {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${months[date.getMonth()]} ${date.getDate()}`
}

export default function WinLossRiver({ matches, playersMap, milestones = [] }: WinLossRiverProps) {
  const data = useMemo(() => {
    const sorted = [...matches].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    )

    let momentum = 0
    return sorted.map((m, i): DataPoint => {
      const isWin = m.result.startsWith('W')
      momentum += isWin ? 1 : -1
      const opponent = playersMap.get(m.opponentId)
      return {
        index: i + 1,
        momentum,
        date: formatShortDate(new Date(m.date)),
        opponent: opponent ? `${opponent.emoji} ${opponent.name}` : 'Unknown',
        result: m.result,
      }
    })
  }, [matches, playersMap])

  if (data.length === 0) {
    return (
      <Card>
        <h3 className="text-sm font-semibold text-text-primary mb-2">Win/Loss River</h3>
        <p className="text-xs text-text-secondary">No matches in this time range.</p>
      </Card>
    )
  }

  const minMomentum = Math.min(...data.map((d) => d.momentum))
  const maxMomentum = Math.max(...data.map((d) => d.momentum))
  const absMax = Math.max(Math.abs(minMomentum), Math.abs(maxMomentum), 1)
  const domainPadding = Math.ceil(absMax * 0.2) || 1
  const yMin = Math.min(minMomentum, 0) - domainPadding
  const yMax = Math.max(maxMomentum, 0) + domainPadding

  return (
    <Card>
      <h3 className="text-sm font-semibold text-text-primary mb-3">Win/Loss River</h3>

      <div className="w-full h-56">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
            <defs>
              <linearGradient id="greenGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#00E676" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#00E676" stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id="redGrad" x1="0" y1="1" x2="0" y2="0">
                <stop offset="0%" stopColor="#FF5252" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#FF5252" stopOpacity={0.05} />
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
              domain={[yMin, yMax]}
              tick={{ fontSize: 10, fill: '#B0B0B0' }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />

            <ReferenceLine y={0} stroke="#B0B0B0" strokeDasharray="4 4" strokeWidth={1} />

            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null
                const d = payload[0].payload as DataPoint
                const isWin = d.result.startsWith('W')
                return (
                  <div className="bg-surface-elevated rounded-lg px-3 py-2 text-xs shadow-lg border border-white/10">
                    <p className="text-text-secondary mb-1">{d.date}</p>
                    <p className="text-text-primary font-medium">{d.opponent}</p>
                    <p className={isWin ? 'text-win font-bold' : 'text-loss font-bold'}>
                      {d.result}
                    </p>
                  </div>
                )
              }}
            />

            {/* Green area for positive momentum */}
            <Area
              type="monotone"
              dataKey={(d: DataPoint) => (d.momentum >= 0 ? d.momentum : 0)}
              stroke="none"
              fill="url(#greenGrad)"
              fillOpacity={1}
              baseValue={0}
              isAnimationActive={false}
            />

            {/* Red area for negative momentum */}
            <Area
              type="monotone"
              dataKey={(d: DataPoint) => (d.momentum < 0 ? d.momentum : 0)}
              stroke="none"
              fill="url(#redGrad)"
              fillOpacity={1}
              baseValue={0}
              isAnimationActive={false}
            />

            {/* Main line */}
            <Area
              type="monotone"
              dataKey="momentum"
              stroke="#00E676"
              strokeWidth={2}
              fill="none"
              dot={(props: Record<string, unknown>) => {
                const { cx, cy, payload } = props as {
                  cx: number
                  cy: number
                  payload: DataPoint
                }
                const isWin = payload.result.startsWith('W')
                return (
                  <circle
                    key={payload.index}
                    cx={cx}
                    cy={cy}
                    r={3}
                    fill={isWin ? '#00E676' : '#FF5252'}
                    stroke="none"
                  />
                )
              }}
              activeDot={{ r: 5, stroke: '#fff', strokeWidth: 1 }}
            />

            {/* Milestone markers */}
            {milestones.map((milestone, idx) => {
              const matchIndex = milestone.matchIndex
              if (matchIndex === undefined || matchIndex >= data.length) return null
              const dataPoint = data[matchIndex]
              return (
                <ReferenceDot
                  key={`milestone-${idx}`}
                  x={dataPoint.index}
                  y={dataPoint.momentum}
                  r={8}
                  fill="#FF6D00"
                  stroke="#FFFFFF"
                  strokeWidth={2}
                  opacity={0.9}
                />
              )
            })}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <p className="text-xs text-text-secondary mt-2">
        Momentum: +1 for each win, -1 for each loss
      </p>
    </Card>
  )
}
