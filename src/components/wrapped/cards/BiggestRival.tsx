import { Match, Player } from '@/db/types'

interface BiggestRivalProps {
  matches: Match[]
  players: Player[]
}

export default function BiggestRival({ matches, players }: BiggestRivalProps) {
  // Find most-played opponent
  const opponentCounts = new Map<number, number>()
  matches.forEach((match) => {
    const count = opponentCounts.get(match.opponentId) || 0
    opponentCounts.set(match.opponentId, count + 1)
  })

  const [mostPlayedId] =
    Array.from(opponentCounts.entries()).sort((a, b) => b[1] - a[1])[0] || []

  const rival = players.find((p) => p.id === mostPlayedId)
  const rivalMatches = matches.filter((m) => m.opponentId === mostPlayedId)
  const wins = rivalMatches.filter((m) => m.result.startsWith('W')).length
  const losses = rivalMatches.length - wins

  // Fun stat: longest win/loss streak against this opponent
  let currentStreak = 0
  let maxStreak = 0
  let streakType = ''

  const sortedRivalMatches = [...rivalMatches].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )

  for (let i = sortedRivalMatches.length - 1; i >= 0; i--) {
    const isWin = sortedRivalMatches[i].result.startsWith('W')
    if (i === sortedRivalMatches.length - 1) {
      currentStreak = 1
      streakType = isWin ? 'W' : 'L'
    } else {
      const prevIsWin = sortedRivalMatches[i + 1].result.startsWith('W')
      if (isWin === prevIsWin) {
        currentStreak++
      } else {
        if (currentStreak > maxStreak) {
          maxStreak = currentStreak
        }
        currentStreak = 1
        streakType = isWin ? 'W' : 'L'
      }
    }
  }
  if (currentStreak > maxStreak) {
    maxStreak = currentStreak
  }

  const funStat = `Best streak: ${maxStreak} ${streakType === 'W' ? 'wins' : 'losses'} in a row`

  if (!rival) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-gradient-to-br from-[#232526] to-[#414345] p-8">
        <div className="text-center text-text-secondary">
          No rival data available
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col items-center justify-center bg-gradient-to-br from-[#232526] to-[#414345] p-8">
      <div className="mb-8 text-center">
        <h2 className="mb-2 text-4xl font-bold text-text-primary">
          Biggest Rival
        </h2>
      </div>

      {/* Opponent emoji */}
      <div className="mb-6 text-9xl">{rival.emoji}</div>

      {/* Opponent name */}
      <div className="mb-8 text-center">
        <div className="text-4xl font-bold text-primary">{rival.name}</div>
      </div>

      {/* H2H Record */}
      <div className="mb-6 rounded-2xl bg-surface p-6 text-center">
        <div className="text-sm text-text-secondary">Head-to-Head</div>
        <div className="mt-2 text-5xl font-bold">
          <span className="text-win">{wins}</span>
          <span className="text-text-secondary"> - </span>
          <span className="text-loss">{losses}</span>
        </div>
      </div>

      {/* Fun Stat */}
      <div className="rounded-2xl bg-surface-elevated px-6 py-4">
        <div className="text-lg text-text-primary">{funStat}</div>
      </div>

      {/* Watermark */}
      <div className="mt-8 text-sm text-text-secondary opacity-50">
        SquashIQ
      </div>
    </div>
  )
}
