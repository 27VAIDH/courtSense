import { useMemo } from 'react'
import Card from '@/components/ui/Card'
import type { Match } from '@/db/types'

interface RegularityStreakProps {
  matches: Match[]
}

function getWeekKey(d: Date): string {
  // ISO week: get the Thursday of the week to determine the week number
  const thu = new Date(d)
  thu.setDate(thu.getDate() - ((d.getDay() + 6) % 7) + 3)
  const year = thu.getFullYear()
  const jan4 = new Date(year, 0, 4)
  const weekNum = 1 + Math.round(((thu.getTime() - jan4.getTime()) / 86400000 - (jan4.getDay() + 6) % 7 + 3) / 7)
  return `${year}-W${weekNum}`
}

function getCurrentWeekKey(): string {
  return getWeekKey(new Date())
}

export default function RegularityStreak({ matches }: RegularityStreakProps) {
  const { currentStreak, streakBroken } = useMemo(() => {
    if (matches.length === 0) {
      return { currentStreak: 0, streakBroken: false }
    }

    // Collect unique weeks with matches
    const weeksWithMatches = new Set<string>()
    for (const m of matches) {
      weeksWithMatches.add(getWeekKey(new Date(m.date)))
    }

    // Walk backwards from current week to count consecutive weeks
    const now = new Date()
    let streak = 0
    let broken = false
    let checkDate = new Date(now)

    // Check current week first
    const currentWeek = getCurrentWeekKey()
    const hasCurrentWeek = weeksWithMatches.has(currentWeek)

    if (hasCurrentWeek) {
      streak = 1
      // Go back week by week
      checkDate = new Date(now)
      checkDate.setDate(checkDate.getDate() - 7)
      while (true) {
        const weekKey = getWeekKey(checkDate)
        if (weeksWithMatches.has(weekKey)) {
          streak++
          checkDate.setDate(checkDate.getDate() - 7)
        } else {
          break
        }
      }
    } else {
      // Current week has no match — check if last week had one (streak recently broken)
      checkDate = new Date(now)
      checkDate.setDate(checkDate.getDate() - 7)
      const lastWeekKey = getWeekKey(checkDate)

      if (weeksWithMatches.has(lastWeekKey)) {
        // Count the streak that ended last week
        streak = 1
        checkDate.setDate(checkDate.getDate() - 7)
        while (true) {
          const weekKey = getWeekKey(checkDate)
          if (weeksWithMatches.has(weekKey)) {
            streak++
            checkDate.setDate(checkDate.getDate() - 7)
          } else {
            break
          }
        }
        broken = true
      } else {
        // No recent activity at all — find most recent streak
        const sortedWeeks = [...weeksWithMatches].sort().reverse()
        if (sortedWeeks.length > 0) {
          streak = 1
          // Parse the most recent week and walk backwards
          const [yearStr, weekStr] = sortedWeeks[0].split('-W')
          const year = parseInt(yearStr)
          const week = parseInt(weekStr)
          // Approximate the Monday of that week
          const jan4 = new Date(year, 0, 4)
          const dayOffset = (jan4.getDay() + 6) % 7
          const refDate = new Date(year, 0, 4 - dayOffset + (week - 1) * 7)
          refDate.setDate(refDate.getDate() - 7)

          while (true) {
            const weekKey = getWeekKey(refDate)
            if (weeksWithMatches.has(weekKey)) {
              streak++
              refDate.setDate(refDate.getDate() - 7)
            } else {
              break
            }
          }
          broken = true
        }
      }
    }

    return { currentStreak: streak, streakBroken: broken }
  }, [matches])

  if (matches.length === 0) {
    return null
  }

  return (
    <Card>
      <h3 className="text-sm font-semibold text-text-primary mb-3">Regularity Streak</h3>

      <div className="flex items-center gap-3">
        <span className="text-4xl">{streakBroken ? '💔' : currentStreak >= 3 ? '🔥' : '📅'}</span>
        <div>
          {!streakBroken && currentStreak > 0 ? (
            <>
              <p className="text-xl font-bold text-text-primary">
                {currentStreak} week{currentStreak !== 1 ? 's' : ''} streak
              </p>
              <p className="text-xs text-text-secondary">
                {currentStreak >= 4
                  ? 'Incredible consistency — keep it going!'
                  : currentStreak >= 2
                    ? 'Great rhythm — keep it going!'
                    : 'Play this week to build your streak!'}
              </p>
            </>
          ) : streakBroken && currentStreak > 0 ? (
            <>
              <p className="text-xl font-bold text-text-primary">
                {currentStreak}-week streak ended
              </p>
              <p className="text-xs text-text-secondary">
                Start a new one today!
              </p>
            </>
          ) : (
            <>
              <p className="text-xl font-bold text-text-primary">No streak yet</p>
              <p className="text-xs text-text-secondary">
                Play at least once a week to build a streak!
              </p>
            </>
          )}
        </div>
      </div>

      {/* Week indicators - last 8 weeks */}
      <div className="flex gap-1.5 mt-4">
        {Array.from({ length: 8 }).map((_, i) => {
          const d = new Date()
          d.setDate(d.getDate() - (7 - i) * 7)
          // Shift so index 7 is current week
          const weekDate = new Date()
          weekDate.setDate(weekDate.getDate() - (7 - i) * 7)
          const wk = getWeekKey(weekDate)
          const hasMatch = matches.some((m) => getWeekKey(new Date(m.date)) === wk)
          const isCurrent = i === 7

          return (
            <div key={i} className="flex flex-col items-center gap-1 flex-1">
              <div
                className={`w-full h-2 rounded-full ${
                  hasMatch ? 'bg-primary' : 'bg-surface-elevated'
                } ${isCurrent ? 'ring-1 ring-primary/50' : ''}`}
              />
              {isCurrent && (
                <span className="text-[8px] text-text-secondary">Now</span>
              )}
            </div>
          )
        })}
      </div>
    </Card>
  )
}
