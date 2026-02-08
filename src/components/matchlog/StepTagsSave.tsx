import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMatchLogStore } from '@/stores/matchLogStore'
import { useBadgeStore } from '@/stores/badgeStore'
import { db } from '@/db/database'
import { generateRecommendation } from '@/lib/recommendations'
import { checkBadges } from '@/lib/badges'
import Chip from '@/components/ui/Chip'
import Button from '@/components/ui/Button'

const VIBES = ['Intense', 'Casual', 'Frustrating', 'Focused', 'Fun', 'Grind']
const QUICK_TAGS = ['Good day', 'Off day', 'New strategy', 'Comeback', 'Dominated', 'Lucky win', 'Close']

const ENERGY_OPTIONS: { level: 'Low' | 'Medium' | 'High'; icon: string; label: string }[] = [
  { level: 'Low', icon: '🪫', label: 'Low' },
  { level: 'Medium', icon: '⚡', label: 'Medium' },
  { level: 'High', icon: '🔥', label: 'High' },
]

export default function StepTagsSave() {
  const navigate = useNavigate()
  const {
    opponentId,
    date,
    venueId,
    format,
    games,
    energyLevel,
    vibe,
    tags,
    note,
    setEnergyLevel,
    setVibe,
    toggleTag,
    setNote,
    reset,
  } = useMatchLogStore()

  const setEarnedBadges = useBadgeStore((state) => state.setEarnedBadges)
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    if (!opponentId || saving) return
    setSaving(true)

    try {
      // Calculate result
      let myWins = 0
      let oppWins = 0
      const playedGames = games.filter((g) => g.myScore > 0 || g.opponentScore > 0)

      for (const g of playedGames) {
        if (g.myScore > g.opponentScore) myWins++
        else if (g.opponentScore > g.myScore) oppWins++
      }

      const isWin = myWins > oppWins
      const result = isWin ? `W ${myWins}-${oppWins}` : `L ${myWins}-${oppWins}`

      // Save match record
      const matchId = await db.matches.add({
        date,
        opponentId,
        venueId: venueId ?? 0,
        format,
        result,
        energyLevel: energyLevel ?? undefined,
        vibe: vibe ?? undefined,
        tags: tags.length > 0 ? tags : undefined,
        note: note.trim() || undefined,
        createdAt: new Date(),
      })

      // Save game records for played games
      const gameRecords = playedGames.map((g, i) => ({
        matchId,
        gameNumber: i + 1,
        myScore: g.myScore,
        opponentScore: g.opponentScore,
        isTight: g.myScore >= 8 && g.opponentScore >= 8,
      }))

      await db.games.bulkAdd(gameRecords)

      // Generate recommendation
      const allMatches = await db.matches.toArray()
      const allGames = await db.games.toArray()
      const savedMatch = allMatches.find((m) => m.id === matchId)
      if (savedMatch) {
        const rec = generateRecommendation(allMatches, allGames, savedMatch)
        await db.matches.update(matchId, {
          recommendationText: JSON.stringify(rec),
        })
      }

      // Check for badges
      const earnedBadges = checkBadges(allMatches, allGames)
      setEarnedBadges(earnedBadges)

      // Reset state and navigate to post-match screen
      reset()
      navigate(`/match/${matchId}/saved`, { replace: true })
    } catch (err) {
      console.error('Failed to save match:', err)
      setSaving(false)
    }
  }

  return (
    <div className="px-4 py-2">
      {/* Energy Level */}
      <div className="mb-6">
        <h3 className="mb-3 text-sm font-medium text-text-secondary">Energy Level</h3>
        <div className="flex gap-3">
          {ENERGY_OPTIONS.map((opt) => (
            <button
              key={opt.level}
              type="button"
              onClick={() => setEnergyLevel(energyLevel === opt.level ? null : opt.level)}
              className={`flex min-h-[48px] flex-1 flex-col items-center justify-center rounded-[12px] transition-colors ${
                energyLevel === opt.level
                  ? 'bg-primary/20 border-2 border-primary'
                  : 'bg-surface border-2 border-transparent'
              }`}
            >
              <span className="text-xl">{opt.icon}</span>
              <span className={`mt-1 text-xs font-medium ${energyLevel === opt.level ? 'text-primary' : 'text-text-secondary'}`}>
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
              selected={vibe === v}
              onClick={() => setVibe(vibe === v ? null : v)}
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
              selected={tags.includes(t)}
              onClick={() => toggleTag(t)}
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
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Quick note... (optional)"
          maxLength={140}
          className="w-full rounded-[12px] border border-white/10 bg-surface px-4 py-3 text-sm text-text-primary placeholder:text-text-secondary/50 focus:border-primary focus:outline-none"
        />
        {note.length > 0 && (
          <p className="mt-1 text-right text-xs text-text-secondary">{note.length}/140</p>
        )}
      </div>

      {/* Save Button */}
      <Button
        onClick={handleSave}
        disabled={saving}
        className="w-full text-lg"
      >
        {saving ? 'Saving...' : '🏸 Save Match'}
      </Button>
    </div>
  )
}
