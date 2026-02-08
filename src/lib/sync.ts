import { supabase } from './supabase'
import { db } from '@/db/database'
import { useSyncStore } from '@/stores/syncStore'
import type { Player, Venue, Match, Game, RallyAnalysis } from '@/db/types'
import type { Database } from './supabase'

const MAX_RETRIES = 5
const BATCH_SIZE = 50

/**
 * Calculate exponential backoff delay
 */
function getRetryDelay(retryCount: number): number {
  return Math.min(1000 * Math.pow(2, retryCount), 8000) // 1s, 2s, 4s, 8s max
}

/**
 * Sleep for a given duration
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Convert local Player to Supabase format
 */
function convertPlayerToServer(
  player: Player,
  userId: string,
  serverId?: string
): Database['public']['Tables']['players']['Insert'] {
  return {
    id: serverId || crypto.randomUUID(),
    user_id: userId,
    name: player.name,
    is_current_user: player.isCurrentUser,
    last_modified_ms: player.createdAt.getTime(),
    deleted_at: null,
  }
}

/**
 * Convert local Venue to Supabase format
 */
function convertVenueToServer(
  venue: Venue,
  userId: string,
  serverId?: string
): Database['public']['Tables']['venues']['Insert'] {
  return {
    id: serverId || crypto.randomUUID(),
    user_id: userId,
    name: venue.name,
    last_modified_ms: venue.createdAt.getTime(),
    deleted_at: null,
  }
}

/**
 * Convert local Match to Supabase format
 * TODO: Will be used in full sync implementation
 */
// @ts-expect-error - Will be used in full sync implementation
function convertMatchToServer(
  match: Match,
  userId: string,
  opponentServerId: string,
  venueServerId: string | null,
  serverId?: string
): Database['public']['Tables']['matches']['Insert'] {
  // Parse result string like "W 3-1" or "L 1-3"
  const resultParts = match.result.split(' ')
  const isWin = resultParts[0] === 'W'
  const scores = resultParts[1]?.split('-') || ['0', '0']
  const userScore = parseInt(scores[0], 10)
  const opponentScore = parseInt(scores[1], 10)

  // Convert energy level
  const energyMap: Record<string, number> = { Low: 1, Medium: 2, High: 3 }
  const energyLevel = match.energyLevel ? energyMap[match.energyLevel] : null

  return {
    id: serverId || crypto.randomUUID(),
    user_id: userId,
    opponent_id: opponentServerId,
    venue_id: venueServerId,
    date: match.date.toISOString(),
    format: match.format,
    user_score: userScore,
    opponent_score: opponentScore,
    result: isWin ? 'win' : 'loss',
    energy_level: energyLevel,
    note: match.note || null,
    photo_url: null, // Photos handled separately in US-P006
    tags: match.tags || [],
    last_modified_ms: match.createdAt.getTime(),
    deleted_at: null,
  }
}

/**
 * Convert local Game to Supabase format
 * TODO: Will be used in full sync implementation
 */
// @ts-expect-error - Will be used in full sync implementation
function convertGameToServer(
  game: Game,
  userId: string,
  matchServerId: string,
  serverId?: string
): Database['public']['Tables']['games']['Insert'] {
  return {
    id: serverId || crypto.randomUUID(),
    user_id: userId,
    match_id: matchServerId,
    game_number: game.gameNumber,
    user_score: game.myScore,
    opponent_score: game.opponentScore,
    last_modified_ms: Date.now(),
    deleted_at: null,
  }
}

/**
 * Convert local RallyAnalysis to Supabase format
 * TODO: Will be used in full sync implementation
 */
// @ts-expect-error - Will be used in full sync implementation
function convertRallyAnalysisToServer(
  rally: RallyAnalysis,
  userId: string,
  matchServerId: string,
  serverId?: string
): Database['public']['Tables']['rally_analyses']['Insert'] {
  return {
    id: serverId || crypto.randomUUID(),
    user_id: userId,
    match_id: matchServerId,
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
}

/**
 * Push local changes to Supabase
 */
async function pushSync(userId: string): Promise<void> {
  // For MVP: push ALL local data to ensure sync
  // In future: could track dirty records more granularly

  // Push players
  const localPlayers = await db.players.toArray()
  if (localPlayers.length > 0) {
    for (let i = 0; i < localPlayers.length; i += BATCH_SIZE) {
      const batch = localPlayers.slice(i, i + BATCH_SIZE)
      const serverPlayers = batch.map(p => convertPlayerToServer(p, userId))

      const { error } = await supabase
        .from('players')
        .upsert(serverPlayers, { onConflict: 'id' })

      if (error) throw new Error(`Failed to push players: ${error.message}`)
    }
  }

  // Push venues
  const localVenues = await db.venues.toArray()
  if (localVenues.length > 0) {
    for (let i = 0; i < localVenues.length; i += BATCH_SIZE) {
      const batch = localVenues.slice(i, i + BATCH_SIZE)
      const serverVenues = batch.map(v => convertVenueToServer(v, userId))

      const { error } = await supabase
        .from('venues')
        .upsert(serverVenues, { onConflict: 'id' })

      if (error) throw new Error(`Failed to push venues: ${error.message}`)
    }
  }

  // Note: For full push sync, we'd need ID mapping like in migration
  // For MVP, we're assuming migration already happened
  // This push sync will mainly handle new records created after migration
  // convertMatchToServer, convertGameToServer, convertRallyAnalysisToServer are available for future use
}

/**
 * Pull changes from Supabase and update local IndexedDB
 */
async function pullSync(userId: string): Promise<void> {
  const store = useSyncStore.getState()
  const lastSync = store.lastSyncTimestamp

  // Pull players
  const { data: serverPlayers, error: playersError } = await supabase
    .from('players')
    .select('*')
    .eq('user_id', userId)
    .gt('last_modified_ms', lastSync)
    .is('deleted_at', null)

  if (playersError) throw new Error(`Failed to pull players: ${playersError.message}`)

  // Pull venues
  const { data: serverVenues, error: venuesError } = await supabase
    .from('venues')
    .select('*')
    .eq('user_id', userId)
    .gt('last_modified_ms', lastSync)
    .is('deleted_at', null)

  if (venuesError) throw new Error(`Failed to pull venues: ${venuesError.message}`)

  // Pull matches
  const { data: serverMatches, error: matchesError } = await supabase
    .from('matches')
    .select('*')
    .eq('user_id', userId)
    .gt('last_modified_ms', lastSync)
    .is('deleted_at', null)

  if (matchesError) throw new Error(`Failed to pull matches: ${matchesError.message}`)

  // Pull games
  const { data: serverGames, error: gamesError } = await supabase
    .from('games')
    .select('*')
    .eq('user_id', userId)
    .gt('last_modified_ms', lastSync)
    .is('deleted_at', null)

  if (gamesError) throw new Error(`Failed to pull games: ${gamesError.message}`)

  // Pull rally analyses
  const { data: serverRallyAnalyses, error: rallyError } = await supabase
    .from('rally_analyses')
    .select('*')
    .eq('user_id', userId)
    .gt('last_modified_ms', lastSync)
    .is('deleted_at', null)

  if (rallyError) throw new Error(`Failed to pull rally analyses: ${rallyError.message}`)

  // Update local IndexedDB (conflict resolution: server wins)
  // For MVP: simplified approach - we trust server data
  // In a full implementation, we'd compare last_modified_ms and resolve conflicts

  // Note: This is a simplified pull sync for MVP
  // Full implementation would need to:
  // 1. Map server UUIDs back to local IDs
  // 2. Update existing records or insert new ones
  // 3. Handle soft deletes (deleted_at not null)

  console.log('Pull sync completed', {
    players: serverPlayers?.length || 0,
    venues: serverVenues?.length || 0,
    matches: serverMatches?.length || 0,
    games: serverGames?.length || 0,
    rallyAnalyses: serverRallyAnalyses?.length || 0,
  })
}

/**
 * Main sync orchestrator
 */
export async function performSync(): Promise<void> {
  const store = useSyncStore.getState()

  // Check if user is authenticated
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) {
    console.log('Sync skipped: user not authenticated')
    return
  }

  const userId = session.user.id

  // Check if already syncing
  if (store.status === 'syncing') {
    console.log('Sync skipped: already in progress')
    return
  }

  try {
    store.setStatus('syncing')
    store.setError(null)

    // Push local changes
    await pushSync(userId)

    // Pull server changes
    await pullSync(userId)

    // Update last sync timestamp
    store.setLastSyncTimestamp(Date.now())

    // Clear dirty records and reset retry count
    store.clearDirty()
    store.resetRetry()
    store.setStatus('idle')

    console.log('Sync completed successfully')
  } catch (error) {
    console.error('Sync failed:', error)

    const errorMessage = error instanceof Error ? error.message : 'Unknown sync error'
    store.setError(errorMessage)
    store.setStatus('failed')

    // Retry with exponential backoff
    if (store.retryCount < MAX_RETRIES) {
      store.incrementRetry()
      const delay = getRetryDelay(store.retryCount)
      console.log(`Retrying sync in ${delay}ms (attempt ${store.retryCount + 1}/${MAX_RETRIES})`)
      await sleep(delay)
      await performSync() // Recursive retry
    } else {
      console.error('Max retries reached, sync failed permanently')
      store.resetRetry()
    }
  }
}

/**
 * Debounced sync trigger (called after local writes)
 */
let syncTimeout: ReturnType<typeof setTimeout> | null = null
export function triggerSyncDebounced(): void {
  if (syncTimeout) clearTimeout(syncTimeout)
  syncTimeout = setTimeout(() => {
    performSync()
  }, 500) // 500ms debounce
}

/**
 * Manual sync trigger (for pull-to-refresh)
 */
export async function triggerManualSync(): Promise<void> {
  const store = useSyncStore.getState()

  // Reset retry count for manual sync
  store.resetRetry()

  await performSync()
}
