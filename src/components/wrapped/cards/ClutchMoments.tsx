import { Match, Game } from '@/db/types'

interface ClutchMomentsProps {
  matches: Match[]
  games: Game[]
}

export default function ClutchMoments({ games }: ClutchMomentsProps) {
  const tightGames = games.filter((g) => g.isTight)
  const tightGamesWon = tightGames.filter((g) => g.myScore > g.opponentScore)
  const clutchIndex =
    tightGames.length > 0
      ? ((tightGamesWon.length / tightGames.length) * 100).toFixed(0)
      : '0'

  // Find most dramatic tight game (closest score)
  const sortedByMargin = [...tightGames].sort((a, b) => {
    const marginA = Math.abs(a.myScore - a.opponentScore)
    const marginB = Math.abs(b.myScore - b.opponentScore)
    return marginA - marginB
  })

  const mostDramaticGame = sortedByMargin[0]

  // Find the match for the most dramatic game
  let dramaticMatchDesc = ''
  if (mostDramaticGame) {
    const won = mostDramaticGame.myScore > mostDramaticGame.opponentScore
    dramaticMatchDesc = `${mostDramaticGame.myScore}-${mostDramaticGame.opponentScore} ${won ? 'win' : 'loss'} in Game ${mostDramaticGame.gameNumber}`
  }

  return (
    <div className="flex h-full flex-col items-center justify-center bg-gradient-to-br from-[#1F1C2C] to-[#928DAB] p-8">
      <div className="mb-8 text-center">
        <h2 className="mb-2 text-4xl font-bold text-text-primary">
          Clutch Moments
        </h2>
        <div className="text-6xl">🧊</div>
      </div>

      {/* Tight Games Count */}
      <div className="mb-6 rounded-2xl bg-surface/20 p-6 text-center backdrop-blur-sm">
        <div className="flex items-center justify-center gap-2">
          <span className="text-7xl font-bold text-tight">{tightGames.length}</span>
          <span className="text-5xl">🔥</span>
        </div>
        <div className="mt-2 text-lg text-text-secondary">Tight Games</div>
      </div>

      {/* 8-8+ Index */}
      <div className="mb-6 rounded-2xl bg-surface/20 p-6 text-center backdrop-blur-sm">
        <div className="text-sm text-text-secondary">8-8+ Index</div>
        <div className="mt-2 text-7xl font-bold text-primary">{clutchIndex}%</div>
        <div className="mt-2 text-text-secondary">
          {tightGamesWon.length}W - {tightGames.length - tightGamesWon.length}L
        </div>
      </div>

      {/* Most Dramatic */}
      {dramaticMatchDesc && (
        <div className="rounded-2xl bg-surface-elevated px-6 py-4">
          <div className="text-sm text-text-secondary">Most Dramatic</div>
          <div className="mt-1 text-lg font-semibold text-text-primary">
            {dramaticMatchDesc}
          </div>
        </div>
      )}

      {!tightGames.length && (
        <div className="text-center text-text-secondary">
          No tight games yet - keep playing!
        </div>
      )}

      {/* Watermark */}
      <div className="mt-8 text-sm text-text-secondary opacity-50">
        SquashIQ
      </div>
    </div>
  )
}
