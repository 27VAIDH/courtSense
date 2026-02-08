import { useState } from 'react'
import OpponentManager from '@/components/opponents/OpponentManager'
import VenueManager from '@/components/venues/VenueManager'
import BadgeGrid from '@/components/badges/BadgeGrid'
import ArchetypeCard from '@/components/archetype/ArchetypeCard'
import SeasonWrapped from '@/components/wrapped/SeasonWrapped'
import Button from '@/components/ui/Button'
import { useMatches, useGames, useRallyAnalyses, usePlayers } from '@/db/hooks'

export default function Profile() {
  const matches = useMatches() ?? []
  const games = useGames() ?? []
  const rallyAnalyses = useRallyAnalyses() ?? []
  const players = usePlayers() ?? []
  const [showWrapped, setShowWrapped] = useState(false)

  const hasEnoughMatches = matches.length >= 20

  return (
    <div className="min-h-screen px-4 pt-6 pb-24">
      <h1 className="mb-6 text-2xl font-bold text-text-primary">Profile</h1>

      {/* Season Wrapped Button */}
      {hasEnoughMatches && (
        <div className="mb-6">
          <Button
            variant="primary"
            onClick={() => setShowWrapped(true)}
          >
            🎉 Season Wrapped
          </Button>
        </div>
      )}

      {/* Archetype Card */}
      <div className="mb-6">
        <ArchetypeCard
          matches={matches}
          games={games}
          rallyAnalyses={rallyAnalyses}
        />
      </div>

      <BadgeGrid />
      <OpponentManager />
      <div className="mt-8">
        <VenueManager />
      </div>

      {/* Season Wrapped Modal */}
      {showWrapped && (
        <SeasonWrapped
          matches={matches}
          games={games}
          players={players}
          onClose={() => setShowWrapped(false)}
        />
      )}
    </div>
  )
}
