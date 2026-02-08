import { useMemo, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useInView } from 'react-intersection-observer'
import { useMatches, useGames, usePlayers, useVenues } from '@/db/hooks'
import { db } from '@/db/database'
import type { Match, Game, Player, Venue } from '@/db/types'
import SwipeableMatchCard from '@/components/matches/SwipeableMatchCard'
import MatchSearchFilter from '@/components/matches/MatchSearchFilter'
import Button from '@/components/ui/Button'
import { triggerLightHaptic } from '@/lib/haptics'

const INITIAL_LOAD = 20
const LOAD_MORE = 20

export default function MatchHistoryList() {
  const matches = useMatches()
  const games = useGames()
  const players = usePlayers()
  const venues = useVenues()
  const navigate = useNavigate()
  const [displayCount, setDisplayCount] = useState(INITIAL_LOAD)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null)
  const [filteredMatches, setFilteredMatches] = useState<Match[]>([])

  const sortedMatches = useMemo(() => {
    if (!matches) return undefined
    return [...matches].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
  }, [matches])

  // Use filtered matches if filters are active, otherwise use all sorted matches
  const matchesToDisplay = useMemo(() => {
    // If matches haven't loaded yet, return undefined
    if (!sortedMatches) return undefined

    // If no filters are active (filteredMatches is empty array from initial state),
    // use all sorted matches. Otherwise use filtered results.
    return filteredMatches.length > 0 || matches?.length === 0 ? filteredMatches : sortedMatches
  }, [sortedMatches, filteredMatches, matches])

  const handleFilteredMatchesChange = useCallback((filtered: Match[]) => {
    // Sort filtered matches by date (newest first)
    const sorted = [...filtered].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    setFilteredMatches(sorted)
    // Reset display count when filters change
    setDisplayCount(INITIAL_LOAD)
  }, [])

  const displayedMatches = useMemo(() => {
    if (!matchesToDisplay) return undefined
    return matchesToDisplay.slice(0, displayCount)
  }, [matchesToDisplay, displayCount])

  const hasMore = matchesToDisplay && displayCount < matchesToDisplay.length

  // Infinite scroll trigger
  const { ref: loadMoreRef } = useInView({
    threshold: 0,
    onChange: (inView) => {
      if (inView && hasMore) {
        setDisplayCount((prev) => prev + LOAD_MORE)
      }
    },
  })

  const gamesByMatch = useMemo(() => {
    if (!games) return new Map<number, Game[]>()
    const map = new Map<number, Game[]>()
    for (const g of games) {
      const arr = map.get(g.matchId) || []
      arr.push(g)
      map.set(g.matchId, arr)
    }
    return map
  }, [games])

  const playersById = useMemo(() => {
    if (!players) return new Map<number, Player>()
    const map = new Map<number, Player>()
    for (const p of players) {
      if (p.id !== undefined) map.set(p.id, p)
    }
    return map
  }, [players])

  const venuesById = useMemo(() => {
    if (!venues) return new Map<number, Venue>()
    const map = new Map<number, Venue>()
    for (const v of venues) {
      if (v.id !== undefined) map.set(v.id, v)
    }
    return map
  }, [venues])

  async function handleDeleteMatch(matchId: number) {
    try {
      // Delete games and rally analyses associated with this match
      await db.games.where('matchId').equals(matchId).delete()
      await db.rally_analyses.where('matchId').equals(matchId).delete()
      // Delete the match itself
      await db.matches.delete(matchId)
      triggerLightHaptic()
      setShowDeleteConfirm(null)
    } catch (error) {
      console.error('Failed to delete match:', error)
    }
  }

  // Loading state
  if (displayedMatches === undefined) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 animate-pulse rounded-[16px] bg-surface" />
        ))}
      </div>
    )
  }

  // Check if we have filters active (when filteredMatches is set but different from all matches)
  const hasActiveFilters = filteredMatches.length > 0 && filteredMatches.length !== sortedMatches?.length

  // Empty state
  if (displayedMatches.length === 0) {
    // If filters are active and no results, show filter-specific empty state
    if (hasActiveFilters || (sortedMatches && sortedMatches.length > 0)) {
      return (
        <>
          {matches && players && venues && (
            <MatchSearchFilter
              matches={matches}
              players={players}
              venues={venues}
              onFilteredMatchesChange={handleFilteredMatchesChange}
            />
          )}
          <div className="flex flex-col items-center py-12 text-center">
            <span className="text-6xl mb-4">🔍</span>
            <p className="text-lg font-semibold text-text-primary mb-2">No matches found</p>
            <p className="text-text-secondary mb-6 max-w-[240px]">
              Try adjusting your search or filters
            </p>
          </div>
        </>
      )
    }

    // No matches at all
    return (
      <div className="flex flex-col items-center py-12 text-center">
        <span className="text-6xl mb-4">🏸</span>
        <p className="text-lg font-semibold text-text-primary mb-2">No matches yet — let's fix that!</p>
        <p className="text-text-secondary mb-6 max-w-[240px]">
          Start logging matches to build your history and unlock insights
        </p>
        <Button onClick={() => navigate('/log')} className="w-full max-w-[200px]">
          Log First Match
        </Button>
      </div>
    )
  }

  return (
    <>
      {/* Search and Filter UI */}
      {matches && players && venues && (
        <MatchSearchFilter
          matches={matches}
          players={players}
          venues={venues}
          onFilteredMatchesChange={handleFilteredMatchesChange}
        />
      )}

      <div className="space-y-3">
        {displayedMatches.map((match) => (
          <SwipeableMatchCard
            key={match.id}
            match={match}
            games={gamesByMatch.get(match.id!) || []}
            opponent={playersById.get(match.opponentId)}
            venue={venuesById.get(match.venueId)}
            onClick={() => navigate(`/match/${match.id}`)}
            onDelete={() => setShowDeleteConfirm(match.id!)}
          />
        ))}
        {hasMore && (
          <div ref={loadMoreRef} className="py-4 flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary"></div>
          </div>
        )}
        {!hasMore && matchesToDisplay && matchesToDisplay.length > INITIAL_LOAD && (
          <p className="text-xs text-text-secondary text-center py-4">
            All {matchesToDisplay.length} matches loaded
          </p>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm rounded-[16px] bg-surface-elevated p-6">
            <h3 className="mb-2 text-lg font-semibold text-text-primary">Delete match?</h3>
            <p className="mb-6 text-sm text-text-secondary">
              This will permanently delete the match and all associated game data.
            </p>
            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={() => handleDeleteMatch(showDeleteConfirm)}
                className="flex-1 !bg-loss"
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
