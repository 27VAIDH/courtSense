import { db } from '@/db/database'
import { supabase } from './supabase'

const BATCH_SIZE = 50

interface MigrationProgress {
  onProgress: (current: number, total: number, step: string) => void
  onError: (error: string) => void
}

interface IdMapping {
  players: Map<number, string> // local ID -> server UUID
  venues: Map<number, string>
  matches: Map<number, string>
}

export async function checkIfMigrationNeeded(userId: string): Promise<boolean> {
  try {
    // Check if user has any matches in Supabase
    const { data, error } = await supabase
      .from('matches')
      .select('id')
      .eq('user_id', userId)
      .limit(1)

    if (error) throw error

    // If no server data exists, check if local data exists
    if (!data || data.length === 0) {
      const localMatchCount = await db.matches.count()
      return localMatchCount > 0
    }

    return false
  } catch (error) {
    console.error('Error checking migration status:', error)
    return false
  }
}

export async function getTotalRecordsToMigrate(): Promise<number> {
  try {
    const [playerCount, venueCount, matchCount, gameCount, rallyCount] = await Promise.all([
      db.players.count(),
      db.venues.count(),
      db.matches.count(),
      db.games.count(),
      db.rally_analyses.count(),
    ])
    return playerCount + venueCount + matchCount + gameCount + rallyCount
  } catch (error) {
    console.error('Error counting records:', error)
    return 0
  }
}

export async function performMigration(
  userId: string,
  progress: MigrationProgress
): Promise<boolean> {
  const idMapping: IdMapping = {
    players: new Map(),
    venues: new Map(),
    matches: new Map(),
  }

  let currentProgress = 0

  try {
    // Step 1: Migrate Players
    progress.onProgress(currentProgress, 1, 'Uploading players...')
    const players = await db.players.toArray()
    const totalRecords = await getTotalRecordsToMigrate()

    if (players.length > 0) {
      const playerBatches = createBatches(players, BATCH_SIZE)

      for (const batch of playerBatches) {
        const supabasePlayers = batch.map((player) => ({
          id: crypto.randomUUID(),
          user_id: userId,
          name: player.name,
          is_current_user: player.isCurrentUser || false,
          last_modified_ms: player.createdAt.getTime(),
          deleted_at: null,
        }))

        const { data, error } = await supabase
          .from('players')
          .insert(supabasePlayers)
          .select()

        if (error) throw new Error(`Player migration failed: ${error.message}`)

        // Map local IDs to server UUIDs
        batch.forEach((player, index) => {
          if (player.id && data && data[index]) {
            idMapping.players.set(player.id, data[index].id)
          }
        })

        currentProgress += batch.length
        progress.onProgress(currentProgress, totalRecords, 'Uploading players...')
      }
    }

    // Step 2: Migrate Venues
    progress.onProgress(currentProgress, totalRecords, 'Uploading venues...')
    const venues = await db.venues.toArray()

    if (venues.length > 0) {
      const venueBatches = createBatches(venues, BATCH_SIZE)

      for (const batch of venueBatches) {
        const supabaseVenues = batch.map((venue) => ({
          id: crypto.randomUUID(),
          user_id: userId,
          name: venue.name,
          last_modified_ms: venue.createdAt.getTime(),
          deleted_at: null,
        }))

        const { data, error } = await supabase
          .from('venues')
          .insert(supabaseVenues)
          .select()

        if (error) throw new Error(`Venue migration failed: ${error.message}`)

        // Map local IDs to server UUIDs
        batch.forEach((venue, index) => {
          if (venue.id && data && data[index]) {
            idMapping.venues.set(venue.id, data[index].id)
          }
        })

        currentProgress += batch.length
        progress.onProgress(currentProgress, totalRecords, 'Uploading venues...')
      }
    }

    // Step 3: Migrate Matches
    progress.onProgress(currentProgress, totalRecords, 'Uploading matches...')
    const matches = await db.matches.toArray()

    if (matches.length > 0) {
      const matchBatches = createBatches(matches, BATCH_SIZE)

      for (const batch of matchBatches) {
        const supabaseMatches = batch.map((match) => {
          // Parse result string (e.g., "W 3-1" or "L 1-3")
          const resultParts = match.result.split(' ')
          const isWin = resultParts[0] === 'W'
          const scores = resultParts[1]?.split('-') || ['0', '0']

          return {
            id: crypto.randomUUID(),
            user_id: userId,
            opponent_id: idMapping.players.get(match.opponentId) || crypto.randomUUID(),
            venue_id: match.venueId ? idMapping.venues.get(match.venueId) : null,
            date: match.date.toISOString(),
            format: match.format,
            user_score: parseInt(scores[0]) || 0,
            opponent_score: parseInt(scores[1]) || 0,
            result: isWin ? ('win' as const) : ('loss' as const),
            energy_level: match.energyLevel === 'Low' ? 1 : match.energyLevel === 'Medium' ? 2 : match.energyLevel === 'High' ? 3 : null,
            note: match.note || null,
            photo_url: null, // Photos handled separately in US-P006
            tags: match.tags || [],
            last_modified_ms: match.createdAt.getTime(),
            deleted_at: null,
          }
        })

        const { data, error } = await supabase
          .from('matches')
          .insert(supabaseMatches)
          .select()

        if (error) throw new Error(`Match migration failed: ${error.message}`)

        // Map local IDs to server UUIDs
        batch.forEach((match, index) => {
          if (match.id && data && data[index]) {
            idMapping.matches.set(match.id, data[index].id)
          }
        })

        currentProgress += batch.length
        progress.onProgress(currentProgress, totalRecords, 'Uploading matches...')
      }
    }

    // Step 4: Migrate Games
    progress.onProgress(currentProgress, totalRecords, 'Uploading games...')
    const games = await db.games.toArray()

    if (games.length > 0) {
      const gameBatches = createBatches(games, BATCH_SIZE)

      for (const batch of gameBatches) {
        const supabaseGames = batch
          .map((game) => {
            const matchId = idMapping.matches.get(game.matchId)
            if (!matchId) return null // Skip if match wasn't migrated

            return {
              id: crypto.randomUUID(),
              user_id: userId,
              match_id: matchId,
              game_number: game.gameNumber,
              user_score: game.myScore,
              opponent_score: game.opponentScore,
              last_modified_ms: Date.now(),
              deleted_at: null,
            }
          })
          .filter((g) => g !== null)

        if (supabaseGames.length > 0) {
          const { error } = await supabase.from('games').insert(supabaseGames)

          if (error) throw new Error(`Game migration failed: ${error.message}`)
        }

        currentProgress += batch.length
        progress.onProgress(currentProgress, totalRecords, 'Uploading games...')
      }
    }

    // Step 5: Migrate Rally Analyses
    progress.onProgress(currentProgress, totalRecords, 'Uploading rally analyses...')
    const rallyAnalyses = await db.rally_analyses.toArray()

    if (rallyAnalyses.length > 0) {
      const rallyBatches = createBatches(rallyAnalyses, BATCH_SIZE)

      for (const batch of rallyBatches) {
        const supabaseRallyAnalyses = batch
          .map((rally) => {
            const matchId = idMapping.matches.get(rally.matchId)
            if (!matchId) return null // Skip if match wasn't migrated

            return {
              id: crypto.randomUUID(),
              user_id: userId,
              match_id: matchId,
              rally_data: {
                winMethod: rally.winMethod,
                loseMethod: rally.loseMethod,
                rallyLength: rally.rallyLength,
                courtCoverage: rally.courtCoverage,
                bestShots: rally.bestShots,
              },
              last_modified_ms: rally.createdAt.getTime(),
              deleted_at: null,
            }
          })
          .filter((r) => r !== null)

        if (supabaseRallyAnalyses.length > 0) {
          const { error } = await supabase.from('rally_analyses').insert(supabaseRallyAnalyses)

          if (error) throw new Error(`Rally analysis migration failed: ${error.message}`)
        }

        currentProgress += batch.length
        progress.onProgress(currentProgress, totalRecords, 'Uploading rally analyses...')
      }
    }

    // Mark migration as complete
    localStorage.setItem('migration_completed', 'true')
    progress.onProgress(currentProgress, totalRecords, 'Migration complete!')

    return true
  } catch (error) {
    console.error('Migration error:', error)
    progress.onError(error instanceof Error ? error.message : 'Migration failed. Please try again.')
    return false
  }
}

function createBatches<T>(array: T[], batchSize: number): T[][] {
  const batches: T[][] = []
  for (let i = 0; i < array.length; i += batchSize) {
    batches.push(array.slice(i, i + batchSize))
  }
  return batches
}
