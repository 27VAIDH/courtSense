import type { Match } from '@/db/types'

export type MilestoneType =
  | 'first_win'
  | 'win_streak'
  | 'match_count'
  | 'win_rate_threshold'
  | 'h2h_flip'

export interface Milestone {
  type: MilestoneType
  title: string
  date: Date
  icon: string
  description: string
  matchIndex?: number // Index in sorted match array for chart positioning
}

/**
 * Detects milestones from match and game data.
 * Milestones include:
 * - First win against each opponent
 * - Win streaks of 3+
 * - Match count milestones (10, 25, 50, 100)
 * - Win rate crossing 50%/60%/70% (sustained over 5+ matches)
 * - Head-to-head record flipping against an opponent
 */
export function detectMilestones(matches: Match[]): Milestone[] {
  if (matches.length === 0) return []

  const milestones: Milestone[] = []

  // Sort matches chronologically
  const sorted = [...matches].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  )

  // Track state as we iterate
  const opponentFirstWin = new Map<number, boolean>()
  const opponentH2H = new Map<number, { wins: number; losses: number }>()
  let currentStreak = 0
  let streakType: 'W' | 'L' | null = null
  let totalWins = 0
  const rollingWinRates: number[] = []

  sorted.forEach((match, index) => {
    const isWin = match.result.startsWith('W')
    const matchDate = new Date(match.date)

    // Update totals
    if (isWin) totalWins++

    // 1. First win against opponent
    if (isWin && !opponentFirstWin.has(match.opponentId)) {
      opponentFirstWin.set(match.opponentId, true)
      milestones.push({
        type: 'first_win',
        title: `First Win vs Opponent`,
        date: matchDate,
        icon: '🎯',
        description: `Your first victory in this rivalry`,
        matchIndex: index,
      })
    }

    // 2. Win streaks of 3+
    if (isWin) {
      if (streakType === 'W') {
        currentStreak++
      } else {
        currentStreak = 1
        streakType = 'W'
      }

      if (currentStreak === 3 || currentStreak === 5 || currentStreak === 10) {
        milestones.push({
          type: 'win_streak',
          title: `${currentStreak}-Match Win Streak`,
          date: matchDate,
          icon: currentStreak >= 10 ? '🔥' : currentStreak >= 5 ? '🌟' : '⚡',
          description: `${currentStreak} consecutive wins`,
          matchIndex: index,
        })
      }
    } else {
      currentStreak = 0
      streakType = 'L'
    }

    // 3. Match count milestones
    const matchCount = index + 1
    if ([10, 25, 50, 100].includes(matchCount)) {
      milestones.push({
        type: 'match_count',
        title: `${matchCount} Matches Played`,
        date: matchDate,
        icon: matchCount >= 100 ? '💯' : matchCount >= 50 ? '🏆' : '🎉',
        description: `Reached ${matchCount} total matches`,
        matchIndex: index,
      })
    }

    // 4. Win rate thresholds (sustained over 5+ matches)
    if (index >= 4) {
      // Need at least 5 matches
      const winRate = (totalWins / matchCount) * 100
      rollingWinRates.push(winRate)

      // Check if just crossed a threshold
      const prevWinRate = (totalWins - (isWin ? 1 : 0)) / index
      const thresholds = [50, 60, 70]

      for (const threshold of thresholds) {
        if (winRate >= threshold && prevWinRate * 100 < threshold) {
          milestones.push({
            type: 'win_rate_threshold',
            title: `${threshold}% Win Rate`,
            date: matchDate,
            icon: threshold >= 70 ? '👑' : threshold >= 60 ? '🌟' : '📈',
            description: `Win rate crossed ${threshold}%`,
            matchIndex: index,
          })
        }
      }
    }

    // 5. Head-to-head record flipping
    const h2h = opponentH2H.get(match.opponentId) || { wins: 0, losses: 0 }
    const prevWins = h2h.wins
    const prevLosses = h2h.losses

    if (isWin) {
      h2h.wins++
    } else {
      h2h.losses++
    }
    opponentH2H.set(match.opponentId, h2h)

    // Check if H2H record just flipped
    const totalMatches = h2h.wins + h2h.losses
    if (totalMatches >= 3) {
      // Need at least 3 matches for meaningful flip
      const prevAhead = prevWins > prevLosses
      const nowAhead = h2h.wins > h2h.losses
      const prevBehind = prevWins < prevLosses
      const nowBehind = h2h.wins < h2h.losses

      if (!prevAhead && nowAhead) {
        milestones.push({
          type: 'h2h_flip',
          title: `H2H Lead Gained`,
          date: matchDate,
          icon: '🔄',
          description: `Took the lead in this rivalry`,
          matchIndex: index,
        })
      } else if (!prevBehind && nowBehind) {
        // Optional: track when we lose the lead (could be demotivating, so excluding for now)
      }
    }
  })

  return milestones
}
