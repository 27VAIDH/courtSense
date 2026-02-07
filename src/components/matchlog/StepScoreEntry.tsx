import { useMemo } from 'react'
import { usePlayers } from '@/db/hooks'
import { useMatchLogStore, type GameScore } from '@/stores/matchLogStore'
import Card from '@/components/ui/Card'

const QUICK_PRESETS = [
  { my: 11, opp: 0 },
  { my: 11, opp: 5 },
  { my: 11, opp: 8 },
  { my: 11, opp: 9 },
]

function isTightGame(myScore: number, oppScore: number): boolean {
  return myScore >= 8 && oppScore >= 8
}

function computeResult(games: GameScore[]): { myWins: number; oppWins: number; text: string; isWin: boolean | null } {
  let myWins = 0
  let oppWins = 0
  for (const g of games) {
    if (g.myScore === 0 && g.opponentScore === 0) continue
    if (g.myScore > g.opponentScore) myWins++
    else if (g.opponentScore > g.myScore) oppWins++
  }
  if (myWins === 0 && oppWins === 0) return { myWins, oppWins, text: '', isWin: null }
  const isWin = myWins > oppWins
  const text = isWin ? `WIN ${myWins}-${oppWins}` : `LOSS ${myWins}-${oppWins}`
  return { myWins, oppWins, text, isWin }
}

function gameHasScore(g: GameScore): boolean {
  return g.myScore > 0 || g.opponentScore > 0
}

export default function StepScoreEntry() {
  const players = usePlayers()
  const { opponentId, games, format, setGameScore } = useMatchLogStore()

  const opponent = useMemo(
    () => players?.find((p) => p.id === opponentId),
    [players, opponentId]
  )

  const opponentName = opponent?.name ?? 'Opponent'
  const result = useMemo(() => computeResult(games), [games])
  const totalGames = format === 'Bo5' ? 5 : 3

  function updateScore(gameIndex: number, field: 'myScore' | 'opponentScore', delta: number) {
    const game = games[gameIndex]
    const newValue = Math.max(0, game[field] + delta)
    setGameScore(gameIndex, { ...game, [field]: newValue })
  }

  function applyPreset(gameIndex: number, my: number, opp: number) {
    setGameScore(gameIndex, { myScore: my, opponentScore: opp })
  }

  return (
    <div className="flex flex-1 flex-col gap-4 px-4 pt-2 pb-4">
      {/* Match Result Banner */}
      {result.text && (
        <div className="text-center">
          <span
            className={`text-2xl font-bold ${
              result.isWin ? 'text-win' : 'text-loss'
            }`}
          >
            {result.text}
          </span>
        </div>
      )}

      {/* Game Cards */}
      {games.slice(0, totalGames).map((game, index) => {
        const tight = isTightGame(game.myScore, game.opponentScore)
        // Collapse logic: hide game if no score AND a later game also has no score
        // AND the match is already decided (enough wins)
        const matchDecided =
          result.myWins > totalGames / 2 || result.oppWins > totalGames / 2
        const canCollapse =
          matchDecided && !gameHasScore(game) && index > 0

        if (canCollapse) {
          return (
            <Card key={index} className="opacity-40">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-text-secondary">
                  Game {index + 1}
                </span>
                <span className="text-xs text-text-secondary">Not needed</span>
              </div>
            </Card>
          )
        }

        return (
          <Card key={index}>
            {/* Game Header */}
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-medium text-text-secondary">
                Game {index + 1}
                {tight && <span className="ml-1">🔥</span>}
              </span>
            </div>

            {/* Score Entry */}
            <div className="flex items-center justify-center gap-4">
              {/* My Score */}
              <div className="flex flex-col items-center gap-1">
                <span className="text-xs text-text-secondary">You</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => updateScore(index, 'myScore', -1)}
                    className="flex min-h-[48px] min-w-[48px] items-center justify-center rounded-[12px] bg-surface-elevated text-xl font-bold text-text-primary active:opacity-80"
                    aria-label={`Decrease your score in game ${index + 1}`}
                  >
                    −
                  </button>
                  <span className="min-w-[48px] text-center text-3xl font-bold text-text-primary">
                    {game.myScore}
                  </span>
                  <button
                    type="button"
                    onClick={() => updateScore(index, 'myScore', 1)}
                    className="flex min-h-[48px] min-w-[48px] items-center justify-center rounded-[12px] bg-surface-elevated text-xl font-bold text-text-primary active:opacity-80"
                    aria-label={`Increase your score in game ${index + 1}`}
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Divider */}
              <span className="text-xl text-text-secondary">–</span>

              {/* Opponent Score */}
              <div className="flex flex-col items-center gap-1">
                <span className="text-xs text-text-secondary">{opponentName}</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => updateScore(index, 'opponentScore', -1)}
                    className="flex min-h-[48px] min-w-[48px] items-center justify-center rounded-[12px] bg-surface-elevated text-xl font-bold text-text-primary active:opacity-80"
                    aria-label={`Decrease ${opponentName}'s score in game ${index + 1}`}
                  >
                    −
                  </button>
                  <span className="min-w-[48px] text-center text-3xl font-bold text-text-primary">
                    {game.opponentScore}
                  </span>
                  <button
                    type="button"
                    onClick={() => updateScore(index, 'opponentScore', 1)}
                    className="flex min-h-[48px] min-w-[48px] items-center justify-center rounded-[12px] bg-surface-elevated text-xl font-bold text-text-primary active:opacity-80"
                    aria-label={`Increase ${opponentName}'s score in game ${index + 1}`}
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Score Presets */}
            <div className="mt-3 flex justify-center gap-2">
              {QUICK_PRESETS.map((preset) => (
                <button
                  key={`${preset.my}-${preset.opp}`}
                  type="button"
                  onClick={() => applyPreset(index, preset.my, preset.opp)}
                  className={`min-h-[36px] rounded-[20px] border px-3 text-xs font-medium transition-colors ${
                    game.myScore === preset.my && game.opponentScore === preset.opp
                      ? 'border-primary bg-primary/20 text-primary'
                      : 'border-white/20 text-text-secondary'
                  }`}
                >
                  {preset.my}-{preset.opp}
                </button>
              ))}
            </div>
          </Card>
        )
      })}
    </div>
  )
}
