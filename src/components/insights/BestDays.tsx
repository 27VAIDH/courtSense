import { useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, Cell, ResponsiveContainer } from 'recharts'
import Card from '@/components/ui/Card'
import type { Match } from '@/db/types'

interface BestDaysProps {
  matches: Match[]
}

interface DayStat {
  day: string
  dayFull: string
  wins: number
  losses: number
  total: number
  winRate: number
}

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const DAY_FULL = [
  'Mondays',
  'Tuesdays',
  'Wednesdays',
  'Thursdays',
  'Fridays',
  'Saturdays',
  'Sundays',
]

const MIN_TOTAL_MATCHES = 10

export default function BestDays({ matches }: BestDaysProps) {
  const { data, bestDay } = useMemo(() => {
    const stats: DayStat[] = DAY_LABELS.map((day, i) => ({
      day,
      dayFull: DAY_FULL[i],
      wins: 0,
      losses: 0,
      total: 0,
      winRate: 0,
    }))

    for (const m of matches) {
      const date = new Date(m.date)
      // getDay() returns 0=Sun, 1=Mon, ..., 6=Sat
      // Convert to Mon=0, Tue=1, ..., Sun=6
      const jsDay = date.getDay()
      const idx = jsDay === 0 ? 6 : jsDay - 1
      const isWin = m.result.startsWith('W')
      stats[idx].total++
      if (isWin) stats[idx].wins++
      else stats[idx].losses++
    }

    for (const s of stats) {
      s.winRate = s.total > 0 ? Math.round((s.wins / s.total) * 100) : 0
    }

    // Find best performing day (only among days with matches)
    let best: DayStat | null = null
    for (const s of stats) {
      if (s.total > 0 && (best === null || s.winRate > best.winRate)) {
        best = s
      }
    }

    return { data: stats, bestDay: best }
  }, [matches])

  // Locked state
  if (matches.length < MIN_TOTAL_MATCHES) {
    const remaining = MIN_TOTAL_MATCHES - matches.length

    return (
      <Card className="relative overflow-hidden">
        <div className="opacity-40">
          <h3 className="text-sm font-semibold text-text-primary mb-2">
            Best Days
          </h3>
          <div className="flex items-end justify-between gap-1 h-20 px-2">
            {DAY_LABELS.map((d) => (
              <div key={d} className="flex flex-col items-center gap-1 flex-1">
                <div
                  className="w-full rounded-t bg-surface-elevated"
                  style={{ height: `${20 + Math.random() * 40}px` }}
                />
                <span className="text-[10px] text-text-secondary">{d}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-surface/60">
          <span className="text-2xl mb-1">🔒</span>
          <p className="text-xs text-text-secondary text-center px-4">
            Log {remaining} more match{remaining !== 1 ? 'es' : ''} to unlock
          </p>
          {/* Progress bar */}
          <div className="w-32 h-1.5 rounded-full bg-surface-elevated mt-2 overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{
                width: `${(matches.length / MIN_TOTAL_MATCHES) * 100}%`,
              }}
            />
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card>
      <h3 className="text-sm font-semibold text-text-primary mb-1">
        Best Days
      </h3>
      {bestDay && bestDay.winRate > 0 && (
        <p className="text-xs text-accent font-semibold mb-2">
          {bestDay.dayFull}: {bestDay.winRate}%
        </p>
      )}
      <ResponsiveContainer width="100%" height={100}>
        <BarChart
          data={data}
          margin={{ top: 4, right: 0, left: 0, bottom: 0 }}
        >
          <XAxis
            dataKey="day"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 10, fill: '#B0B0B0' }}
          />
          <YAxis hide domain={[0, 100]} />
          <Bar dataKey="winRate" radius={[4, 4, 0, 0]} maxBarSize={28}>
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={
                  entry.total === 0
                    ? '#242424'
                    : bestDay && entry.day === bestDay.day
                      ? '#FF6D00'
                      : '#00E676'
                }
                opacity={
                  entry.total === 0
                    ? 0.5
                    : 0.6 + (entry.winRate / 100) * 0.4
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Card>
  )
}
