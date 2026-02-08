import { Match, Game, Player } from '@/db/types'

export interface LeaderboardEntry {
  playerId: number
  playerName: string
  playerEmoji: string
  value: string // Display value (e.g., "78%", "12 matches")
  numericValue: number // For sorting
}

export interface LeaderboardCategory {
  id: string
  name: string
  description: string
}

export const LEADERBOARD_CATEGORIES: LeaderboardCategory[] = [
  { id: 'overall', name: 'Overall Record', description: 'Win rate (min 5 matches)' },
  { id: 'iron-man', name: 'Iron Man', description: 'Matches this month' },
  { id: 'clutch', name: 'Clutch King', description: '8-8+ Index (min 5 tight games)' },
  { id: 'comeback', name: 'Comeback Kid', description: 'Wins after losing Game 1' },
  { id: 'hot-streak', name: 'Hot Streak', description: 'Current consecutive wins' },
  { id: 'consistency', name: 'Consistency Crown', description: 'Lowest win rate variance (min 20 matches)' },
  { id: 'improved', name: 'Most Improved', description: 'Win rate change (last 30d vs prior 30d)' },
  { id: 'rivalry', name: 'Rivalry Dominator', description: 'Best H2H vs most-played opponent' },
]

// Helper: Calculate win rate for a set of matches
function calculateWinRate(matches: Match[]): number {
  if (matches.length === 0) return 0
  const wins = matches.filter(m => m.result.startsWith('W')).length
  return (wins / matches.length) * 100
}

// Helper: Get games for a specific match
function getGamesForMatch(matchId: number, allGames: Game[]): Game[] {
  return allGames.filter(g => g.matchId === matchId)
}

// 1. Overall Record
export function calculateOverallRecord(
  playerId: number,
  matches: Match[],
  isCurrentUser: boolean
): LeaderboardEntry | null {
  const playerMatches = isCurrentUser
    ? matches
    : matches.filter(m => m.opponentId === playerId)

  if (playerMatches.length < 5) return null

  let wins = 0
  let total = playerMatches.length

  playerMatches.forEach(m => {
    const isWin = m.result.startsWith('W')
    // For opponents, invert the result
    wins += isCurrentUser ? (isWin ? 1 : 0) : (isWin ? 0 : 1)
  })

  const winRate = (wins / total) * 100

  return {
    playerId,
    playerName: '',
    playerEmoji: '',
    value: `${winRate.toFixed(0)}% (${wins}-${total - wins})`,
    numericValue: winRate,
  }
}

// 2. Iron Man (matches this calendar month)
export function calculateIronMan(
  playerId: number,
  matches: Match[],
  isCurrentUser: boolean
): LeaderboardEntry | null {
  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()

  const playerMatches = isCurrentUser
    ? matches
    : matches.filter(m => m.opponentId === playerId)

  const thisMonthMatches = playerMatches.filter(m => {
    const d = new Date(m.date)
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear
  })

  if (thisMonthMatches.length === 0) return null

  return {
    playerId,
    playerName: '',
    playerEmoji: '',
    value: `${thisMonthMatches.length} ${thisMonthMatches.length === 1 ? 'match' : 'matches'}`,
    numericValue: thisMonthMatches.length,
  }
}

// 3. Clutch King (8-8+ Index)
export function calculateClutchKing(
  playerId: number,
  matches: Match[],
  games: Game[],
  isCurrentUser: boolean
): LeaderboardEntry | null {
  const playerMatches = isCurrentUser
    ? matches
    : matches.filter(m => m.opponentId === playerId)

  const tightGames = games.filter(g => {
    const match = playerMatches.find(m => m.id === g.matchId)
    return match && g.isTight
  })

  if (tightGames.length < 5) return null

  let tightWins = 0
  tightGames.forEach(g => {
    const won = g.myScore > g.opponentScore
    // For opponents, invert
    tightWins += isCurrentUser ? (won ? 1 : 0) : (won ? 0 : 1)
  })

  const clutchIndex = (tightWins / tightGames.length) * 100

  return {
    playerId,
    playerName: '',
    playerEmoji: '',
    value: `${clutchIndex.toFixed(0)}% (${tightWins}/${tightGames.length})`,
    numericValue: clutchIndex,
  }
}

// 4. Comeback Kid (wins after losing Game 1)
export function calculateComebackKid(
  playerId: number,
  matches: Match[],
  games: Game[],
  isCurrentUser: boolean
): LeaderboardEntry | null {
  const playerMatches = isCurrentUser
    ? matches
    : matches.filter(m => m.opponentId === playerId)

  let lostGame1Count = 0
  let wonAfterLostGame1 = 0

  playerMatches.forEach(m => {
    const matchGames = getGamesForMatch(m.id!, games)
    const game1 = matchGames.find(g => g.gameNumber === 1)

    if (!game1) return

    const lostGame1 = game1.opponentScore > game1.myScore
    const wonMatch = m.result.startsWith('W')

    // For opponents, invert
    const actualLostGame1 = isCurrentUser ? lostGame1 : !lostGame1
    const actualWonMatch = isCurrentUser ? wonMatch : !wonMatch

    if (actualLostGame1) {
      lostGame1Count++
      if (actualWonMatch) wonAfterLostGame1++
    }
  })

  if (lostGame1Count === 0) return null

  return {
    playerId,
    playerName: '',
    playerEmoji: '',
    value: `${wonAfterLostGame1}/${lostGame1Count} comebacks`,
    numericValue: wonAfterLostGame1,
  }
}

// 5. Hot Streak (current consecutive wins)
export function calculateHotStreak(
  playerId: number,
  matches: Match[],
  isCurrentUser: boolean
): LeaderboardEntry | null {
  const playerMatches = isCurrentUser
    ? matches
    : matches.filter(m => m.opponentId === playerId)

  if (playerMatches.length === 0) return null

  // Sort by date descending (most recent first)
  const sorted = [...playerMatches].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  let streak = 0
  for (const m of sorted) {
    const won = m.result.startsWith('W')
    const actualWon = isCurrentUser ? won : !won

    if (actualWon) {
      streak++
    } else {
      break
    }
  }

  if (streak === 0) return null

  return {
    playerId,
    playerName: '',
    playerEmoji: '',
    value: `${streak} ${streak === 1 ? 'win' : 'wins'}`,
    numericValue: streak,
  }
}

// 6. Consistency Crown (lowest win rate standard deviation)
export function calculateConsistencyCrown(
  playerId: number,
  matches: Match[],
  isCurrentUser: boolean
): LeaderboardEntry | null {
  const playerMatches = isCurrentUser
    ? matches
    : matches.filter(m => m.opponentId === playerId)

  if (playerMatches.length < 20) return null

  // Sort by date and take last 20
  const sorted = [...playerMatches].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  const last20 = sorted.slice(0, 20)

  // Calculate rolling win rate for each position
  const winRates: number[] = []
  for (let i = 0; i < last20.length; i++) {
    const window = last20.slice(0, i + 1)
    let wins = 0
    window.forEach(m => {
      const won = m.result.startsWith('W')
      wins += isCurrentUser ? (won ? 1 : 0) : (won ? 0 : 1)
    })
    winRates.push((wins / window.length) * 100)
  }

  // Calculate standard deviation
  const mean = winRates.reduce((a, b) => a + b, 0) / winRates.length
  const variance = winRates.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / winRates.length
  const stdDev = Math.sqrt(variance)

  // Lower is better, so invert for display (100 - stdDev gives higher score for lower variance)
  const consistencyScore = Math.max(0, 100 - stdDev)

  return {
    playerId,
    playerName: '',
    playerEmoji: '',
    value: `${consistencyScore.toFixed(0)} consistency`,
    numericValue: consistencyScore,
  }
}

// 7. Most Improved (win rate change)
export function calculateMostImproved(
  playerId: number,
  matches: Match[],
  isCurrentUser: boolean
): LeaderboardEntry | null {
  const playerMatches = isCurrentUser
    ? matches
    : matches.filter(m => m.opponentId === playerId)

  const now = new Date()
  const thirtyDaysAgo = new Date(now)
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const sixtyDaysAgo = new Date(now)
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60)

  const last30 = playerMatches.filter(m => new Date(m.date) >= thirtyDaysAgo)
  const prior30 = playerMatches.filter(m => {
    const d = new Date(m.date)
    return d >= sixtyDaysAgo && d < thirtyDaysAgo
  })

  if (last30.length === 0 || prior30.length === 0) return null

  const last30WinRate = calculateWinRate(last30.map(m => ({
    ...m,
    result: isCurrentUser ? m.result : (m.result.startsWith('W') ? m.result.replace('W', 'L') : m.result.replace('L', 'W'))
  })))

  const prior30WinRate = calculateWinRate(prior30.map(m => ({
    ...m,
    result: isCurrentUser ? m.result : (m.result.startsWith('W') ? m.result.replace('W', 'L') : m.result.replace('L', 'W'))
  })))

  const improvement = last30WinRate - prior30WinRate

  return {
    playerId,
    playerName: '',
    playerEmoji: '',
    value: improvement >= 0 ? `+${improvement.toFixed(0)}%` : `${improvement.toFixed(0)}%`,
    numericValue: improvement,
  }
}

// 8. Rivalry Dominator (best H2H record vs most-played opponent)
export function calculateRivalryDominator(
  playerId: number,
  matches: Match[],
  isCurrentUser: boolean
): LeaderboardEntry | null {
  if (!isCurrentUser) {
    // For opponents, we can't easily determine their H2H records with other opponents
    // So we'll use their record against the current user
    const opponentMatches = matches.filter(m => m.opponentId === playerId)
    if (opponentMatches.length === 0) return null

    const losses = opponentMatches.filter(m => m.result.startsWith('W')).length
    const wins = opponentMatches.length - losses
    const winRate = (wins / opponentMatches.length) * 100

    return {
      playerId,
      playerName: '',
      playerEmoji: '',
      value: `${winRate.toFixed(0)}% vs You`,
      numericValue: winRate,
    }
  }

  // For current user, find most-played opponent
  const opponentMatchCounts = new Map<number, number>()
  matches.forEach(m => {
    opponentMatchCounts.set(m.opponentId, (opponentMatchCounts.get(m.opponentId) || 0) + 1)
  })

  if (opponentMatchCounts.size === 0) return null

  // Find most-played opponent
  let maxMatches = 0
  let mostPlayedOpponentId = 0
  opponentMatchCounts.forEach((count, oppId) => {
    if (count > maxMatches) {
      maxMatches = count
      mostPlayedOpponentId = oppId
    }
  })

  const h2hMatches = matches.filter(m => m.opponentId === mostPlayedOpponentId)
  const wins = h2hMatches.filter(m => m.result.startsWith('W')).length
  const winRate = (wins / h2hMatches.length) * 100

  return {
    playerId,
    playerName: '',
    playerEmoji: '',
    value: `${winRate.toFixed(0)}% vs top rival`,
    numericValue: winRate,
  }
}

// Generate leaderboard for a specific category
export function generateLeaderboard(
  category: string,
  currentUser: Player,
  opponents: Player[],
  matches: Match[],
  games: Game[]
): LeaderboardEntry[] {
  const entries: LeaderboardEntry[] = []

  // Calculate for current user
  let currentUserEntry: LeaderboardEntry | null = null
  switch (category) {
    case 'overall':
      currentUserEntry = calculateOverallRecord(currentUser.id!, matches, true)
      break
    case 'iron-man':
      currentUserEntry = calculateIronMan(currentUser.id!, matches, true)
      break
    case 'clutch':
      currentUserEntry = calculateClutchKing(currentUser.id!, matches, games, true)
      break
    case 'comeback':
      currentUserEntry = calculateComebackKid(currentUser.id!, matches, games, true)
      break
    case 'hot-streak':
      currentUserEntry = calculateHotStreak(currentUser.id!, matches, true)
      break
    case 'consistency':
      currentUserEntry = calculateConsistencyCrown(currentUser.id!, matches, true)
      break
    case 'improved':
      currentUserEntry = calculateMostImproved(currentUser.id!, matches, true)
      break
    case 'rivalry':
      currentUserEntry = calculateRivalryDominator(currentUser.id!, matches, true)
      break
  }

  if (currentUserEntry) {
    currentUserEntry.playerName = currentUser.name
    currentUserEntry.playerEmoji = currentUser.emoji
    entries.push(currentUserEntry)
  }

  // Calculate for each opponent
  opponents.forEach(opponent => {
    let opponentEntry: LeaderboardEntry | null = null

    switch (category) {
      case 'overall':
        opponentEntry = calculateOverallRecord(opponent.id!, matches, false)
        break
      case 'iron-man':
        opponentEntry = calculateIronMan(opponent.id!, matches, false)
        break
      case 'clutch':
        opponentEntry = calculateClutchKing(opponent.id!, matches, games, false)
        break
      case 'comeback':
        opponentEntry = calculateComebackKid(opponent.id!, matches, games, false)
        break
      case 'hot-streak':
        opponentEntry = calculateHotStreak(opponent.id!, matches, false)
        break
      case 'consistency':
        opponentEntry = calculateConsistencyCrown(opponent.id!, matches, false)
        break
      case 'improved':
        opponentEntry = calculateMostImproved(opponent.id!, matches, false)
        break
      case 'rivalry':
        opponentEntry = calculateRivalryDominator(opponent.id!, matches, false)
        break
    }

    if (opponentEntry) {
      opponentEntry.playerName = opponent.name
      opponentEntry.playerEmoji = opponent.emoji
      entries.push(opponentEntry)
    }
  })

  // Sort by numeric value (descending)
  entries.sort((a, b) => b.numericValue - a.numericValue)

  return entries
}
