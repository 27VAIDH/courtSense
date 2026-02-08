import type { Match, Game } from '@/db/types'

export type BadgeRarity = 'Common' | 'Rare' | 'Epic' | 'Legendary'

export interface Badge {
  id: string
  name: string
  emoji: string
  rarity: BadgeRarity
  description: string
  criteriaText: string
}

export interface EarnedBadge extends Badge {
  earnedAt: Date
}

export const ALL_BADGES: Badge[] = [
  {
    id: 'ice-veins',
    name: 'Ice Veins',
    emoji: '🧊',
    rarity: 'Rare',
    description: 'Won 5+ tight games in a row',
    criteriaText: 'Win 5 consecutive tight games',
  },
  {
    id: 'clutch-king',
    name: 'Clutch King',
    emoji: '👑',
    rarity: 'Epic',
    description: '8-8+ Index above 80 for 10+ tight games',
    criteriaText: 'Maintain 80%+ win rate across 10+ tight games',
  },
  {
    id: 'comeback-artist',
    name: 'Comeback Artist',
    emoji: '🎭',
    rarity: 'Legendary',
    description: 'Won match after being down 0-2 with at least one tight game',
    criteriaText: 'Win a match after losing the first 2 games (with a tight game)',
  },
  {
    id: 'heartbreaker',
    name: 'Heartbreaker',
    emoji: '💔',
    rarity: 'Rare',
    description: 'Won 3+ tight games in a single Bo5 match',
    criteriaText: 'Win 3 or more tight games in one Best of 5 match',
  },
  {
    id: 'pressure-cooker',
    name: 'Pressure Cooker',
    emoji: '🔥',
    rarity: 'Common',
    description: 'Played 5+ tight games in one week',
    criteriaText: 'Play at least 5 tight games within a 7-day period',
  },
]

/**
 * Check which badges a user has earned based on their match/game data
 */
export function checkBadges(matches: Match[], games: Game[]): EarnedBadge[] {
  const earnedBadges: EarnedBadge[] = []

  // Helper: get all tight games sorted by date
  const getTightGames = () => {
    const matchMap = new Map(matches.map((m) => [m.id!, m]))
    return games
      .filter((g) => g.isTight)
      .map((g) => ({ game: g, match: matchMap.get(g.matchId)! }))
      .filter((item) => item.match)
      .sort(
        (a, b) => a.match.date.getTime() - b.match.date.getTime()
      )
  }

  // Helper: check if won a tight game
  const wonTightGame = (game: Game) => game.myScore > game.opponentScore

  // 1. Ice Veins — 5+ consecutive tight game wins
  const tightGames = getTightGames()
  let maxConsecutiveTightWins = 0
  let currentStreak = 0
  let iceVeinsDate: Date | null = null

  for (const { game, match } of tightGames) {
    if (wonTightGame(game)) {
      currentStreak++
      if (currentStreak >= 5 && !iceVeinsDate) {
        iceVeinsDate = match.date
      }
      maxConsecutiveTightWins = Math.max(maxConsecutiveTightWins, currentStreak)
    } else {
      currentStreak = 0
    }
  }

  if (maxConsecutiveTightWins >= 5 && iceVeinsDate) {
    earnedBadges.push({
      ...ALL_BADGES.find((b) => b.id === 'ice-veins')!,
      earnedAt: iceVeinsDate,
    })
  }

  // 2. Clutch King — 8-8+ Index above 80 for 10+ tight games
  const tightGameWins = tightGames.filter(({ game }) => wonTightGame(game)).length
  const tightGameCount = tightGames.length
  const clutchIndex = tightGameCount > 0 ? (tightGameWins / tightGameCount) * 100 : 0

  if (tightGameCount >= 10 && clutchIndex >= 80) {
    // Date is when they reached 10th tight game
    const tenthTightGame = tightGames[9]
    earnedBadges.push({
      ...ALL_BADGES.find((b) => b.id === 'clutch-king')!,
      earnedAt: tenthTightGame.match.date,
    })
  }

  // 3. Comeback Artist — Won match after 0-2 down with at least one tight game
  for (const match of matches) {
    const matchGames = games
      .filter((g) => g.matchId === match.id)
      .sort((a, b) => a.gameNumber - b.gameNumber)

    if (matchGames.length >= 3) {
      const game1Lost = matchGames[0].myScore < matchGames[0].opponentScore
      const game2Lost = matchGames[1].myScore < matchGames[1].opponentScore
      const matchWon = match.result.startsWith('W')
      const hasTightGame = matchGames.some((g) => g.isTight)

      if (game1Lost && game2Lost && matchWon && hasTightGame) {
        earnedBadges.push({
          ...ALL_BADGES.find((b) => b.id === 'comeback-artist')!,
          earnedAt: match.date,
        })
        break // only need to earn once
      }
    }
  }

  // 4. Heartbreaker — 3+ tight games won in a single Bo5 match
  for (const match of matches) {
    if (match.format !== 'Bo5') continue

    const matchGames = games.filter((g) => g.matchId === match.id)
    const tightGamesWon = matchGames.filter((g) => g.isTight && wonTightGame(g)).length

    if (tightGamesWon >= 3) {
      earnedBadges.push({
        ...ALL_BADGES.find((b) => b.id === 'heartbreaker')!,
        earnedAt: match.date,
      })
      break // only need to earn once
    }
  }

  // 5. Pressure Cooker — 5+ tight games in one week
  const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000

  for (let i = 0; i < tightGames.length; i++) {
    const startDate = tightGames[i].match.date.getTime()
    let count = 0
    let lastDate: Date | null = null

    for (let j = i; j < tightGames.length; j++) {
      const currentDate = tightGames[j].match.date.getTime()
      if (currentDate - startDate <= ONE_WEEK_MS) {
        count++
        lastDate = tightGames[j].match.date
      } else {
        break
      }
    }

    if (count >= 5 && lastDate) {
      earnedBadges.push({
        ...ALL_BADGES.find((b) => b.id === 'pressure-cooker')!,
        earnedAt: lastDate,
      })
      break // only need to earn once
    }
  }

  return earnedBadges
}
