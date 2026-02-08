import { Match } from '@/db/types'
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Area } from 'recharts'

interface WinRateJourneyProps {
  matches: Match[]
}

export default function WinRateJourney({ matches }: WinRateJourneyProps) {
  // Calculate rolling win rate (10-match window)
  const sortedMatches = [...matches].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  )

  const chartData = sortedMatches.slice(9).map((_, index) => {
    const window = sortedMatches.slice(index, index + 10)
    const wins = window.filter((m) => m.result.startsWith('W')).length
    const winRate = (wins / 10) * 100

    return {
      index: index + 10,
      winRate,
    }
  })

  const currentWinRate =
    (sortedMatches.filter((m) => m.result.startsWith('W')).length /
      sortedMatches.length) *
    100

  return (
    <div className="flex h-full flex-col items-center justify-center bg-gradient-to-br from-[#0F2027] via-[#203A43] to-[#2C5364] p-8">
      <div className="mb-8 text-center">
        <h2 className="mb-2 text-4xl font-bold text-text-primary">
          Win Rate
        </h2>
        <h3 className="text-2xl font-bold text-primary">Journey</h3>
      </div>

      {/* Current Win Rate */}
      <div className="mb-8 text-center">
        <div className="text-7xl font-bold text-primary">
          {currentWinRate.toFixed(0)}%
        </div>
        <div className="mt-2 text-lg text-text-secondary">Current Win Rate</div>
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <defs>
                <linearGradient id="winRateGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00E676" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#00E676" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="index" hide />
              <YAxis domain={[0, 100]} hide />
              <Area
                type="monotone"
                dataKey="winRate"
                stroke="none"
                fill="url(#winRateGradient)"
              />
              <Line
                type="monotone"
                dataKey="winRate"
                stroke="#00E676"
                strokeWidth={3}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="mt-8 text-center text-text-secondary">
        {chartData.length > 0
          ? 'Your 10-match rolling average'
          : 'Keep playing to see your journey!'}
      </div>

      {/* Watermark */}
      <div className="mt-8 text-sm text-text-secondary opacity-50">
        SquashIQ
      </div>
    </div>
  )
}
