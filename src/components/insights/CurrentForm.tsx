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

interface CurrentFormProps {
  matches: Match[]
}

const MIN_MATCHES = 10

export default function CurrentForm({ matches }: CurrentFormProps) {
  const stats = useMemo(() => {
    const sorted = [...matches].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    )

    const totalWins = matches.filter((m) => m.result.startsWith('W')).length
    const overallPct = Math.round((totalWins / matches.length) * 100)

    const last10 = sorted.slice(-10)
    const last10Wins = last10.filter((m) => m.result.startsWith('W')).length
    const last10Losses = last10.length - last10Wins
    const last10Pct = Math.round((last10Wins / last10.length) * 100)

    const overallRate = totalWins / matches.length // 0-1

    const data = last10.map((m, i) => ({
      index: i + 1,
      value: m.result.startsWith('W') ? 1 : 0,
      label: m.result.startsWith('W') ? 'W' : 'L',
    }))

    let trend: 'up' | 'down' | 'steady' = 'steady'
    if (last10Pct > overallPct + 10) trend = 'up'
    else if (last10Pct < overallPct - 10) trend = 'down'

    return {
      data,
      overallRate,
      overallPct,
      last10Wins,
      last10Losses,
      last10Pct,
      trend,
    }
  }, [matches])

  // Locked state
  if (matches.length < MIN_MATCHES) {
    const remaining = MIN_MATCHES - matches.length
    return (
      <Card className="relative overflow-hidden">
        <div className="opacity-40">
          <h3 className="text-sm font-semibold text-text-primary mb-2">
            Current Form
          </h3>
          <div className="h-20 flex items-center justify-center">
            <div className="w-full h-10 rounded bg-surface-elevated" />
          </div>
        </div>
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-surface/60">
          <span className="text-2xl mb-1">🔒</span>
          <p className="text-xs text-text-secondary text-center px-4">
            Log {remaining} more match{remaining !== 1 ? 'es' : ''} to unlock
          </p>
        </div>
      </Card>
    )
  }

  const { data, overallRate, overallPct, last10Wins, last10Losses, last10Pct, trend } =
    stats

  const trendLabel =
    trend === 'up'
      ? 'On an upswing!'
      : trend === 'down'
        ? 'In a dip'
        : 'Steady'

  const trendColor =
    trend === 'up' ? '#00E676' : trend === 'down' ? '#FF5252' : '#FFD600'

  return (
    <Card>
      <h3 className="text-sm font-semibold text-text-primary mb-3">
        Current Form
      </h3>

      {/* Screen reader description */}
      <div className="sr-only">
        Your current form shows {last10Wins} wins and {last10Losses} losses in your last 10 matches,
        for a {last10Pct}% win rate compared to your overall {overallPct}% win rate.
        Your form is {trendLabel.toLowerCase()}.
      </div>

      <div className="w-full h-24" aria-hidden="true">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
            <XAxis dataKey="index" hide />
            <YAxis domain={[0, 1]} hide />

            {/* Shaded areas relative to overall win rate line */}
            <ReferenceArea
              y1={overallRate}
              y2={1}
              fill="#00E676"
              fillOpacity={0.06}
            />
            <ReferenceArea
              y1={0}
              y2={overallRate}
              fill="#FF5252"
              fillOpacity={0.06}
            />

            {/* Overall win rate dashed reference line */}
            <ReferenceLine
              y={overallRate}
              stroke="#B0B0B0"
              strokeDasharray="4 4"
              strokeWidth={1}
            />

            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null
                const d = payload[0].payload as (typeof data)[0]
                return (
                  <div className="bg-surface-elevated rounded-lg px-2 py-1 text-xs">
                    <span className={d.value === 1 ? 'text-win' : 'text-loss'}>
                      {d.label}
                    </span>
                  </div>
                )
              }}
            />

            <Line
              type="monotone"
              dataKey="value"
              stroke="#00E676"
              strokeWidth={2}
              dot={(props: Record<string, unknown>) => {
                const { cx, cy, payload } = props as {
                  cx: number
                  cy: number
                  payload: (typeof data)[0]
                }
                const isWin = payload.value === 1
                return (
                  <circle
                    key={payload.index}
                    cx={cx}
                    cy={cy}
                    r={4}
                    fill={isWin ? '#00E676' : '#FF5252'}
                    stroke="none"
                  />
                )
              }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Summary text */}
      <p className="text-xs text-text-secondary mt-2">
        Last 10: {last10Wins}W-{last10Losses}L ({last10Pct}%) vs overall: {overallPct}%
      </p>

      {/* Trend label */}
      <span className="text-xs font-bold mt-1 inline-block" style={{ color: trendColor }}>
        {trendLabel}
      </span>
    </Card>
  )
}
