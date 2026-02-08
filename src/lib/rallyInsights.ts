import type { RallyAnalysis } from '@/db/types'

export type PlayStyle =
  | 'Aggressive Attacker'
  | 'Patient Constructor'
  | 'Retriever'
  | 'Serve & Volley'
  | 'All-Court Player'

interface PlayStyleResult {
  primary: PlayStyle
  confidence: number
}

/**
 * Determines the player's play style based on rally analysis data.
 * Uses a scoring system based on win method, rally length, and court coverage.
 */
export function determinePlayStyle(analysis: RallyAnalysis): PlayStyleResult {
  let aggressiveScore = 0
  let patientScore = 0
  let retrieverScore = 0
  let serveVolleyScore = 0
  let allCourtScore = 0

  // Win method scoring
  if (analysis.winMethod === 'Winners / Kill shots') {
    aggressiveScore += 3
    serveVolleyScore += 1
  } else if (analysis.winMethod === 'Opponent errors') {
    patientScore += 2
    retrieverScore += 2
  } else if (analysis.winMethod === 'Long rallies / Outlasted them') {
    retrieverScore += 3
    patientScore += 1
  } else if (analysis.winMethod === 'Serve dominance') {
    serveVolleyScore += 3
  } else if (analysis.winMethod === 'Drop shots / Deception') {
    patientScore += 3
    aggressiveScore += 1
  }

  // Rally length scoring
  if (analysis.rallyLength === 'Short (1-4 shots)') {
    aggressiveScore += 2
    serveVolleyScore += 2
  } else if (analysis.rallyLength === 'Medium (5-10 shots)') {
    allCourtScore += 2
  } else if (analysis.rallyLength === 'Long (10+ shots)') {
    retrieverScore += 2
    patientScore += 1
  }

  // Court coverage scoring
  if (analysis.courtCoverage === 'Dominated the T') {
    aggressiveScore += 2
    allCourtScore += 2
  } else if (analysis.courtCoverage === 'Stuck in back corners') {
    retrieverScore += 1
  } else if (analysis.courtCoverage === 'Good movement overall') {
    allCourtScore += 3
    patientScore += 1
  } else if (analysis.courtCoverage === 'Sluggish / Heavy legs') {
    // Neutral, doesn't indicate style
  }

  // Find the highest score
  const scores = [
    { style: 'Aggressive Attacker' as PlayStyle, score: aggressiveScore },
    { style: 'Patient Constructor' as PlayStyle, score: patientScore },
    { style: 'Retriever' as PlayStyle, score: retrieverScore },
    { style: 'Serve & Volley' as PlayStyle, score: serveVolleyScore },
    { style: 'All-Court Player' as PlayStyle, score: allCourtScore },
  ]

  const sorted = scores.sort((a, b) => b.score - a.score)
  const maxScore = sorted[0].score
  const totalScore = scores.reduce((sum, s) => sum + s.score, 0)
  const confidence = totalScore > 0 ? Math.round((maxScore / totalScore) * 100) : 0

  return {
    primary: sorted[0].style,
    confidence,
  }
}

/**
 * Aggregates play styles across all rally analyses and returns the dominant style.
 */
export function aggregatePlayStyles(analyses: RallyAnalysis[]): PlayStyle | null {
  if (analyses.length === 0) return null

  const styleCounts: Record<PlayStyle, number> = {
    'Aggressive Attacker': 0,
    'Patient Constructor': 0,
    'Retriever': 0,
    'Serve & Volley': 0,
    'All-Court Player': 0,
  }

  for (const analysis of analyses) {
    const { primary } = determinePlayStyle(analysis)
    styleCounts[primary]++
  }

  // Find most common style
  let maxCount = 0
  let dominantStyle: PlayStyle = 'All-Court Player'
  for (const [style, count] of Object.entries(styleCounts)) {
    if (count > maxCount) {
      maxCount = count
      dominantStyle = style as PlayStyle
    }
  }

  return dominantStyle
}
