import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMatches, usePlayers, useVenues, useGames, useRallyAnalyses } from '@/db/hooks'
import type { Match, Game, RallyAnalysis } from '@/db/types'
import type { InsightId } from '@/stores/insightStore'
import type { Recommendation } from '@/lib/recommendations'
import MatchHistoryList from '@/components/matches/MatchHistoryList'
import Button from '@/components/ui/Button'
import InsightCardWrapper from '@/components/insights/InsightCardWrapper'
import WinRateByOpponent from '@/components/insights/WinRateByOpponent'
import EnergyImpact from '@/components/insights/EnergyImpact'
import BestDays from '@/components/insights/BestDays'
import VenueEffect from '@/components/insights/VenueEffect'
import DecidingGames from '@/components/insights/DecidingGames'
import ComebackIndex from '@/components/insights/ComebackIndex'
import CurrentForm from '@/components/insights/CurrentForm'
import FastStarter from '@/components/insights/FastStarter'
import WinMethodDistribution from '@/components/insights/WinMethodDistribution'
import LossMethodDistribution from '@/components/insights/LossMethodDistribution'
import BestShotTrends from '@/components/insights/BestShotTrends'
import ClutchRating from '@/components/insights/ClutchRating'
import RecommendationCard from '@/components/recommendations/RecommendationCard'

function CurrentFormDots({ matches }: { matches: Match[] }) {
  const last5 = useMemo(() => {
    const sorted = [...matches].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    return sorted.slice(0, 5)
  }, [matches])

  if (last5.length === 0) return null

  return (
    <div className="flex items-center gap-1.5">
      {last5.map((m, i) => {
        const isWin = m.result.startsWith('W')
        return (
          <span
            key={m.id ?? i}
            className={`text-xs font-bold ${isWin ? 'text-win' : 'text-loss'}`}
          >
            {isWin ? 'W' : 'L'}
          </span>
        )
      })}
    </div>
  )
}

interface InsightConfig {
  id: InsightId
  /** How many more items needed to unlock (0 = unlocked) */
  remaining: number
}

/** Calculate the unlock status for each insight card */
function computeInsightStatuses(
  matches: Match[],
  games: Game[],
  rallyAnalyses: RallyAnalysis[],
): InsightConfig[] {
  const totalMatches = matches.length

  // WinRateByOpponent: 3 total matches AND at least 1 opponent with 3+ H2H
  const opponentCounts = new Map<number, number>()
  for (const m of matches) {
    opponentCounts.set(m.opponentId, (opponentCounts.get(m.opponentId) || 0) + 1)
  }
  const maxOpponentMatches = opponentCounts.size > 0
    ? Math.max(...opponentCounts.values())
    : 0
  const winRateRemaining = totalMatches < 3
    ? 3 - totalMatches
    : maxOpponentMatches < 3
      ? 3 - maxOpponentMatches
      : 0

  // EnergyImpact: 5 total matches AND 3 tagged with energy
  const taggedEnergy = matches.filter((m) => m.energyLevel).length
  const energyRemaining = totalMatches < 5
    ? 5 - totalMatches
    : taggedEnergy < 3
      ? 3 - taggedEnergy
      : 0

  // BestDays: 10 total matches
  const bestDaysRemaining = totalMatches < 10 ? 10 - totalMatches : 0

  // VenueEffect: 5 total matches AND 2+ unique venues
  const uniqueVenues = new Set(matches.map((m) => m.venueId)).size
  const venueRemaining = totalMatches < 5
    ? 5 - totalMatches
    : uniqueVenues < 2
      ? 2 - uniqueVenues
      : 0

  // DecidingGames: 8 deciding games actually played
  const gamesByMatch = new Map<number, Game[]>()
  for (const g of games) {
    const arr = gamesByMatch.get(g.matchId) || []
    arr.push(g)
    gamesByMatch.set(g.matchId, arr)
  }
  let decidingGamesCount = 0
  for (const m of matches) {
    if (m.id === undefined) continue
    const matchGames = gamesByMatch.get(m.id)
    if (!matchGames) continue
    const decidingNum = m.format === 'Bo5' ? 5 : 3
    const dg = matchGames.find((g) => g.gameNumber === decidingNum)
    if (dg && (dg.myScore > 0 || dg.opponentScore > 0)) {
      decidingGamesCount++
    }
  }
  const decidingRemaining = decidingGamesCount < 8 ? 8 - decidingGamesCount : 0

  // ComebackIndex: 10 total matches
  const comebackRemaining = totalMatches < 10 ? 10 - totalMatches : 0

  // CurrentForm: 10 total matches
  const currentFormRemaining = totalMatches < 10 ? 10 - totalMatches : 0

  // FastStarter: 8 total matches
  const fastStarterRemaining = totalMatches < 8 ? 8 - totalMatches : 0

  // Rally insights: 5 rally analyses minimum
  const rallyAnalysesCount = rallyAnalyses.length
  const rallyInsightsRemaining = rallyAnalysesCount < 5 ? 5 - rallyAnalysesCount : 0

  // ClutchRating: 5 tight games minimum
  const tightGamesCount = games.filter((g) => g.isTight).length
  const clutchRatingRemaining = tightGamesCount < 5 ? 5 - tightGamesCount : 0

  return [
    { id: 'winRateByOpponent', remaining: winRateRemaining },
    { id: 'energyImpact', remaining: energyRemaining },
    { id: 'bestDays', remaining: bestDaysRemaining },
    { id: 'venueEffect', remaining: venueRemaining },
    { id: 'decidingGames', remaining: decidingRemaining },
    { id: 'comebackIndex', remaining: comebackRemaining },
    { id: 'currentForm', remaining: currentFormRemaining },
    { id: 'fastStarter', remaining: fastStarterRemaining },
    { id: 'winMethodDistribution', remaining: rallyInsightsRemaining },
    { id: 'lossMethodDistribution', remaining: rallyInsightsRemaining },
    { id: 'bestShotTrends', remaining: rallyInsightsRemaining },
    { id: 'clutchRating', remaining: clutchRatingRemaining },
  ]
}

export default function Dashboard() {
  const matches = useMatches()
  const players = usePlayers()
  const venues = useVenues()
  const games = useGames()
  const rallyAnalyses = useRallyAnalyses()
  const navigate = useNavigate()

  const currentUser = useMemo(() => {
    if (!players) return undefined
    return players.find((p) => p.isCurrentUser)
  }, [players])

  const { wins, losses } = useMemo(() => {
    if (!matches) return { wins: 0, losses: 0 }
    let w = 0
    let l = 0
    for (const m of matches) {
      if (m.result.startsWith('W')) w++
      else l++
    }
    return { wins: w, losses: l }
  }, [matches])

  const insightStatuses = useMemo(() => {
    if (!matches || !games || !rallyAnalyses) return []
    return computeInsightStatuses(matches, games, rallyAnalyses)
  }, [matches, games, rallyAnalyses])

  // Most recent match recommendation
  const latestRecommendation = useMemo((): Recommendation | null => {
    if (!matches || matches.length === 0) return null
    const sorted = [...matches].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    const latest = sorted[0]
    if (!latest.recommendationText) return null
    try {
      return JSON.parse(latest.recommendationText) as Recommendation
    } catch {
      return null
    }
  }, [matches])

  // Sort: unlocked first, then locked sorted by fewest remaining
  const sortedInsights = useMemo(() => {
    const unlocked = insightStatuses.filter((s) => s.remaining === 0)
    const locked = insightStatuses
      .filter((s) => s.remaining > 0)
      .sort((a, b) => a.remaining - b.remaining)
    return [...unlocked, ...locked]
  }, [insightStatuses])

  const isLoading = matches === undefined || players === undefined || venues === undefined || games === undefined || rallyAnalyses === undefined

  // Loading state
  if (isLoading) {
    return (
      <div className="px-4 pt-6 pb-4">
        {/* Header skeleton */}
        <div className="mb-6">
          <div className="h-7 w-40 animate-pulse rounded-lg bg-surface mb-2" />
          <div className="h-5 w-24 animate-pulse rounded-lg bg-surface mb-2" />
          <div className="h-4 w-20 animate-pulse rounded-lg bg-surface" />
        </div>
        {/* Insight cards skeleton */}
        <div className="mb-6">
          <div className="h-5 w-28 animate-pulse rounded-lg bg-surface mb-3" />
          <div className="flex gap-3 overflow-x-auto">
            <div className="h-32 w-48 flex-shrink-0 animate-pulse rounded-[16px] bg-surface" />
            <div className="h-32 w-48 flex-shrink-0 animate-pulse rounded-[16px] bg-surface" />
          </div>
        </div>
        {/* Match history skeleton */}
        <div className="mb-3">
          <div className="h-5 w-28 animate-pulse rounded-lg bg-surface" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-[16px] bg-surface" />
          ))}
        </div>
      </div>
    )
  }

  const hasMatches = matches.length > 0

  // Empty state
  if (!hasMatches) {
    return (
      <div className="flex flex-col items-center justify-center px-4 pt-20 text-center">
        <span className="text-6xl mb-4">🏸</span>
        <h1 className="text-2xl font-bold text-text-primary mb-2">
          Welcome to SquashIQ!
        </h1>
        <p className="text-text-secondary mb-8 max-w-[280px]">
          Log your first match to start seeing insights.
        </p>
        <Button onClick={() => navigate('/log')} className="w-full max-w-[280px]">
          Log First Match
        </Button>
      </div>
    )
  }

  /** Render the correct insight component by ID */
  function renderInsight(id: InsightId) {
    switch (id) {
      case 'winRateByOpponent':
        return <WinRateByOpponent matches={matches!} players={players!} />
      case 'energyImpact':
        return <EnergyImpact matches={matches!} />
      case 'bestDays':
        return <BestDays matches={matches!} />
      case 'venueEffect':
        return <VenueEffect matches={matches!} venues={venues!} />
      case 'decidingGames':
        return <DecidingGames matches={matches!} games={games!} />
      case 'comebackIndex':
        return <ComebackIndex matches={matches!} games={games!} />
      case 'currentForm':
        return <CurrentForm matches={matches!} />
      case 'fastStarter':
        return <FastStarter matches={matches!} games={games!} />
      case 'winMethodDistribution':
        return <WinMethodDistribution rallyAnalyses={rallyAnalyses!} />
      case 'lossMethodDistribution':
        return <LossMethodDistribution rallyAnalyses={rallyAnalyses!} />
      case 'bestShotTrends':
        return <BestShotTrends rallyAnalyses={rallyAnalyses!} />
      case 'clutchRating':
        return <ClutchRating matches={matches!} games={games!} players={players!} />
    }
  }

  return (
    <div className="px-4 pt-6 pb-4">
      {/* Header with stats */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary">
          {currentUser?.name || 'Player'}
        </h1>
        <p className="text-lg text-text-secondary font-semibold mt-1">
          {wins}W - {losses}L
        </p>
        <div className="mt-2 flex items-center gap-2">
          <span className="text-xs text-text-secondary">Form:</span>
          <CurrentFormDots matches={matches} />
        </div>
      </div>

      {/* Pinned recommendation from most recent match */}
      {latestRecommendation && (
        <RecommendationCard
          recommendation={latestRecommendation}
          compact
          label="Focus for next match:"
        />
      )}

      {/* Insight cards — dynamically ordered with unlock animations */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-text-secondary mb-3">Insights</h2>
        <div className="space-y-3" id="insight-cards-container">
          {sortedInsights.map((config) => (
            <InsightCardWrapper
              key={config.id}
              id={config.id}
              isUnlocked={config.remaining === 0}
            >
              {renderInsight(config.id)}
            </InsightCardWrapper>
          ))}
        </div>
      </div>

      {/* Match history */}
      <div>
        <h2 className="text-lg font-semibold text-text-secondary mb-3">Match History</h2>
        <MatchHistoryList />
      </div>
    </div>
  )
}
