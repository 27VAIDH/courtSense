import { useState, useMemo, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search, X, ChevronDown, ChevronUp } from 'lucide-react'
import type { Match, Player, Venue } from '@/db/types'
import Button from '@/components/ui/Button'
import Chip from '@/components/ui/Chip'

interface MatchSearchFilterProps {
  matches: Match[]
  players: Player[]
  venues: Venue[]
  onFilteredMatchesChange: (filteredMatches: Match[]) => void
}

export type FilterResult = 'all' | 'win' | 'loss'
export type FilterTimeframe = 'all' | 'thisMonth' | 'lastMonth' | 'thisYear'
export type FilterEnergyLevel = 'all' | 'Low' | 'Medium' | 'High'

export default function MatchSearchFilter({
  matches,
  players,
  venues,
  onFilteredMatchesChange,
}: MatchSearchFilterProps) {
  const [searchParams, setSearchParams] = useSearchParams()
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '')
  const [debouncedSearch, setDebouncedSearch] = useState(searchQuery)
  const [filterResult, setFilterResult] = useState<FilterResult>(
    (searchParams.get('result') as FilterResult) || 'all'
  )
  const [filterTimeframe, setFilterTimeframe] = useState<FilterTimeframe>(
    (searchParams.get('timeframe') as FilterTimeframe) || 'all'
  )
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [selectedOpponents, setSelectedOpponents] = useState<number[]>(() => {
    const opps = searchParams.get('opponents')
    return opps ? opps.split(',').map(Number) : []
  })
  const [selectedVenues, setSelectedVenues] = useState<number[]>(() => {
    const vens = searchParams.get('venues')
    return vens ? vens.split(',').map(Number) : []
  })
  const [selectedEnergy, setSelectedEnergy] = useState<FilterEnergyLevel>(
    (searchParams.get('energy') as FilterEnergyLevel) || 'all'
  )

  // Debounce search input (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Update URL params when filters change
  useEffect(() => {
    const params = new URLSearchParams()
    if (debouncedSearch) params.set('search', debouncedSearch)
    if (filterResult !== 'all') params.set('result', filterResult)
    if (filterTimeframe !== 'all') params.set('timeframe', filterTimeframe)
    if (selectedOpponents.length > 0) params.set('opponents', selectedOpponents.join(','))
    if (selectedVenues.length > 0) params.set('venues', selectedVenues.join(','))
    if (selectedEnergy !== 'all') params.set('energy', selectedEnergy)
    setSearchParams(params, { replace: true })
  }, [debouncedSearch, filterResult, filterTimeframe, selectedOpponents, selectedVenues, selectedEnergy, setSearchParams])

  const playersById = useMemo(() => {
    const map = new Map<number, Player>()
    for (const p of players) {
      if (p.id !== undefined) map.set(p.id, p)
    }
    return map
  }, [players])

  const venuesById = useMemo(() => {
    const map = new Map<number, Venue>()
    for (const v of venues) {
      if (v.id !== undefined) map.set(v.id, v)
    }
    return map
  }, [venues])

  // Filter matches based on all active filters
  const filteredMatches = useMemo(() => {
    let filtered = [...matches]

    // Search filter (opponent, venue, date, note)
    if (debouncedSearch) {
      const query = debouncedSearch.toLowerCase()
      filtered = filtered.filter((match) => {
        const opponent = playersById.get(match.opponentId)
        const venue = venuesById.get(match.venueId)
        const dateStr = match.date.toLocaleDateString()
        const note = match.note?.toLowerCase() || ''

        return (
          opponent?.name.toLowerCase().includes(query) ||
          venue?.name.toLowerCase().includes(query) ||
          dateStr.includes(query) ||
          note.includes(query)
        )
      })
    }

    // Result filter
    if (filterResult === 'win') {
      filtered = filtered.filter((m) => m.result.startsWith('W'))
    } else if (filterResult === 'loss') {
      filtered = filtered.filter((m) => m.result.startsWith('L'))
    }

    // Timeframe filter
    if (filterTimeframe !== 'all') {
      const now = new Date()
      const currentMonth = now.getMonth()
      const currentYear = now.getFullYear()

      filtered = filtered.filter((m) => {
        const matchDate = new Date(m.date)
        const matchMonth = matchDate.getMonth()
        const matchYear = matchDate.getFullYear()

        if (filterTimeframe === 'thisMonth') {
          return matchMonth === currentMonth && matchYear === currentYear
        } else if (filterTimeframe === 'lastMonth') {
          const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1
          const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear
          return matchMonth === lastMonth && matchYear === lastMonthYear
        } else if (filterTimeframe === 'thisYear') {
          return matchYear === currentYear
        }
        return true
      })
    }

    // Opponent filter
    if (selectedOpponents.length > 0) {
      filtered = filtered.filter((m) => selectedOpponents.includes(m.opponentId))
    }

    // Venue filter
    if (selectedVenues.length > 0) {
      filtered = filtered.filter((m) => selectedVenues.includes(m.venueId))
    }

    // Energy level filter
    if (selectedEnergy !== 'all') {
      filtered = filtered.filter((m) => m.energyLevel === selectedEnergy)
    }

    return filtered
  }, [matches, debouncedSearch, filterResult, filterTimeframe, selectedOpponents, selectedVenues, selectedEnergy, playersById, venuesById])

  // Notify parent of filtered matches
  useEffect(() => {
    onFilteredMatchesChange(filteredMatches)
  }, [filteredMatches, onFilteredMatchesChange])

  const hasActiveFilters =
    debouncedSearch !== '' ||
    filterResult !== 'all' ||
    filterTimeframe !== 'all' ||
    selectedOpponents.length > 0 ||
    selectedVenues.length > 0 ||
    selectedEnergy !== 'all'

  function clearAllFilters() {
    setSearchQuery('')
    setDebouncedSearch('')
    setFilterResult('all')
    setFilterTimeframe('all')
    setSelectedOpponents([])
    setSelectedVenues([])
    setSelectedEnergy('all')
    setSearchParams({}, { replace: true })
  }

  function toggleOpponent(opponentId: number) {
    setSelectedOpponents((prev) =>
      prev.includes(opponentId)
        ? prev.filter((id) => id !== opponentId)
        : [...prev, opponentId]
    )
  }

  function toggleVenue(venueId: number) {
    setSelectedVenues((prev) =>
      prev.includes(venueId) ? prev.filter((id) => id !== venueId) : [...prev, venueId]
    )
  }

  // Get unique opponents (excluding current user)
  const opponents = useMemo(() => {
    return players.filter((p) => !p.isCurrentUser)
  }, [players])

  return (
    <div className="mb-4 space-y-3">
      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-text-secondary" />
        <input
          type="text"
          placeholder="Search matches... (opponent, venue, date, note)"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-[12px] bg-surface py-3 pl-11 pr-10 text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary"
          aria-label="Search matches"
        />
        {searchQuery && (
          <button
            onClick={() => {
              setSearchQuery('')
              setDebouncedSearch('')
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2"
            aria-label="Clear search"
          >
            <X className="h-5 w-5 text-text-secondary" />
          </button>
        )}
      </div>

      {/* Quick filters */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <Chip
          selected={filterResult === 'all'}
          onClick={() => setFilterResult('all')}
        >
          All
        </Chip>
        <Chip
          selected={filterResult === 'win'}
          onClick={() => setFilterResult('win')}
        >
          Wins
        </Chip>
        <Chip
          selected={filterResult === 'loss'}
          onClick={() => setFilterResult('loss')}
        >
          Losses
        </Chip>
        <div className="w-px h-8 bg-surface-elevated mx-1" />
        <Chip
          selected={filterTimeframe === 'thisMonth'}
          onClick={() => setFilterTimeframe('thisMonth')}
        >
          This Month
        </Chip>
        <Chip
          selected={filterTimeframe === 'lastMonth'}
          onClick={() => setFilterTimeframe('lastMonth')}
        >
          Last Month
        </Chip>
        <Chip
          selected={filterTimeframe === 'thisYear'}
          onClick={() => setFilterTimeframe('thisYear')}
        >
          This Year
        </Chip>
      </div>

      {/* Advanced filters toggle */}
      <button
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="flex w-full items-center justify-between rounded-[12px] bg-surface px-4 py-2.5 text-sm text-text-secondary hover:bg-surface-elevated transition-colors"
        aria-expanded={showAdvanced}
        aria-controls="advanced-filters"
      >
        <span>Advanced Filters</span>
        {showAdvanced ? (
          <ChevronUp className="h-4 w-4" aria-hidden="true" />
        ) : (
          <ChevronDown className="h-4 w-4" aria-hidden="true" />
        )}
      </button>

      {/* Advanced filters */}
      {showAdvanced && (
        <div id="advanced-filters" className="space-y-4 rounded-[12px] bg-surface p-4">
          {/* Opponent filter */}
          <div>
            <label className="mb-2 block text-sm font-medium text-text-secondary">
              Opponents
            </label>
            <div className="flex flex-wrap gap-2">
              {opponents.map((opponent) => (
                <Chip
                  key={opponent.id}
                  selected={selectedOpponents.includes(opponent.id!)}
                  onClick={() => toggleOpponent(opponent.id!)}
                >
                  {opponent.emoji} {opponent.name}
                </Chip>
              ))}
            </div>
          </div>

          {/* Venue filter */}
          <div>
            <label className="mb-2 block text-sm font-medium text-text-secondary">
              Venues
            </label>
            <div className="flex flex-wrap gap-2">
              {venues.map((venue) => (
                <Chip
                  key={venue.id}
                  selected={selectedVenues.includes(venue.id!)}
                  onClick={() => toggleVenue(venue.id!)}
                >
                  {venue.name}
                </Chip>
              ))}
            </div>
          </div>

          {/* Energy level filter */}
          <div>
            <label className="mb-2 block text-sm font-medium text-text-secondary">
              Energy Level
            </label>
            <div className="flex gap-2">
              <Chip selected={selectedEnergy === 'all'} onClick={() => setSelectedEnergy('all')}>
                All
              </Chip>
              <Chip selected={selectedEnergy === 'Low'} onClick={() => setSelectedEnergy('Low')}>
                Low
              </Chip>
              <Chip selected={selectedEnergy === 'Medium'} onClick={() => setSelectedEnergy('Medium')}>
                Medium
              </Chip>
              <Chip selected={selectedEnergy === 'High'} onClick={() => setSelectedEnergy('High')}>
                High
              </Chip>
            </div>
          </div>
        </div>
      )}

      {/* Results count and clear filters */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-text-secondary">
          Showing {filteredMatches.length} of {matches.length} matches
        </p>
        {hasActiveFilters && (
          <Button variant="secondary" onClick={clearAllFilters} className="!py-1.5 !px-3 !text-xs">
            Clear Filters
          </Button>
        )}
      </div>
    </div>
  )
}
