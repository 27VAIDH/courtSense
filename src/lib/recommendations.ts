import type { Match, Game } from '@/db/types'

export interface Recommendation {
  emoji: string
  headline: string
  context: string
}

export function generateRecommendation(
  matches: Match[],
  games: Game[],
  currentMatch: Match
): Recommendation {
  // Sort matches by date descending (most recent first)
  const sorted = [...matches].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )

  // Build a games-by-match lookup
  const gamesByMatch = new Map<number, Game[]>()
  for (const g of games) {
    const existing = gamesByMatch.get(g.matchId) ?? []
    existing.push(g)
    gamesByMatch.set(g.matchId, existing)
  }

  const currentIsWin = currentMatch.result.startsWith('W')

  // Rule 1: Slow starter — Lost Game 1 in 3+ of last 5 matches
  const last5 = sorted.slice(0, 5)
  if (last5.length >= 3) {
    let game1Losses = 0
    let game1LossWins = 0
    for (const m of last5) {
      const mGames = gamesByMatch.get(m.id!) ?? []
      const g1 = mGames.find((g) => g.gameNumber === 1)
      if (g1 && g1.myScore > 0 && g1.opponentScore > 0 && g1.opponentScore > g1.myScore) {
        game1Losses++
        if (m.result.startsWith('W')) game1LossWins++
      }
    }
    if (game1Losses >= 3) {
      return {
        emoji: '\u{1F680}',
        headline: 'Start faster next time',
        context: `You lost Game 1 in ${game1Losses} of your last ${last5.length} matches but still won ${game1LossWins} of those. Imagine your record if you also took Game 1.`,
      }
    }
  }

  // Rule 2: Low energy loss — Last match tagged Low energy AND result is loss
  if (currentMatch.energyLevel === 'Low' && !currentIsWin) {
    return {
      emoji: '\u{1F50B}',
      headline: 'Energy first today',
      context:
        'Last match you tagged low energy and lost. Hydrate and warm up properly.',
    }
  }

  // Rule 3: Tight game struggles — Won <40% of tight games in last 10 games
  const allGamesSorted = [...games].sort((a, b) => {
    const aMatch = matches.find((m) => m.id === a.matchId)
    const bMatch = matches.find((m) => m.id === b.matchId)
    if (!aMatch || !bMatch) return 0
    return new Date(bMatch.date).getTime() - new Date(aMatch.date).getTime()
  })
  const last10Games = allGamesSorted.slice(0, 10)
  const tightGames = last10Games.filter((g) => g.isTight)
  if (tightGames.length > 0) {
    const tightWins = tightGames.filter((g) => g.myScore > g.opponentScore).length
    const tightWinRate = (tightWins / tightGames.length) * 100
    if (tightWinRate < 40) {
      return {
        emoji: '\u{1F9CA}',
        headline: 'Simplify in tight moments',
        context: `Your tight game win rate is ${Math.round(tightWinRate)}%. Go with your most confident shot when it matters.`,
      }
    }
  }

  // Rule 4: Win streak 3+ — Won 3+ consecutive matches
  let winStreak = 0
  for (const m of sorted) {
    if (m.result.startsWith('W')) winStreak++
    else break
  }
  if (winStreak >= 3) {
    return {
      emoji: '\u{1F525}',
      headline: 'Ride the wave',
      context: `You are on a ${winStreak}-match win streak. Stay focused on process, not outcome.`,
    }
  }

  // Rule 5: Loss streak 3+ — Lost 3+ consecutive matches
  let lossStreak = 0
  for (const m of sorted) {
    if (m.result.startsWith('L')) lossStreak++
    else break
  }
  if (lossStreak >= 3) {
    return {
      emoji: '\u{1F504}',
      headline: 'Reset and refocus',
      context:
        'Every match is a fresh start. What felt good last time you won?',
    }
  }

  // Rule 6: Opponent-specific — Played same opponent 3+ times and losing >60%
  const opponentMatches = sorted.filter(
    (m) => m.opponentId === currentMatch.opponentId
  )
  if (opponentMatches.length >= 3) {
    const losses = opponentMatches.filter((m) => m.result.startsWith('L')).length
    const lossRate = (losses / opponentMatches.length) * 100
    if (lossRate > 60) {
      const wins = opponentMatches.length - losses
      return {
        emoji: '\u{1F500}',
        headline: 'Mix it up',
        context: `Your record against them is ${wins}-${losses}. They may have figured out your pattern.`,
      }
    }
  }

  // Rule 7: Fallback
  const totalWins = matches.filter((m) => m.result.startsWith('W')).length
  const winRate = matches.length > 0 ? (totalWins / matches.length) * 100 : 0

  if (winRate > 50) {
    return {
      emoji: '\u{1F4AA}',
      headline: 'Keep building',
      context: `Your overall form is strong at ${Math.round(winRate)}%. Stay consistent.`,
    }
  }

  return {
    emoji: '\u{1F4C8}',
    headline: 'Progress takes time',
    context: 'Every match is a data point. You are learning.',
  }
}
