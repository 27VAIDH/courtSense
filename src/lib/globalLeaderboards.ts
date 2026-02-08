import { supabase } from './supabase'

export interface GlobalLeaderboardEntry {
  userId: string
  username: string
  displayName: string
  rank: number
  metricValue: number
  metricLabel: string
  computedAt: string
}

export interface GlobalLeaderboardCategory {
  id: string
  name: string
  description: string
}

export const GLOBAL_LEADERBOARD_CATEGORIES: GlobalLeaderboardCategory[] = [
  { id: 'overall', name: 'Overall', description: 'Win rate (min 5 matches)' },
  { id: 'iron-man', name: 'Iron Man', description: 'Matches this month' },
  { id: 'clutch', name: 'Clutch King', description: '8-8+ Index (min 5 tight games)' },
  { id: 'comeback', name: 'Comeback Kid', description: 'Wins after losing Game 1' },
  { id: 'hot-streak', name: 'Hot Streak', description: 'Current consecutive wins' },
  { id: 'consistency', name: 'Consistency Crown', description: 'Lowest variance (min 20 matches)' },
  { id: 'improved', name: 'Most Improved', description: 'Win rate change (last 30d vs prior 30d)' },
]

/**
 * Compute global leaderboards for all categories and cache in Supabase
 * This function should be run periodically (e.g., daily at midnight UTC)
 * For MVP, this can be triggered manually or via a scheduled job
 */
export async function computeGlobalLeaderboards(): Promise<void> {
  try {
    console.log('Starting global leaderboard computation...')

    // Get all users with public or friends privacy
    const { data: users, error: usersError } = await supabase
      .from('user_profiles')
      .select('id, username, display_name, privacy_setting')
      .in('privacy_setting', ['public', 'friends'])

    if (usersError) throw usersError
    if (!users || users.length === 0) {
      console.log('No users found for leaderboard computation')
      return
    }

    console.log(`Computing leaderboards for ${users.length} users...`)

    // Clear existing leaderboard cache
    const { error: deleteError } = await supabase
      .from('leaderboard_cache')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all (RLS will handle permissions)

    if (deleteError) console.warn('Error clearing cache:', deleteError)

    // Compute each category
    for (const category of GLOBAL_LEADERBOARD_CATEGORIES) {
      console.log(`Computing ${category.name}...`)
      await computeCategoryLeaderboard(category.id, users)
    }

    console.log('Global leaderboard computation complete!')
  } catch (error) {
    console.error('Error computing global leaderboards:', error)
    throw error
  }
}

/**
 * Compute leaderboard for a specific category
 */
async function computeCategoryLeaderboard(
  category: string,
  users: Array<{ id: string; username: string; display_name: string }>
): Promise<void> {
  const entries: Array<{
    user_id: string
    category: string
    metric_value: number
    metric_label: string
  }> = []

  // Fetch all matches and games for computation
  const { data: allMatches } = await supabase
    .from('matches')
    .select('*')
    .order('date', { ascending: false })

  const { data: allGames } = await supabase
    .from('games')
    .select('*')

  if (!allMatches || !allGames) return

  // Compute metric for each user
  for (const user of users) {
    const userMatches = allMatches.filter(m => m.user_id === user.id)
    if (userMatches.length === 0) continue

    const userGames = allGames.filter(g =>
      userMatches.some(m => m.id === g.match_id)
    )

    let metricValue: number | null = null
    let metricLabel: string | null = null

    switch (category) {
      case 'overall':
        ({ metricValue, metricLabel } = computeOverall(userMatches))
        break
      case 'iron-man':
        ({ metricValue, metricLabel } = computeIronMan(userMatches))
        break
      case 'clutch':
        ({ metricValue, metricLabel } = computeClutch(userMatches, userGames))
        break
      case 'comeback':
        ({ metricValue, metricLabel } = computeComeback(userMatches, userGames))
        break
      case 'hot-streak':
        ({ metricValue, metricLabel } = computeHotStreak(userMatches))
        break
      case 'consistency':
        ({ metricValue, metricLabel } = computeConsistency(userMatches))
        break
      case 'improved':
        ({ metricValue, metricLabel } = computeImproved(userMatches))
        break
    }

    if (metricValue !== null && metricLabel !== null) {
      entries.push({
        user_id: user.id,
        category,
        metric_value: metricValue,
        metric_label: metricLabel,
      })
    }
  }

  // Sort by metric value (descending) and assign ranks
  entries.sort((a, b) => b.metric_value - a.metric_value)

  const rankedEntries = entries.map((entry, index) => ({
    ...entry,
    rank: index + 1,
  }))

  // Insert into leaderboard_cache (batch insert)
  if (rankedEntries.length > 0) {
    const { error } = await supabase
      .from('leaderboard_cache')
      .insert(rankedEntries)

    if (error) {
      console.error(`Error inserting ${category} leaderboard:`, error)
    } else {
      console.log(`  ✓ ${category}: ${rankedEntries.length} entries`)
    }
  }
}

// Category computation functions
function computeOverall(matches: any[]): { metricValue: number | null; metricLabel: string | null } {
  if (matches.length < 5) return { metricValue: null, metricLabel: null }

  const wins = matches.filter(m => m.result?.startsWith('W')).length
  const winRate = (wins / matches.length) * 100

  return {
    metricValue: winRate,
    metricLabel: `${winRate.toFixed(0)}% (${wins}-${matches.length - wins})`
  }
}

function computeIronMan(matches: any[]): { metricValue: number | null; metricLabel: string | null } {
  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()

  const thisMonthMatches = matches.filter(m => {
    const d = new Date(m.date)
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear
  })

  if (thisMonthMatches.length === 0) return { metricValue: null, metricLabel: null }

  return {
    metricValue: thisMonthMatches.length,
    metricLabel: `${thisMonthMatches.length} ${thisMonthMatches.length === 1 ? 'match' : 'matches'}`
  }
}

function computeClutch(_matches: any[], games: any[]): { metricValue: number | null; metricLabel: string | null } {
  const tightGames = games.filter(g => g.is_tight)
  if (tightGames.length < 5) return { metricValue: null, metricLabel: null }

  const tightWins = tightGames.filter(g => g.my_score > g.opponent_score).length
  const clutchIndex = (tightWins / tightGames.length) * 100

  return {
    metricValue: clutchIndex,
    metricLabel: `${clutchIndex.toFixed(0)}% (${tightWins}/${tightGames.length})`
  }
}

function computeComeback(matches: any[], games: any[]): { metricValue: number | null; metricLabel: string | null } {
  let lostGame1Count = 0
  let wonAfterLostGame1 = 0

  for (const match of matches) {
    const matchGames = games.filter(g => g.match_id === match.id)
    const game1 = matchGames.find(g => g.game_number === 1)

    if (!game1) continue

    const lostGame1 = game1.opponent_score > game1.my_score
    const wonMatch = match.result?.startsWith('W')

    if (lostGame1) {
      lostGame1Count++
      if (wonMatch) wonAfterLostGame1++
    }
  }

  if (lostGame1Count === 0) return { metricValue: null, metricLabel: null }

  return {
    metricValue: wonAfterLostGame1,
    metricLabel: `${wonAfterLostGame1}/${lostGame1Count} comebacks`
  }
}

function computeHotStreak(matches: any[]): { metricValue: number | null; metricLabel: string | null } {
  if (matches.length === 0) return { metricValue: null, metricLabel: null }

  // Matches should already be sorted by date descending
  const sorted = [...matches].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  let streak = 0
  for (const m of sorted) {
    if (m.result?.startsWith('W')) {
      streak++
    } else {
      break
    }
  }

  if (streak === 0) return { metricValue: null, metricLabel: null }

  return {
    metricValue: streak,
    metricLabel: `${streak} ${streak === 1 ? 'win' : 'wins'}`
  }
}

function computeConsistency(matches: any[]): { metricValue: number | null; metricLabel: string | null } {
  if (matches.length < 20) return { metricValue: null, metricLabel: null }

  const sorted = [...matches].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  const last20 = sorted.slice(0, 20)

  // Calculate rolling win rate variance
  const winRates: number[] = []
  for (let i = 0; i < last20.length; i++) {
    const window = last20.slice(0, i + 1)
    const wins = window.filter(m => m.result?.startsWith('W')).length
    winRates.push((wins / window.length) * 100)
  }

  const mean = winRates.reduce((a, b) => a + b, 0) / winRates.length
  const variance = winRates.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / winRates.length
  const stdDev = Math.sqrt(variance)

  const consistencyScore = Math.max(0, 100 - stdDev)

  return {
    metricValue: consistencyScore,
    metricLabel: `${consistencyScore.toFixed(0)} consistency`
  }
}

function computeImproved(matches: any[]): { metricValue: number | null; metricLabel: string | null } {
  const now = new Date()
  const thirtyDaysAgo = new Date(now)
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const sixtyDaysAgo = new Date(now)
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60)

  const last30 = matches.filter(m => new Date(m.date) >= thirtyDaysAgo)
  const prior30 = matches.filter(m => {
    const d = new Date(m.date)
    return d >= sixtyDaysAgo && d < thirtyDaysAgo
  })

  if (last30.length === 0 || prior30.length === 0) return { metricValue: null, metricLabel: null }

  const last30WinRate = (last30.filter(m => m.result?.startsWith('W')).length / last30.length) * 100
  const prior30WinRate = (prior30.filter(m => m.result?.startsWith('W')).length / prior30.length) * 100

  const improvement = last30WinRate - prior30WinRate

  return {
    metricValue: improvement,
    metricLabel: improvement >= 0 ? `+${improvement.toFixed(0)}%` : `${improvement.toFixed(0)}%`
  }
}

/**
 * Fetch global leaderboard for a specific category
 * @param category - Leaderboard category ID
 * @param friendsOnly - If true, only show friends (requires friendIds)
 * @param friendIds - Array of friend user IDs for filtering
 */
export async function fetchGlobalLeaderboard(
  category: string,
  friendsOnly: boolean = false,
  friendIds: string[] = []
): Promise<GlobalLeaderboardEntry[]> {
  try {
    let query = supabase
      .from('leaderboard_cache')
      .select(`
        user_id,
        rank,
        metric_value,
        metric_label,
        computed_at,
        user_profiles!leaderboard_cache_user_id_fkey (
          username,
          display_name
        )
      `)
      .eq('category', category)
      .order('rank', { ascending: true })

    // If friends-only mode, filter to friend IDs
    if (friendsOnly && friendIds.length > 0) {
      query = query.in('user_id', friendIds)
    }

    const { data, error } = await query

    if (error) throw error
    if (!data) return []

    // Transform to GlobalLeaderboardEntry format
    return data.map((entry: any) => ({
      userId: entry.user_id,
      username: entry.user_profiles?.username || 'Unknown',
      displayName: entry.user_profiles?.display_name || 'Unknown',
      rank: entry.rank,
      metricValue: entry.metric_value,
      metricLabel: entry.metric_label,
      computedAt: entry.computed_at,
    }))
  } catch (error) {
    console.error('Error fetching global leaderboard:', error)
    return []
  }
}

/**
 * Get current user's rank in a specific category
 */
export async function getCurrentUserRank(
  category: string,
  userId: string
): Promise<{ rank: number; total: number } | null> {
  try {
    // Get user's entry
    const { data: userEntry, error: userError } = await supabase
      .from('leaderboard_cache')
      .select('rank')
      .eq('category', category)
      .eq('user_id', userId)
      .single()

    if (userError || !userEntry) return null

    // Get total entries in category
    const { count, error: countError } = await supabase
      .from('leaderboard_cache')
      .select('*', { count: 'exact', head: true })
      .eq('category', category)

    if (countError || count === null) return null

    return {
      rank: userEntry.rank,
      total: count,
    }
  } catch (error) {
    console.error('Error fetching user rank:', error)
    return null
  }
}
