import { db } from '@/db/database'
import type { Match } from '@/db/types'

const SAMPLE_OPPONENTS = ['Parth', 'Hemang', 'Sarah', 'Mike']
const SAMPLE_VENUES = [
  { name: 'Downtown Sports Club', location: 'Downtown' },
  { name: 'Elite Squash Center', location: 'Midtown' },
  { name: 'City Fitness Squash Courts', location: 'Uptown' },
]

const SAMPLE_TAGS = ['tournament', 'practice', 'league', 'friendly']

/**
 * Generates 20 realistic sample matches with varied opponents, dates, scores, and tags.
 * All sample data is flagged with sample_data: true for easy deletion.
 */
export async function generateSampleData(): Promise<void> {
  const now = Date.now()

  // Create sample opponents (players)
  const opponentIds: number[] = []
  for (const name of SAMPLE_OPPONENTS) {
    const id = await db.players.add({
      name,
      emoji: '🎾', // Default emoji for sample opponents
      isCurrentUser: false,
      createdAt: new Date(),
      sample_data: true,
    })
    opponentIds.push(id)
  }

  // Create sample venues
  const venueIds: number[] = []
  for (const venue of SAMPLE_VENUES) {
    const id = await db.venues.add({
      name: venue.name,
      isHome: venue.location === 'Downtown', // Mark first venue as home
      createdAt: new Date(),
      sample_data: true,
    })
    venueIds.push(id)
  }

  // Generate 20 realistic matches
  for (let i = 0; i < 20; i++) {
    const opponentId = opponentIds[Math.floor(Math.random() * opponentIds.length)]
    const venueId = venueIds[Math.floor(Math.random() * venueIds.length)]

    // Random date within last 90 days
    const randomDaysAgo = Math.floor(Math.random() * 90)
    const matchDate = new Date(now - randomDaysAgo * 24 * 60 * 60 * 1000)

    // Random result (60% win rate for positive UX)
    const isWin = Math.random() < 0.6
    const userScore = isWin ? 3 : Math.floor(Math.random() * 3) // 3 or 0-2
    const opponentScore = isWin ? Math.floor(Math.random() * 3) : 3 // 0-2 or 3

    // Energy level as string (Low/Medium/High)
    const energyLevels: Array<'Low' | 'Medium' | 'High'> = ['Low', 'Medium', 'High']
    const energy = energyLevels[Math.floor(Math.random() * 3)]

    // Random format (mostly Bo5, some Bo3)
    const format: 'Bo3' | 'Bo5' = Math.random() < 0.7 ? 'Bo5' : 'Bo3'

    // Random tags (0-2 tags per match)
    const numTags = Math.floor(Math.random() * 3)
    const tags: string[] = []
    for (let j = 0; j < numTags; j++) {
      const tag = SAMPLE_TAGS[Math.floor(Math.random() * SAMPLE_TAGS.length)]
      if (!tags.includes(tag)) {
        tags.push(tag)
      }
    }

    // Format result string: "W 3-1" or "L 1-3"
    const result = `${isWin ? 'W' : 'L'} ${userScore}-${opponentScore}`

    const match: Omit<Match, 'id'> = {
      date: matchDate, // Date object, not string
      opponentId: opponentId,
      venueId: venueId,
      format: format,
      result: result,
      energyLevel: energy,
      tags: tags,
      note: '',
      createdAt: matchDate,
      sample_data: true, // Critical flag for cleanup
    }

    const matchId = await db.matches.add(match)

    // Generate realistic game scores
    const totalGames = userScore + opponentScore
    for (let gameNum = 1; gameNum <= totalGames; gameNum++) {
      const userWonGame = gameNum <= userScore
      const myScore = userWonGame ? 11 : Math.floor(Math.random() * 10) // 11 or 0-9
      const opponentGameScore = userWonGame ? Math.floor(Math.random() * 10) : 11

      // Determine if game is tight (both scored 9 or more)
      const isTight = myScore >= 9 && opponentGameScore >= 9

      await db.games.add({
        matchId: matchId,
        gameNumber: gameNum,
        myScore: myScore,
        opponentScore: opponentGameScore,
        isTight: isTight,
        sample_data: true,
      })
    }
  }
}

/**
 * Deletes all records flagged with sample_data: true.
 */
export async function clearSampleData(): Promise<void> {
  // Delete in reverse order of foreign key dependencies
  await db.games.where('sample_data').equals(1).delete()
  await db.matches.where('sample_data').equals(1).delete()
  await db.players.where('sample_data').equals(1).delete()
  await db.venues.where('sample_data').equals(1).delete()
}

/**
 * Checks if any sample data exists in the database.
 */
export async function hasSampleData(): Promise<boolean> {
  const count = await db.matches.where('sample_data').equals(1).count()
  return count > 0
}
