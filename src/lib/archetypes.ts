import type { Match, Game, RallyAnalysis } from '@/db/types'

export interface Archetype {
  name: string
  color: string
  description: string
  strength: string
  weaknessHint: string
  radarProfile: {
    aggression: number
    fitness: number
    consistency: number
    clutch: number
    adaptability: number
    deception: number
  }
}

export interface TraitScores {
  aggression: number
  fitness: number
  consistency: number
  clutch: number
  adaptability: number
  deception: number
}

export interface ArchetypeResult {
  primary: Archetype
  secondary: Archetype | null
  traitScores: TraitScores
}

// Archetype definitions
export const ARCHETYPES: Record<string, Archetype> = {
  assassin: {
    name: 'The Assassin',
    color: '#FF1744',
    description: 'You go for the kill. High-risk, high-reward attacking play defines your game.',
    strength: 'Explosive shot-making that ends rallies quickly',
    weaknessHint: 'Consistency under pressure — when shots are off, errors pile up',
    radarProfile: {
      aggression: 95,
      fitness: 60,
      consistency: 45,
      clutch: 70,
      adaptability: 55,
      deception: 75,
    },
  },
  wall: {
    name: 'The Wall',
    color: '#2979FF',
    description: 'You outlast opponents with relentless retrieving and superior fitness.',
    strength: 'Mental and physical endurance — you never give up',
    weaknessHint: 'Finishing points — sometimes you wait for errors instead of creating winners',
    radarProfile: {
      aggression: 40,
      fitness: 95,
      consistency: 85,
      clutch: 65,
      adaptability: 70,
      deception: 50,
    },
  },
  strategist: {
    name: 'The Strategist',
    color: '#7C4DFF',
    description: 'You control the pace and construct points with intelligent shot selection.',
    strength: 'Reading opponents and exploiting weaknesses methodically',
    weaknessHint: 'Speed of execution — overthinking can slow you down',
    radarProfile: {
      aggression: 55,
      fitness: 70,
      consistency: 80,
      clutch: 75,
      adaptability: 90,
      deception: 85,
    },
  },
  closer: {
    name: 'The Closer',
    color: '#00E676',
    description: 'Ice in your veins. You thrive when the pressure is highest.',
    strength: 'Clutch performance — you win tight games and deciding moments',
    weaknessHint: 'Early-game focus — you sometimes start slow and rely on comebacks',
    radarProfile: {
      aggression: 70,
      fitness: 75,
      consistency: 75,
      clutch: 95,
      adaptability: 80,
      deception: 65,
    },
  },
  streaker: {
    name: 'The Streaker',
    color: '#FF6D00',
    description: 'You ride momentum. When you are hot, you are unstoppable.',
    strength: 'Explosive winning runs when confidence is high',
    weaknessHint: 'Volatility — dips in form can be hard to recover from',
    radarProfile: {
      aggression: 75,
      fitness: 65,
      consistency: 40,
      clutch: 60,
      adaptability: 55,
      deception: 70,
    },
  },
  chameleon: {
    name: 'The Chameleon',
    color: '#00BFA5',
    description: 'You adapt your style to any opponent, any situation.',
    strength: 'Versatility — you have answers for every opponent',
    weaknessHint: 'Identity — sometimes you need a signature weapon',
    radarProfile: {
      aggression: 65,
      fitness: 70,
      consistency: 70,
      adaptability: 95,
      deception: 80,
      clutch: 65,
    },
  },
}

/**
 * Calculate trait scores based on match and rally analysis data.
 */
function calculateTraitScores(
  matches: Match[],
  games: Game[],
  rallyAnalyses: RallyAnalysis[]
): TraitScores {
  // Aggression: based on win methods from rally analyses
  let aggressionScore = 50 // baseline
  const winnersCount = rallyAnalyses.filter(
    (r) => r.winMethod === 'Winners / Kill shots'
  ).length
  const serveCount = rallyAnalyses.filter(
    (r) => r.winMethod === 'Serve dominance'
  ).length
  const totalAnalyses = rallyAnalyses.length
  if (totalAnalyses > 0) {
    const aggressionRatio = (winnersCount + serveCount) / totalAnalyses
    aggressionScore = Math.min(100, 30 + aggressionRatio * 100)
  }

  // Fitness: based on rally length from rally analyses
  let fitnessScore = 50
  const longRallyCount = rallyAnalyses.filter(
    (r) => r.rallyLength === 'Long (10+ shots)'
  ).length
  const mediumRallyCount = rallyAnalyses.filter(
    (r) => r.rallyLength === 'Medium (5-10 shots)'
  ).length
  if (totalAnalyses > 0) {
    const fitnessRatio =
      (longRallyCount * 1.5 + mediumRallyCount * 0.75) / totalAnalyses
    fitnessScore = Math.min(100, 30 + fitnessRatio * 70)
  }

  // Consistency: based on win rate variance (lower variance = higher consistency)
  let consistencyScore = 50
  if (matches.length >= 10) {
    // Calculate rolling win rate for each 5-match window
    const sortedMatches = [...matches].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    )
    const winRates: number[] = []
    for (let i = 4; i < sortedMatches.length; i++) {
      const window = sortedMatches.slice(i - 4, i + 1)
      const wins = window.filter((m) => m.result.startsWith('W')).length
      winRates.push((wins / 5) * 100)
    }
    if (winRates.length > 0) {
      const mean = winRates.reduce((sum, wr) => sum + wr, 0) / winRates.length
      const variance =
        winRates.reduce((sum, wr) => sum + Math.pow(wr - mean, 2), 0) /
        winRates.length
      const stdDev = Math.sqrt(variance)
      // Lower stdDev = higher consistency. Cap at 100.
      consistencyScore = Math.max(0, Math.min(100, 100 - stdDev * 2))
    }
  }

  // Clutch: based on tight game win rate (8-8+ Index)
  let clutchScore = 50
  const tightGames = games.filter((g) => g.isTight)
  if (tightGames.length >= 5) {
    const tightWins = tightGames.filter(
      (g) => g.myScore > g.opponentScore
    ).length
    clutchScore = (tightWins / tightGames.length) * 100
  }

  // Adaptability: based on opponent-specific win rate variance (lower = adapts to all opponents)
  let adaptabilityScore = 50
  if (matches.length >= 10) {
    const opponentWinRates = new Map<number, number>()
    const opponentCounts = new Map<number, number>()

    for (const m of matches) {
      const wins = opponentWinRates.get(m.opponentId) ?? 0
      const count = opponentCounts.get(m.opponentId) ?? 0
      if (m.result.startsWith('W')) {
        opponentWinRates.set(m.opponentId, wins + 1)
      }
      opponentCounts.set(m.opponentId, count + 1)
    }

    const winRatesByOpponent: number[] = []
    for (const [oppId, count] of opponentCounts.entries()) {
      if (count >= 3) {
        // Only count opponents faced 3+ times
        const wins = opponentWinRates.get(oppId) ?? 0
        winRatesByOpponent.push((wins / count) * 100)
      }
    }

    if (winRatesByOpponent.length >= 2) {
      const mean =
        winRatesByOpponent.reduce((sum, wr) => sum + wr, 0) /
        winRatesByOpponent.length
      const variance =
        winRatesByOpponent.reduce((sum, wr) => sum + Math.pow(wr - mean, 2), 0) /
        winRatesByOpponent.length
      const stdDev = Math.sqrt(variance)
      // Lower variance = higher adaptability
      adaptabilityScore = Math.max(0, Math.min(100, 100 - stdDev * 1.5))
    }
  }

  // Deception: based on drop shots/boasts from best shots in rally analyses
  let deceptionScore = 50
  const dropShotCount = rallyAnalyses.filter(
    (r) =>
      r.bestShots?.includes('Drop shot') || r.bestShots?.includes('Boast')
  ).length
  const deceptionMethodCount = rallyAnalyses.filter(
    (r) => r.winMethod === 'Drop shots / Deception'
  ).length
  if (totalAnalyses > 0) {
    const deceptionRatio =
      (dropShotCount + deceptionMethodCount * 1.5) / totalAnalyses
    deceptionScore = Math.min(100, 30 + deceptionRatio * 70)
  }

  return {
    aggression: Math.round(aggressionScore),
    fitness: Math.round(fitnessScore),
    consistency: Math.round(consistencyScore),
    clutch: Math.round(clutchScore),
    adaptability: Math.round(adaptabilityScore),
    deception: Math.round(deceptionScore),
  }
}

/**
 * Calculate the similarity score between trait scores and an archetype's radar profile.
 * Returns a score from 0-100 where 100 is a perfect match.
 */
function calculateArchetypeMatch(
  traitScores: TraitScores,
  archetype: Archetype
): number {
  const traits: (keyof TraitScores)[] = [
    'aggression',
    'fitness',
    'consistency',
    'clutch',
    'adaptability',
    'deception',
  ]

  let totalDifference = 0
  for (const trait of traits) {
    const difference = Math.abs(
      traitScores[trait] - archetype.radarProfile[trait]
    )
    totalDifference += difference
  }

  // Maximum possible difference is 600 (6 traits * 100 each)
  // Convert to similarity score (0-100)
  const similarity = Math.max(0, 100 - (totalDifference / 6))
  return similarity
}

/**
 * Determine the player's archetype based on their match and rally analysis data.
 * Requires minimum 10 matches AND 5 rally analyses.
 */
export function determineArchetype(
  matches: Match[],
  games: Game[],
  rallyAnalyses: RallyAnalysis[]
): ArchetypeResult | null {
  // Check minimum data requirements
  if (matches.length < 10 || rallyAnalyses.length < 5) {
    return null
  }

  // Calculate trait scores
  const traitScores = calculateTraitScores(matches, games, rallyAnalyses)

  // Calculate match score for each archetype
  const archetypeMatches = Object.values(ARCHETYPES).map((archetype) => ({
    archetype,
    matchScore: calculateArchetypeMatch(traitScores, archetype),
  }))

  // Sort by match score descending
  archetypeMatches.sort((a, b) => b.matchScore - a.matchScore)

  const primary = archetypeMatches[0].archetype
  const primaryScore = archetypeMatches[0].matchScore

  // Determine secondary archetype if within 10% of primary
  let secondary: Archetype | null = null
  if (archetypeMatches.length > 1) {
    const secondaryScore = archetypeMatches[1].matchScore
    if (primaryScore - secondaryScore <= 10) {
      secondary = archetypeMatches[1].archetype
    }
  }

  return {
    primary,
    secondary,
    traitScores,
  }
}
