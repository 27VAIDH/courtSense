import { Match, Game, Player } from '@/db/types'

interface HeadlineStatProps {
  matches: Match[]
  games: Game[]
  players: Player[]
}

export default function HeadlineStat({
  matches,
  players,
}: HeadlineStatProps) {
  // Find the standout stat
  let headline = ''
  let value = ''
  let emoji = '📈'

  // Calculate various stats
  const sortedMatches = [...matches].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )

  // 1. Highest win streak
  let currentStreak = 0
  let maxWinStreak = 0
  sortedMatches.reverse().forEach((match) => {
    if (match.result.startsWith('W')) {
      currentStreak++
      maxWinStreak = Math.max(maxWinStreak, currentStreak)
    } else {
      currentStreak = 0
    }
  })

  // 2. Most matches in a week
  const weekCounts = new Map<string, number>()
  matches.forEach((match) => {
    const date = new Date(match.date)
    const weekKey = getWeekKey(date)
    weekCounts.set(weekKey, (weekCounts.get(weekKey) || 0) + 1)
  })
  const maxMatchesInWeek = Math.max(...Array.from(weekCounts.values()), 0)

  // 3. Best opponent conquest (beat someone with losing record against them)
  const opponentRecords = new Map<number, { wins: number; total: number }>()
  matches.forEach((match) => {
    if (!opponentRecords.has(match.opponentId)) {
      opponentRecords.set(match.opponentId, { wins: 0, total: 0 })
    }
    const record = opponentRecords.get(match.opponentId)!
    record.total++
    if (match.result.startsWith('W')) {
      record.wins++
    }
  })

  let bestConquest = ''
  opponentRecords.forEach((record, opponentId) => {
    if (record.wins === 1 && record.total >= 3) {
      // First win against this opponent after multiple losses
      const opponent = players.find((p) => p.id === opponentId)
      if (opponent) {
        bestConquest = opponent.name
      }
    }
  })

  // Choose the best headline stat
  if (maxWinStreak >= 5) {
    headline = 'Unstoppable Streak'
    value = `${maxWinStreak} wins in a row`
    emoji = '🔥'
  } else if (maxMatchesInWeek >= 4) {
    headline = 'Court Warrior'
    value = `${maxMatchesInWeek} matches in one week`
    emoji = '💪'
  } else if (bestConquest) {
    headline = 'Giant Slayer'
    value = `First win vs ${bestConquest}`
    emoji = '🏆'
  } else if (maxWinStreak >= 3) {
    headline = 'Hot Streak'
    value = `${maxWinStreak} consecutive wins`
    emoji = '🔥'
  } else {
    // Fallback: total matches milestone
    headline = 'Building Momentum'
    value = `${matches.length} matches logged`
    emoji = '📊'
  }

  return (
    <div className="flex h-full flex-col items-center justify-center bg-gradient-to-br from-[#0F2027] via-[#203A43] to-[#2C5364] p-8">
      <div className="mb-8 text-center">
        <h2 className="mb-2 text-4xl font-bold text-text-primary">
          Your Headline
        </h2>
      </div>

      {/* Emoji */}
      <div className="mb-6 text-9xl">{emoji}</div>

      {/* Headline */}
      <div className="mb-4 text-center">
        <div className="text-5xl font-bold text-primary">{headline}</div>
      </div>

      {/* Value */}
      <div className="mb-8 rounded-2xl bg-surface/20 px-8 py-6 text-center backdrop-blur-sm">
        <div className="text-3xl font-semibold text-text-primary">{value}</div>
      </div>

      {/* Message */}
      <div className="rounded-2xl bg-surface-elevated px-6 py-4 text-center">
        <div className="text-lg text-text-secondary">
          Keep logging matches to see your story unfold
        </div>
      </div>

      {/* Watermark */}
      <div className="mt-8 text-sm text-text-secondary opacity-50">
        SquashIQ
      </div>
    </div>
  )
}

// Helper to get ISO week key
function getWeekKey(date: Date): string {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + 4 - (d.getDay() || 7))
  const yearStart = new Date(d.getFullYear(), 0, 1)
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
  return `${d.getFullYear()}-W${weekNo}`
}
