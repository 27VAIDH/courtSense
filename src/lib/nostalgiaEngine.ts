import type { Match, Game, Player } from '@/db/types'

export interface MatchOfTheMonth {
  match: Match
  score: number
  title: string
  emoji: string
}

export interface OnThisDay {
  match: Match
  yearsAgo: number
  description: string
}

/**
 * Calculate a drama score for a match
 * - Closest total score difference: +3 points
 * - Most games played: +2 points
 * - Upset win (beat opponent you lose to >50%): +2 points
 * - Comeback (won after losing Game 1): +1 point
 */
function calculateDramaScore(
  match: Match,
  games: Game[],
  matches: Match[],
): number {
  let score = 0

  // Parse match result to get games won/lost
  const resultMatch = match.result.match(/(\d+)-(\d+)/)
  if (!resultMatch) return 0
  const [_, gamesWon, gamesLost] = resultMatch
  const myGames = parseInt(gamesWon.startsWith('W') ? gamesWon.slice(2) : gamesLost.slice(2), 10)
  const oppGames = parseInt(gamesWon.startsWith('W') ? gamesLost : gamesWon.slice(2), 10)
  const totalGames = myGames + oppGames

  // Most games played: +2 if format max reached (5 for Bo5, 3 for Bo3)
  const maxGames = match.format === 'Bo5' ? 5 : 3
  if (totalGames === maxGames) {
    score += 2
  }

  // Calculate total score difference from games
  const matchGames = games.filter((g) => g.matchId === match.id)
  let totalScoreDiff = 0
  for (const game of matchGames) {
    totalScoreDiff += Math.abs(game.myScore - game.opponentScore)
  }

  // Closest total score difference: +3 if average diff <= 2 points per game
  const avgDiff = totalScoreDiff / matchGames.length
  if (avgDiff <= 2) {
    score += 3
  }

  // Check for upset: did we win this match but lose >50% against this opponent overall?
  if (match.result.startsWith('W')) {
    const h2hMatches = matches.filter((m) => m.opponentId === match.opponentId)
    const h2hWins = h2hMatches.filter((m) => m.result.startsWith('W')).length
    const h2hWinRate = h2hWins / h2hMatches.length
    if (h2hWinRate < 0.5) {
      score += 2
    }
  }

  // Check for comeback: won after losing Game 1
  const game1 = matchGames.find((g) => g.gameNumber === 1)
  if (game1 && game1.opponentScore > game1.myScore && match.result.startsWith('W')) {
    score += 1
  }

  return score
}

/**
 * Generate a dramatic title for a match
 */
function generateMatchTitle(_match: Match, opponent: Player | undefined, venue: string | undefined): string {
  // If we have opponent, use their name
  if (opponent) {
    const titles = [
      `The ${opponent.name} Thriller`,
      `The ${opponent.name} Classic`,
      `The ${opponent.name} Showdown`,
      `The ${opponent.name} Battle`,
    ]
    return titles[Math.floor(Math.random() * titles.length)]
  }

  // If we have venue, use that
  if (venue) {
    const titles = [
      `The ${venue} Thriller`,
      `The ${venue} Classic`,
      `The ${venue} Showdown`,
    ]
    return titles[Math.floor(Math.random() * titles.length)]
  }

  // Fallback
  return 'The Epic Match'
}

/**
 * Select the most dramatic match from the current or most recent month
 * Returns null if fewer than 4 matches in the month
 */
export function getMatchOfTheMonth(
  matches: Match[],
  games: Game[],
  players: Player[],
  venues: { id?: number; name: string }[],
): MatchOfTheMonth | null {
  if (matches.length === 0) return null

  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()

  // Get matches from current month
  let monthMatches = matches.filter((m) => {
    const d = new Date(m.date)
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear
  })

  // If fewer than 4, try previous month
  if (monthMatches.length < 4) {
    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1
    const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear
    monthMatches = matches.filter((m) => {
      const d = new Date(m.date)
      return d.getMonth() === prevMonth && d.getFullYear() === prevYear
    })
  }

  // Still not enough matches
  if (monthMatches.length < 4) return null

  // Calculate drama scores
  const scored = monthMatches.map((m) => ({
    match: m,
    score: calculateDramaScore(m, games, matches),
  }))

  // Find the highest scoring match
  scored.sort((a, b) => b.score - a.score)
  const winner = scored[0]

  if (!winner || winner.score === 0) return null

  // Generate title and emoji
  const opponent = players.find((p) => p.id === winner.match.opponentId)
  const venue = venues.find((v) => v.id === winner.match.venueId)
  const title = generateMatchTitle(winner.match, opponent, venue?.name)

  // Pick emoji based on result
  const emoji = winner.match.result.startsWith('W') ? '🏆' : '⚔️'

  return {
    match: winner.match,
    score: winner.score,
    title,
    emoji,
  }
}

/**
 * Check if any match occurred on this day in a previous year (1, 3, 6, or 12 months ago)
 */
export function getOnThisDay(matches: Match[]): OnThisDay | null {
  if (matches.length === 0) return null

  const now = new Date()
  const today = now.getDate()

  // Check 1, 3, 6, 12 months ago
  const intervals = [1, 3, 6, 12]

  for (const monthsAgo of intervals) {
    // Calculate target month/year
    const targetDate = new Date(now)
    targetDate.setMonth(now.getMonth() - monthsAgo)
    const targetMonth = targetDate.getMonth()
    const targetYear = targetDate.getFullYear()

    // Find match on this day/month/year
    const match = matches.find((m) => {
      const d = new Date(m.date)
      return d.getDate() === today && d.getMonth() === targetMonth && d.getFullYear() === targetYear
    })

    if (match) {
      return {
        match,
        yearsAgo: monthsAgo,
        description: formatOnThisDayDescription(match, monthsAgo),
      }
    }
  }

  return null
}

function formatOnThisDayDescription(_match: Match, monthsAgo: number): string {
  const unit = monthsAgo === 1 ? 'month' : 'months'
  return `${monthsAgo} ${unit} ago today`
}
