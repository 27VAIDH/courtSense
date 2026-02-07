import { useState, useMemo } from 'react'
import Card from '@/components/ui/Card'
import type { Match, Player } from '@/db/types'

interface ActivityHeatmapProps {
  matches: Match[]
  playersMap: Map<number, Player>
}

const DAY_LABELS = ['Mon', '', 'Wed', '', 'Fri', '', 'Sun']
const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function dateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function getMonday(d: Date): Date {
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  const mon = new Date(d.getFullYear(), d.getMonth(), d.getDate() + diff)
  return mon
}

function cellColor(count: number): string {
  if (count === 0) return 'bg-surface-elevated'
  if (count === 1) return 'bg-primary/30'
  return 'bg-primary/70'
}

export default function ActivityHeatmap({ matches, playersMap }: ActivityHeatmapProps) {
  const [tooltip, setTooltip] = useState<{ key: string; x: number; y: number } | null>(null)

  // Build a map of date -> matches for last 3 months
  const { grid, monthLabels, matchesByDate } = useMemo(() => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    // Go back ~13 weeks (91 days) to fill 3 months
    const startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 90)
    // Align to Monday
    const gridStart = getMonday(startDate)

    // Build match map
    const byDate = new Map<string, Match[]>()
    for (const m of matches) {
      const d = new Date(m.date)
      const k = dateKey(d)
      const arr = byDate.get(k) || []
      arr.push(m)
      byDate.set(k, arr)
    }

    // Build grid: columns = weeks, rows = days (Mon=0 .. Sun=6)
    const weeks: { date: Date; key: string; count: number }[][] = []
    let currentDate = new Date(gridStart)

    while (currentDate <= today) {
      const week: { date: Date; key: string; count: number }[] = []
      for (let dayIdx = 0; dayIdx < 7; dayIdx++) {
        const cellDate = new Date(currentDate)
        const k = dateKey(cellDate)
        const count = cellDate <= today ? (byDate.get(k)?.length || 0) : -1
        week.push({ date: cellDate, key: k, count })
        currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() + 1)
      }
      weeks.push(week)
    }

    // Month labels positioned above the week columns
    const labels: { label: string; weekIdx: number }[] = []
    let lastMonth = -1
    for (let w = 0; w < weeks.length; w++) {
      // Use the Monday of each week to determine the month
      const monday = weeks[w][0].date
      const month = monday.getMonth()
      if (month !== lastMonth) {
        labels.push({ label: MONTHS_SHORT[month], weekIdx: w })
        lastMonth = month
      }
    }

    return { grid: weeks, monthLabels: labels, matchesByDate: byDate }
  }, [matches])

  const tooltipData = useMemo(() => {
    if (!tooltip) return null
    const dayMatches = matchesByDate.get(tooltip.key) || []
    const d = new Date(tooltip.key + 'T00:00:00')
    return {
      date: `${MONTHS_SHORT[d.getMonth()]} ${d.getDate()}`,
      matches: dayMatches.map((m) => {
        const opponent = playersMap.get(m.opponentId)
        const name = opponent ? `${opponent.emoji} ${opponent.name}` : 'Unknown'
        const isWin = m.result.startsWith('W')
        return { name, result: m.result, isWin }
      }),
    }
  }, [tooltip, matchesByDate, playersMap])

  if (matches.length === 0) {
    return (
      <Card>
        <h3 className="text-sm font-semibold text-text-primary mb-2">Activity</h3>
        <div className="flex flex-col items-center py-6">
          <div className="grid grid-cols-13 gap-[3px] opacity-30 mb-4">
            {Array.from({ length: 91 }).map((_, i) => (
              <div key={i} className="w-[10px] h-[10px] rounded-[2px] bg-surface-elevated" />
            ))}
          </div>
          <p className="text-xs text-text-secondary text-center">
            Your activity will appear here as you log matches
          </p>
        </div>
      </Card>
    )
  }

  const CELL_SIZE = 12
  const CELL_GAP = 3

  return (
    <Card className="relative">
      <h3 className="text-sm font-semibold text-text-primary mb-3">Activity</h3>

      {/* Month labels */}
      <div className="flex ml-8 mb-1" style={{ gap: `${CELL_GAP}px` }}>
        {(() => {
          const items: React.ReactNode[] = []
          let lastWeek = 0
          for (const { label, weekIdx } of monthLabels) {
            const gap = weekIdx - lastWeek
            if (gap > 0 && items.length > 0) {
              items.push(
                <span
                  key={`gap-${weekIdx}`}
                  style={{ width: `${gap * (CELL_SIZE + CELL_GAP) - CELL_GAP}px` }}
                />
              )
            } else if (items.length > 0) {
              // no gap needed
            }
            items.push(
              <span key={`label-${weekIdx}`} className="text-[10px] text-text-secondary">
                {label}
              </span>
            )
            lastWeek = weekIdx + 1
          }
          return items
        })()}
      </div>

      {/* Heatmap grid */}
      <div className="overflow-x-auto scrollbar-hide -mx-4 px-4">
        <div className="flex">
          {/* Day labels */}
          <div className="flex flex-col mr-2 shrink-0" style={{ gap: `${CELL_GAP}px` }}>
            {DAY_LABELS.map((label, i) => (
              <div
                key={i}
                className="text-[10px] text-text-secondary flex items-center justify-end"
                style={{ height: `${CELL_SIZE}px`, width: '24px' }}
              >
                {label}
              </div>
            ))}
          </div>

          {/* Grid cells */}
          <div className="flex" style={{ gap: `${CELL_GAP}px` }}>
            {grid.map((week, wIdx) => (
              <div key={wIdx} className="flex flex-col" style={{ gap: `${CELL_GAP}px` }}>
                {week.map((cell, dIdx) => (
                  <div
                    key={dIdx}
                    className={`rounded-[2px] ${cell.count < 0 ? 'invisible' : cellColor(cell.count)}`}
                    style={{ width: `${CELL_SIZE}px`, height: `${CELL_SIZE}px` }}
                    onClick={(e) => {
                      if (cell.count < 0) return
                      const rect = e.currentTarget.getBoundingClientRect()
                      setTooltip(
                        tooltip?.key === cell.key
                          ? null
                          : { key: cell.key, x: rect.left + rect.width / 2, y: rect.top }
                      )
                    }}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-end gap-1 mt-3">
        <span className="text-[10px] text-text-secondary mr-1">Less</span>
        <div className="w-[10px] h-[10px] rounded-[2px] bg-surface-elevated" />
        <div className="w-[10px] h-[10px] rounded-[2px] bg-primary/30" />
        <div className="w-[10px] h-[10px] rounded-[2px] bg-primary/70" />
        <span className="text-[10px] text-text-secondary ml-1">More</span>
      </div>

      {/* Tooltip */}
      {tooltip && tooltipData && (
        <div
          className="absolute z-10 bg-surface-elevated rounded-lg px-3 py-2 text-xs shadow-lg border border-white/10"
          style={{
            bottom: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            marginBottom: '8px',
            minWidth: '150px',
          }}
          onClick={() => setTooltip(null)}
        >
          <p className="text-text-secondary mb-1 font-medium">{tooltipData.date}</p>
          {tooltipData.matches.length === 0 ? (
            <p className="text-text-secondary">No matches</p>
          ) : (
            tooltipData.matches.map((m, i) => (
              <div key={i} className="flex justify-between gap-2">
                <span className="text-text-primary">{m.name}</span>
                <span className={m.isWin ? 'text-win font-bold' : 'text-loss font-bold'}>
                  {m.result}
                </span>
              </div>
            ))
          )}
        </div>
      )}
    </Card>
  )
}
