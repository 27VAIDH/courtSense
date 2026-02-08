import { Match, Game } from '@/db/types'

interface QuarterInNumbersProps {
  matches: Match[]
  games: Game[]
}

export default function QuarterInNumbers({
  matches,
  games,
}: QuarterInNumbersProps) {
  const totalMatches = matches.length
  const totalGames = games.length
  const tightGames = games.filter((g) => g.isTight).length
  const estimatedHours = (totalMatches * 0.5).toFixed(1)

  return (
    <div className="flex h-full flex-col items-center justify-center bg-gradient-to-br from-[#1A1A1A] via-bg to-[#0F0F0F] p-8">
      <div className="mb-8 text-center">
        <h2 className="mb-2 text-4xl font-bold text-text-primary">
          Your Quarter
        </h2>
        <h3 className="text-2xl font-bold text-primary">In Numbers</h3>
      </div>

      <div className="w-full space-y-6">
        {/* Total Matches */}
        <div className="rounded-2xl bg-surface p-6 text-center">
          <div className="text-6xl font-bold text-primary">{totalMatches}</div>
          <div className="mt-2 text-lg text-text-secondary">Matches Played</div>
        </div>

        {/* Total Games */}
        <div className="rounded-2xl bg-surface p-6 text-center">
          <div className="text-6xl font-bold text-secondary">{totalGames}</div>
          <div className="mt-2 text-lg text-text-secondary">Games Played</div>
        </div>

        {/* Tight Games */}
        <div className="rounded-2xl bg-surface p-6 text-center">
          <div className="flex items-center justify-center gap-2">
            <span className="text-6xl font-bold text-tight">{tightGames}</span>
            <span className="text-4xl">🔥</span>
          </div>
          <div className="mt-2 text-lg text-text-secondary">Tight Games</div>
        </div>

        {/* Estimated Hours */}
        <div className="rounded-2xl bg-surface p-6 text-center">
          <div className="text-6xl font-bold text-accent">
            {estimatedHours}
          </div>
          <div className="mt-2 text-lg text-text-secondary">
            Hours on Court
          </div>
        </div>
      </div>

      {/* Watermark */}
      <div className="mt-8 text-sm text-text-secondary opacity-50">
        SquashIQ
      </div>
    </div>
  )
}
