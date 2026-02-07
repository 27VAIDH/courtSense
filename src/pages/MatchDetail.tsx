import { useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useMatches, useGames, usePlayers, useVenues } from '@/db/hooks'
import { db } from '@/db/database'
import type { Recommendation } from '@/lib/recommendations'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Chip from '@/components/ui/Chip'
import RecommendationCard from '@/components/recommendations/RecommendationCard'

const VIBES = ['Intense', 'Casual', 'Frustrating', 'Focused', 'Fun', 'Grind']
const QUICK_TAGS = ['Good day', 'Off day', 'New strategy', 'Comeback', 'Dominated', 'Lucky win', 'Close']
const ENERGY_OPTIONS: { level: 'Low' | 'Medium' | 'High'; icon: string; label: string }[] = [
  { level: 'Low', icon: '🪫', label: 'Low' },
  { level: 'Medium', icon: '⚡', label: 'Medium' },
  { level: 'High', icon: '🔥', label: 'High' },
]

const QUICK_PRESETS = [
  { my: 11, opp: 0 },
  { my: 11, opp: 5 },
  { my: 11, opp: 8 },
  { my: 11, opp: 9 },
]

interface EditGameScore {
  myScore: number
  opponentScore: number
}

function formatDate(date: Date): string {
  const d = new Date(date)
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatTime(date: Date): string {
  const d = new Date(date)
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

export default function MatchDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const matchId = Number(id)

  const matches = useMatches()
  const allGames = useGames(matchId)
  const players = usePlayers()
  const venues = useVenues()

  const [isEditing, setIsEditing] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [saving, setSaving] = useState(false)

  // Edit state
  const [editGames, setEditGames] = useState<EditGameScore[]>([])
  const [editEnergy, setEditEnergy] = useState<'Low' | 'Medium' | 'High' | null>(null)
  const [editVibe, setEditVibe] = useState<string | null>(null)
  const [editTags, setEditTags] = useState<string[]>([])
  const [editNote, setEditNote] = useState('')

  const match = useMemo(
    () => matches?.find((m) => m.id === matchId),
    [matches, matchId]
  )

  const sortedGames = useMemo(
    () => allGames ? [...allGames].sort((a, b) => a.gameNumber - b.gameNumber) : [],
    [allGames]
  )

  const opponent = useMemo(
    () => players?.find((p) => p.id === match?.opponentId),
    [players, match?.opponentId]
  )

  const venue = useMemo(
    () => venues?.find((v) => v.id === match?.venueId),
    [venues, match?.venueId]
  )

  const recommendation = useMemo((): Recommendation | null => {
    if (!match?.recommendationText) return null
    try {
      return JSON.parse(match.recommendationText) as Recommendation
    } catch {
      return null
    }
  }, [match])

  // Loading state
  if (matches === undefined || allGames === undefined || players === undefined) {
    return (
      <div className="px-4 pt-6 pb-24">
        <div className="mb-4 h-12 w-20 animate-pulse rounded bg-surface" />
        <div className="space-y-4">
          <div className="h-32 animate-pulse rounded-[16px] bg-surface" />
          <div className="h-24 animate-pulse rounded-[16px] bg-surface" />
        </div>
      </div>
    )
  }

  if (!match) {
    return (
      <div className="px-4 pt-6 pb-24">
        <button
          onClick={() => navigate(-1)}
          className="mb-4 flex items-center gap-1 text-text-secondary min-h-[48px]"
        >
          ← Back
        </button>
        <div className="flex flex-col items-center py-20 text-center">
          <p className="text-lg text-text-primary">Match not found</p>
        </div>
      </div>
    )
  }

  const isWin = match.result.startsWith('W')
  const opponentName = opponent?.name ?? 'Unknown'

  function startEdit() {
    // Initialize edit state from current match data
    const totalGames = match!.format === 'Bo5' ? 5 : 3
    const gameScores: EditGameScore[] = []
    for (let i = 0; i < totalGames; i++) {
      const existing = sortedGames.find((g) => g.gameNumber === i + 1)
      gameScores.push({
        myScore: existing?.myScore ?? 0,
        opponentScore: existing?.opponentScore ?? 0,
      })
    }
    setEditGames(gameScores)
    setEditEnergy(match!.energyLevel ?? null)
    setEditVibe(match!.vibe ?? null)
    setEditTags(match!.tags ?? [])
    setEditNote(match!.note ?? '')
    setIsEditing(true)
  }

  function cancelEdit() {
    setIsEditing(false)
  }

  function updateEditScore(gameIndex: number, field: 'myScore' | 'opponentScore', delta: number) {
    setEditGames((prev) => {
      const updated = [...prev]
      updated[gameIndex] = {
        ...updated[gameIndex],
        [field]: Math.max(0, updated[gameIndex][field] + delta),
      }
      return updated
    })
  }

  function applyPreset(gameIndex: number, my: number, opp: number) {
    setEditGames((prev) => {
      const updated = [...prev]
      updated[gameIndex] = { myScore: my, opponentScore: opp }
      return updated
    })
  }

  function toggleEditTag(tag: string) {
    setEditTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    )
  }

  function computeEditResult() {
    let myWins = 0
    let oppWins = 0
    for (const g of editGames) {
      if (g.myScore === 0 && g.opponentScore === 0) continue
      if (g.myScore > g.opponentScore) myWins++
      else if (g.opponentScore > g.myScore) oppWins++
    }
    if (myWins === 0 && oppWins === 0) return { text: '', isWin: null }
    const win = myWins > oppWins
    return { text: win ? `W ${myWins}-${oppWins}` : `L ${myWins}-${oppWins}`, isWin: win }
  }

  async function handleSaveEdit() {
    if (saving) return
    setSaving(true)

    try {
      const playedGames = editGames.filter((g) => g.myScore > 0 || g.opponentScore > 0)

      let myWins = 0
      let oppWins = 0
      for (const g of playedGames) {
        if (g.myScore > g.opponentScore) myWins++
        else if (g.opponentScore > g.myScore) oppWins++
      }
      const newIsWin = myWins > oppWins
      const result = newIsWin ? `W ${myWins}-${oppWins}` : `L ${myWins}-${oppWins}`

      // Update match record
      await db.matches.update(matchId, {
        result,
        energyLevel: editEnergy ?? undefined,
        vibe: editVibe ?? undefined,
        tags: editTags.length > 0 ? editTags : undefined,
        note: editNote.trim() || undefined,
      })

      // Delete existing game records and re-create
      await db.games.where('matchId').equals(matchId).delete()
      const gameRecords = playedGames.map((g, i) => ({
        matchId,
        gameNumber: i + 1,
        myScore: g.myScore,
        opponentScore: g.opponentScore,
        isTight: g.myScore >= 8 && g.opponentScore >= 8,
      }))
      await db.games.bulkAdd(gameRecords)

      setIsEditing(false)
    } catch (err) {
      console.error('Failed to save edits:', err)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (deleting) return
    setDeleting(true)

    try {
      await db.games.where('matchId').equals(matchId).delete()
      await db.matches.delete(matchId)
      navigate('/', { replace: true })
    } catch (err) {
      console.error('Failed to delete match:', err)
      setDeleting(false)
    }
  }

  // Edit mode
  if (isEditing) {
    const editResult = computeEditResult()
    const totalGames = match.format === 'Bo5' ? 5 : 3
    const matchDecided =
      (() => {
        let mw = 0, ow = 0
        for (const g of editGames) {
          if (g.myScore === 0 && g.opponentScore === 0) continue
          if (g.myScore > g.opponentScore) mw++
          else if (g.opponentScore > g.myScore) ow++
        }
        return mw > totalGames / 2 || ow > totalGames / 2
      })()

    return (
      <div className="px-4 pt-6 pb-24">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={cancelEdit}
            className="flex items-center gap-1 text-text-secondary min-h-[48px]"
          >
            ← Cancel
          </button>
          <h1 className="text-lg font-bold text-text-primary">Edit Match</h1>
          <div className="w-16" />
        </div>

        {/* Score Editing */}
        <h2 className="mb-3 text-sm font-medium text-text-secondary">Scores</h2>

        {/* Match Result Banner */}
        {editResult.text && (
          <div className="mb-4 text-center">
            <span className={`text-2xl font-bold ${editResult.isWin ? 'text-win' : 'text-loss'}`}>
              {editResult.text}
            </span>
          </div>
        )}

        <div className="space-y-3 mb-6">
          {editGames.slice(0, totalGames).map((game, index) => {
            const tight = game.myScore >= 8 && game.opponentScore >= 8
            const canCollapse = matchDecided && game.myScore === 0 && game.opponentScore === 0 && index > 0

            if (canCollapse) {
              return (
                <Card key={index} className="opacity-40">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-text-secondary">Game {index + 1}</span>
                    <span className="text-xs text-text-secondary">Not needed</span>
                  </div>
                </Card>
              )
            }

            return (
              <Card key={index}>
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm font-medium text-text-secondary">
                    Game {index + 1}
                    {tight && <span className="ml-1">🔥</span>}
                  </span>
                </div>

                <div className="flex items-center justify-center gap-4">
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-xs text-text-secondary">You</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => updateEditScore(index, 'myScore', -1)}
                        className="flex min-h-[48px] min-w-[48px] items-center justify-center rounded-[12px] bg-surface-elevated text-xl font-bold text-text-primary active:opacity-80"
                      >
                        −
                      </button>
                      <span className="min-w-[48px] text-center text-3xl font-bold text-text-primary">
                        {game.myScore}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateEditScore(index, 'myScore', 1)}
                        className="flex min-h-[48px] min-w-[48px] items-center justify-center rounded-[12px] bg-surface-elevated text-xl font-bold text-text-primary active:opacity-80"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <span className="text-xl text-text-secondary">–</span>

                  <div className="flex flex-col items-center gap-1">
                    <span className="text-xs text-text-secondary">{opponentName}</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => updateEditScore(index, 'opponentScore', -1)}
                        className="flex min-h-[48px] min-w-[48px] items-center justify-center rounded-[12px] bg-surface-elevated text-xl font-bold text-text-primary active:opacity-80"
                      >
                        −
                      </button>
                      <span className="min-w-[48px] text-center text-3xl font-bold text-text-primary">
                        {game.opponentScore}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateEditScore(index, 'opponentScore', 1)}
                        className="flex min-h-[48px] min-w-[48px] items-center justify-center rounded-[12px] bg-surface-elevated text-xl font-bold text-text-primary active:opacity-80"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

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

        {/* Energy Level */}
        <div className="mb-6">
          <h3 className="mb-3 text-sm font-medium text-text-secondary">Energy Level</h3>
          <div className="flex gap-3">
            {ENERGY_OPTIONS.map((opt) => (
              <button
                key={opt.level}
                type="button"
                onClick={() => setEditEnergy(editEnergy === opt.level ? null : opt.level)}
                className={`flex min-h-[48px] flex-1 flex-col items-center justify-center rounded-[12px] transition-colors ${
                  editEnergy === opt.level
                    ? 'bg-primary/20 border-2 border-primary'
                    : 'bg-surface border-2 border-transparent'
                }`}
              >
                <span className="text-xl">{opt.icon}</span>
                <span className={`mt-1 text-xs font-medium ${editEnergy === opt.level ? 'text-primary' : 'text-text-secondary'}`}>
                  {opt.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Match Vibe */}
        <div className="mb-6">
          <h3 className="mb-3 text-sm font-medium text-text-secondary">Match Vibe</h3>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {VIBES.map((v) => (
              <Chip
                key={v}
                selected={editVibe === v}
                onClick={() => setEditVibe(editVibe === v ? null : v)}
                className="shrink-0"
              >
                {v}
              </Chip>
            ))}
          </div>
        </div>

        {/* Quick Tags */}
        <div className="mb-6">
          <h3 className="mb-3 text-sm font-medium text-text-secondary">Quick Tags</h3>
          <div className="flex flex-wrap gap-2">
            {QUICK_TAGS.map((t) => (
              <Chip
                key={t}
                selected={editTags.includes(t)}
                onClick={() => toggleEditTag(t)}
              >
                {t}
              </Chip>
            ))}
          </div>
        </div>

        {/* Match Note */}
        <div className="mb-6">
          <h3 className="mb-3 text-sm font-medium text-text-secondary">Match Note</h3>
          <input
            type="text"
            value={editNote}
            onChange={(e) => setEditNote(e.target.value)}
            placeholder="Quick note... (optional)"
            maxLength={140}
            className="w-full rounded-[12px] border border-white/10 bg-surface px-4 py-3 text-sm text-text-primary placeholder:text-text-secondary/50 focus:border-primary focus:outline-none"
          />
          {editNote.length > 0 && (
            <p className="mt-1 text-right text-xs text-text-secondary">{editNote.length}/140</p>
          )}
        </div>

        {/* Save / Cancel Buttons */}
        <div className="flex gap-3">
          <Button variant="secondary" onClick={cancelEdit} className="flex-1">
            Cancel
          </Button>
          <Button onClick={handleSaveEdit} disabled={saving} className="flex-1">
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>
    )
  }

  // Read-only detail view
  return (
    <div className="px-4 pt-6 pb-24">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-text-secondary min-h-[48px]"
        >
          ← Back
        </button>
        <h1 className="text-lg font-bold text-text-primary">Match Details</h1>
        <div className="w-12" />
      </div>

      {/* Result + Opponent */}
      <Card className="mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{opponent?.emoji || '👤'}</span>
            <div>
              <p className="text-lg font-bold text-text-primary">{opponentName}</p>
              <p className="text-sm text-text-secondary">
                {formatDate(match.date)} · {formatTime(match.date)}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className={`text-2xl font-bold ${isWin ? 'text-win' : 'text-loss'}`}>
              {match.result}
            </p>
            <p className="text-sm text-text-secondary">{match.format === 'Bo5' ? 'Best of 5' : 'Best of 3'}</p>
          </div>
        </div>
        {venue && (
          <p className="mt-2 text-sm text-text-secondary">📍 {venue.name}</p>
        )}
      </Card>

      {/* Game Scores */}
      <h2 className="mb-3 text-sm font-medium text-text-secondary">Game Scores</h2>
      <div className="mb-4 space-y-2">
        {sortedGames.map((game) => (
          <Card key={game.id}>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-text-secondary">
                Game {game.gameNumber}
                {game.isTight && <span className="ml-1">🔥</span>}
              </span>
              <div className="flex items-center gap-3">
                <span className={`text-xl font-bold ${game.myScore > game.opponentScore ? 'text-win' : 'text-loss'}`}>
                  {game.myScore}
                </span>
                <span className="text-text-secondary">–</span>
                <span className={`text-xl font-bold ${game.opponentScore > game.myScore ? 'text-loss' : 'text-win'}`}>
                  {game.opponentScore}
                </span>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Tags Section */}
      {(match.energyLevel || match.vibe || (match.tags && match.tags.length > 0)) && (
        <>
          <h2 className="mb-3 text-sm font-medium text-text-secondary">Match Info</h2>
          <Card className="mb-4">
            {match.energyLevel && (
              <div className="mb-3">
                <span className="text-xs text-text-secondary">Energy</span>
                <p className="text-sm text-text-primary">
                  {ENERGY_OPTIONS.find((e) => e.level === match.energyLevel)?.icon} {match.energyLevel}
                </p>
              </div>
            )}
            {match.vibe && (
              <div className="mb-3">
                <span className="text-xs text-text-secondary">Vibe</span>
                <p className="text-sm text-text-primary">{match.vibe}</p>
              </div>
            )}
            {match.tags && match.tags.length > 0 && (
              <div>
                <span className="text-xs text-text-secondary">Tags</span>
                <div className="mt-1 flex flex-wrap gap-1">
                  {match.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-surface-elevated px-3 py-1 text-xs text-text-primary"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </>
      )}

      {/* Match Note */}
      {match.note && (
        <>
          <h2 className="mb-3 text-sm font-medium text-text-secondary">Note</h2>
          <Card className="mb-4">
            <p className="text-sm text-text-primary">{match.note}</p>
          </Card>
        </>
      )}

      {/* Recommendation */}
      {recommendation && (
        <>
          <h2 className="mb-3 text-sm font-medium text-text-secondary">Recommendation</h2>
          <div className="mb-4">
            <RecommendationCard recommendation={recommendation} />
          </div>
        </>
      )}

      {/* Action Buttons */}
      <div className="mt-6 flex gap-3">
        <Button variant="secondary" onClick={startEdit} className="flex-1">
          Edit
        </Button>
        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="flex-1 min-h-[48px] rounded-[12px] bg-loss/20 text-loss font-semibold transition-opacity active:opacity-80"
        >
          Delete
        </button>
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm rounded-[16px] bg-surface-elevated p-6">
            <h3 className="mb-2 text-lg font-semibold text-text-primary">Delete this match?</h3>
            <p className="mb-6 text-sm text-text-secondary">
              This cannot be undone. The match and all game records will be permanently removed.
            </p>
            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 min-h-[48px] rounded-[12px] bg-loss font-semibold text-white transition-opacity active:opacity-80 disabled:opacity-40"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
