import { useMemo } from 'react'
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  ResponsiveContainer,
} from 'recharts'
import Card from '@/components/ui/Card'
import type { Match, Game, RallyAnalysis } from '@/db/types'
import { determineArchetype, type ArchetypeResult } from '@/lib/archetypes'
import ArchetypeEvolution from './ArchetypeEvolution'

interface ArchetypeCardProps {
  matches: Match[]
  games: Game[]
  rallyAnalyses: RallyAnalysis[]
}

const MIN_MATCHES = 10
const MIN_RALLY_ANALYSES = 5

export default function ArchetypeCard({
  matches,
  games,
  rallyAnalyses,
}: ArchetypeCardProps) {
  const archetypeResult: ArchetypeResult | null = useMemo(
    () => determineArchetype(matches, games, rallyAnalyses),
    [matches, games, rallyAnalyses]
  )

  // Check data requirements for locked state
  const matchesNeeded = Math.max(0, MIN_MATCHES - matches.length)
  const rallyAnalysesNeeded = Math.max(0, MIN_RALLY_ANALYSES - rallyAnalyses.length)
  const isLocked = archetypeResult === null

  // Prepare radar chart data
  const radarData = useMemo(() => {
    if (!archetypeResult) return []

    return [
      { trait: 'Aggression', value: archetypeResult.traitScores.aggression },
      { trait: 'Fitness', value: archetypeResult.traitScores.fitness },
      { trait: 'Consistency', value: archetypeResult.traitScores.consistency },
      { trait: 'Clutch', value: archetypeResult.traitScores.clutch },
      { trait: 'Adaptability', value: archetypeResult.traitScores.adaptability },
      { trait: 'Deception', value: archetypeResult.traitScores.deception },
    ]
  }, [archetypeResult])

  // Locked state
  if (isLocked) {
    return (
      <Card className="relative overflow-hidden">
        <div className="opacity-30 blur-sm">
          <h3 className="text-lg font-bold text-text-primary mb-2">
            Your Archetype
          </h3>
          <div className="flex items-center justify-center py-8">
            <div className="w-48 h-48 rounded-full bg-surface-elevated" />
          </div>
          <p className="text-sm text-text-secondary mb-1">
            Strength: Unknown
          </p>
          <p className="text-sm text-text-secondary">
            Growth area: Unknown
          </p>
        </div>
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-surface/80">
          <span className="text-3xl mb-2">🔒</span>
          <p className="text-sm text-text-primary font-semibold text-center px-4 mb-1">
            Discover your archetype
          </p>
          <p className="text-xs text-text-secondary text-center px-6">
            {matchesNeeded > 0 && (
              <>
                Log {matchesNeeded} more match{matchesNeeded !== 1 ? 'es' : ''}
                {rallyAnalysesNeeded > 0 ? ' and ' : ' '}
              </>
            )}
            {rallyAnalysesNeeded > 0 && (
              <>
                add rally analysis to {rallyAnalysesNeeded} more match
                {rallyAnalysesNeeded !== 1 ? 'es' : ''}
              </>
            )}
            {matchesNeeded === 0 && rallyAnalysesNeeded === 0 && 'Complete more rally analyses'}
          </p>
        </div>
      </Card>
    )
  }

  const { primary, secondary } = archetypeResult

  return (
    <Card
      className="overflow-hidden"
      style={{
        borderTop: `4px solid ${primary.color}`,
      }}
    >
      <div className="space-y-4">
        {/* Archetype name and description */}
        <div>
          <h3
            className="text-2xl font-bold mb-2"
            style={{ color: primary.color }}
          >
            {primary.name}
          </h3>
          <p className="text-sm text-text-secondary mb-3">
            {primary.description}
          </p>
          <div className="space-y-1.5">
            <p className="text-sm">
              <span className="text-text-secondary">Strength: </span>
              <span className="text-text-primary">{primary.strength}</span>
            </p>
            <p className="text-sm">
              <span className="text-text-secondary">Growth area: </span>
              <span className="text-text-primary">{primary.weaknessHint}</span>
            </p>
          </div>
        </div>

        {/* Secondary archetype if exists */}
        {secondary && (
          <div className="pt-2 border-t border-surface-elevated">
            <p className="text-xs text-text-secondary">
              Secondary:{' '}
              <span
                className="font-semibold"
                style={{ color: secondary.color }}
              >
                {secondary.name}
              </span>
            </p>
          </div>
        )}

        {/* Radar Chart */}
        <div className="pt-2">
          <h4 className="text-xs font-semibold text-text-secondary mb-3 uppercase tracking-wide">
            Your Trait Profile
          </h4>
          <div className="w-full h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="#242424" />
                <PolarAngleAxis
                  dataKey="trait"
                  tick={{ fill: '#B0B0B0', fontSize: 11 }}
                />
                <Radar
                  name="Traits"
                  dataKey="value"
                  stroke={primary.color}
                  fill={primary.color}
                  fillOpacity={0.3}
                  strokeWidth={2}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Evolution Timeline */}
        <div className="pt-2 border-t border-surface-elevated">
          <ArchetypeEvolution currentArchetype={primary} />
        </div>
      </div>
    </Card>
  )
}
