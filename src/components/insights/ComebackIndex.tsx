import { useMemo } from 'react'
import Card from '@/components/ui/Card'
import type { Match, Game } from '@/db/types'

interface ComebackIndexProps {
  matches: Match[]
  games: Game[]
}

const MIN_MATCHES = 10

export default function ComebackIndex({ matches, games }: ComebackIndexProps) {
  const stats = useMemo(() => {
    const gamesByMatch = new Map<number, Game[]>()
    for (const g of games) {
      const arr = gamesByMatch.get(g.matchId) || []
      arr.push(g)
      gamesByMatch.set(g.matchId, arr)
    }

    let lostGame1Count = 0
    let comebackWins = 0

    for (const m of matches) {
      if (m.id === undefined) continue
      const matchGames = gamesByMatch.get(m.id)
      if (!matchGames) continue

      const game1 = matchGames.find((g) => g.gameNumber === 1)
      if (!game1 || (game1.myScore === 0 && game1.opponentScore === 0)) continue

      if (game1.opponentScore > game1.myScore) {
        lostGame1Count++
        if (m.result.startsWith('W')) {
          comebackWins++
        }
      }
    }

    const comebackRate =
      lostGame1Count > 0 ? Math.round((comebackWins / lostGame1Count) * 100) : 0

    return { lostGame1Count, comebackWins, comebackRate }
  }, [matches, games])

  // Locked state
  if (matches.length < MIN_MATCHES) {
    const remaining = MIN_MATCHES - matches.length
    return (
      <Card className="relative overflow-hidden">
        <div className="opacity-40">
          <h3 className="text-sm font-semibold text-text-primary mb-2">
            Comeback Index
          </h3>
          <div className="flex items-center justify-center py-4">
            <GaugePlaceholder />
          </div>
        </div>
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-surface/60">
          <span className="text-2xl mb-1">🔒</span>
          <p className="text-xs text-text-secondary text-center px-4">
            Log {remaining} more match{remaining !== 1 ? 'es' : ''} to unlock
          </p>
        </div>
      </Card>
    )
  }

  // No Game 1 losses — nothing to analyze
  if (stats.lostGame1Count === 0) {
    return (
      <Card>
        <h3 className="text-sm font-semibold text-text-primary mb-3">
          Comeback Index
        </h3>
        <div className="text-center py-4">
          <span className="text-3xl mb-2 block">🏆</span>
          <p className="text-sm text-text-secondary">
            You haven&apos;t lost a Game 1 yet — no comebacks needed!
          </p>
        </div>
      </Card>
    )
  }

  const { color, label } = getZone(stats.comebackRate)

  return (
    <Card>
      <h3 className="text-sm font-semibold text-text-primary mb-3">
        Comeback Index
      </h3>
      <div className="flex flex-col items-center">
        <GaugeMeter value={stats.comebackRate} />

        <span className="text-sm font-bold mt-2" style={{ color }}>
          {label}
        </span>

        <p className="text-xs text-text-secondary text-center mt-2 px-2">
          After losing Game 1, you come back to win {stats.comebackRate}% of
          matches
        </p>

        <div className="flex gap-4 mt-3 text-xs text-text-secondary">
          <span>
            Comebacks:{' '}
            <span className="text-win font-semibold">{stats.comebackWins}</span>
          </span>
          <span>
            Game 1 losses:{' '}
            <span className="text-text-primary font-semibold">
              {stats.lostGame1Count}
            </span>
          </span>
        </div>
      </div>
    </Card>
  )
}

function getZone(value: number): { color: string; label: string } {
  if (value >= 80) return { color: '#00E676', label: 'Elite' }
  if (value >= 60) return { color: '#00C853', label: 'Strong' }
  if (value >= 40) return { color: '#FFD600', label: 'Average' }
  return { color: '#FF5252', label: 'Weak' }
}

/**
 * Semicircular gauge meter.
 * The arc goes from left (0%) to right (100%), with the needle pointing to the value.
 * Angles: 180° (left) to 0° (right), measured in standard math convention.
 */
function GaugeMeter({ value }: { value: number }) {
  const r = 60
  const sw = 10
  const cx = 70
  const cy = 70
  const halfCirc = Math.PI * r

  // Needle angle: 180° for 0%, 0° for 100%
  const needleRad = ((180 - (value / 100) * 180) * Math.PI) / 180
  const needleLen = r - 8
  const nx = cx + needleLen * Math.cos(needleRad)
  const ny = cy - needleLen * Math.sin(needleRad)

  // Zone boundaries (each defined by start% and end%)
  const zones = [
    { s: 0, e: 39, color: '#FF5252' },
    { s: 39, e: 59, color: '#FFD600' },
    { s: 59, e: 79, color: '#00C853' },
    { s: 79, e: 100, color: '#00E676' },
  ]

  return (
    <svg width={140} height={82} viewBox="0 0 140 82">
      {/* Background arc */}
      <path
        d={semiArcPath(cx, cy, r)}
        fill="none"
        stroke="#242424"
        strokeWidth={sw}
        strokeLinecap="round"
      />

      {/* Colored zone arcs (faint) */}
      {zones.map((z, i) => {
        const len = ((z.e - z.s) / 100) * halfCirc
        const offset = halfCirc - (z.e / 100) * halfCirc
        return (
          <path
            key={i}
            d={semiArcPath(cx, cy, r)}
            fill="none"
            stroke={z.color}
            strokeWidth={sw}
            strokeLinecap="butt"
            strokeDasharray={`${len} ${halfCirc - len}`}
            strokeDashoffset={offset}
            opacity={0.25}
          />
        )
      })}

      {/* Value fill arc */}
      <path
        d={semiArcPath(cx, cy, r)}
        fill="none"
        stroke={getZone(value).color}
        strokeWidth={sw}
        strokeLinecap="round"
        strokeDasharray={halfCirc}
        strokeDashoffset={halfCirc - (value / 100) * halfCirc}
      />

      {/* 50% tick mark */}
      <line
        x1={cx}
        y1={cy - r + sw / 2 + 3}
        x2={cx}
        y2={cy - r - sw / 2 - 3}
        stroke="#B0B0B0"
        strokeWidth={1.5}
        opacity={0.5}
      />

      {/* Needle */}
      <line
        x1={cx}
        y1={cy}
        x2={nx}
        y2={ny}
        stroke="#FFFFFF"
        strokeWidth={2}
        strokeLinecap="round"
      />
      <circle cx={cx} cy={cy} r={4} fill="#FFFFFF" />

      {/* Labels */}
      <text x={6} y={78} fontSize={9} fill="#B0B0B0" textAnchor="start">
        0
      </text>
      <text x={cx} y={8} fontSize={8} fill="#B0B0B0" textAnchor="middle">
        Avg
      </text>
      <text x={134} y={78} fontSize={9} fill="#B0B0B0" textAnchor="end">
        100
      </text>
    </svg>
  )
}

function GaugePlaceholder() {
  return (
    <svg width={140} height={82} viewBox="0 0 140 82">
      <path
        d={semiArcPath(70, 70, 60)}
        fill="none"
        stroke="#242424"
        strokeWidth={10}
        strokeLinecap="round"
      />
    </svg>
  )
}

/** SVG path for a semicircle arc from left (180°) to right (0°) */
function semiArcPath(cx: number, cy: number, r: number): string {
  return `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`
}
