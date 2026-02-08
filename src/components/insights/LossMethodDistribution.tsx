import { useMemo } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import Card from '@/components/ui/Card'
import type { RallyAnalysis } from '@/db/types'

interface LossMethodDistributionProps {
  rallyAnalyses: RallyAnalysis[]
}

const MIN_ANALYSES = 5

const LOSS_METHOD_COLORS: Record<string, string> = {
  'Unforced errors': '#FF5252', // loss red
  'Opponent winners': '#FF6D00', // accent orange
  'Lost long rallies': '#448AFF', // secondary blue
  'Poor serves': '#FFD600', // tight yellow
  'Bad positioning': '#B0B0B0', // muted gray
}

const IMPROVEMENT_SUGGESTIONS: Record<string, string> = {
  'Unforced errors': 'Focus on consistency over power',
  'Opponent winners': 'Reduce unforced opportunities',
  'Lost long rallies': 'Work on fitness and stamina',
  'Poor serves': 'Practice serve placement and variety',
  'Bad positioning': 'Return to the T after each shot',
}

export default function LossMethodDistribution({
  rallyAnalyses,
}: LossMethodDistributionProps) {
  const stats = useMemo(() => {
    const methodCounts: Record<string, number> = {}

    for (const ra of rallyAnalyses) {
      if (ra.loseMethod) {
        methodCounts[ra.loseMethod] = (methodCounts[ra.loseMethod] || 0) + 1
      }
    }

    const total = Object.values(methodCounts).reduce((sum, c) => sum + c, 0)

    const chartData = Object.entries(methodCounts)
      .map(([method, count]) => ({
        name: method,
        value: count,
        percentage: total > 0 ? Math.round((count / total) * 100) : 0,
      }))
      .sort((a, b) => b.value - a.value)

    // Biggest loss method
    const biggest = chartData[0]

    return { chartData, total, biggest }
  }, [rallyAnalyses])

  // Locked state
  if (stats.total < MIN_ANALYSES) {
    const remaining = MIN_ANALYSES - stats.total

    return (
      <Card className="relative overflow-hidden">
        <div className="opacity-40">
          <h3 className="text-sm font-semibold text-text-primary mb-2">
            Loss Method Distribution
          </h3>
          <div className="flex items-center justify-center py-4">
            <div className="w-24 h-24 rounded-full bg-surface-elevated" />
          </div>
        </div>
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-surface/60">
          <span className="text-2xl mb-1">🔒</span>
          <p className="text-xs text-text-secondary text-center px-4">
            Add rally analysis to {remaining} more match{remaining !== 1 ? 'es' : ''} to unlock
          </p>
        </div>
      </Card>
    )
  }

  return (
    <Card>
      <h3 className="text-sm font-semibold text-text-primary mb-3">
        How You Lose Points
      </h3>
      <div className="flex items-start gap-4">
        {/* Donut chart */}
        <div className="w-28 h-28 flex-shrink-0 relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={stats.chartData}
                cx="50%"
                cy="50%"
                innerRadius={32}
                outerRadius={50}
                dataKey="value"
                strokeWidth={0}
              >
                {stats.chartData.map((entry, index) => (
                  <Cell
                    key={index}
                    fill={LOSS_METHOD_COLORS[entry.name] || '#B0B0B0'}
                  />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          {/* Center total */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-xs text-text-secondary">Total</div>
              <div className="text-lg font-bold text-text-primary">
                {stats.total}
              </div>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex-1 min-w-0 space-y-1.5">
          {stats.chartData.map((item) => (
            <div key={item.name} className="flex items-center gap-2">
              <div
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: LOSS_METHOD_COLORS[item.name] || '#B0B0B0' }}
              />
              <div className="flex-1 min-w-0 flex items-center justify-between gap-2">
                <span className="text-xs text-text-secondary truncate">
                  {item.name}
                </span>
                <span className="text-xs font-semibold text-text-primary flex-shrink-0">
                  {item.percentage}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Improvement suggestion for biggest loss method */}
      {stats.biggest && (
        <div className="mt-3 pt-3 border-t border-surface-elevated">
          <p className="text-xs text-text-secondary">
            <span className="font-semibold text-loss">
              {stats.biggest.name} ({stats.biggest.percentage}%)
            </span>
            {' — '}
            {IMPROVEMENT_SUGGESTIONS[stats.biggest.name] || 'Keep working on your game'}
          </p>
        </div>
      )}
    </Card>
  )
}
