import OpponentManager from '@/components/opponents/OpponentManager'
import VenueManager from '@/components/venues/VenueManager'
import BadgeGrid from '@/components/badges/BadgeGrid'
import ArchetypeCard from '@/components/archetype/ArchetypeCard'
import { useMatches, useGames, useRallyAnalyses } from '@/db/hooks'

export default function Profile() {
  const matches = useMatches() ?? []
  const games = useGames() ?? []
  const rallyAnalyses = useRallyAnalyses() ?? []

  return (
    <div className="min-h-screen px-4 pt-6 pb-24">
      <h1 className="mb-6 text-2xl font-bold text-text-primary">Profile</h1>

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
    </div>
  )
}
