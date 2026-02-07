import { useState, useMemo } from 'react'
import { usePlayers, useVenues } from '@/db/hooks'
import { db } from '@/db/database'
import { useMatchLogStore } from '@/stores/matchLogStore'
import Chip from '@/components/ui/Chip'
import Button from '@/components/ui/Button'

const SPORTS_EMOJIS = ['🎾', '🏃', '💪', '🔥', '⚡', '🏆', '🎯', '🦅', '🐍', '🦁', '🐺', '🦊']

function randomEmoji() {
  return SPORTS_EMOJIS[Math.floor(Math.random() * SPORTS_EMOJIS.length)]
}

function formatDateForDisplay(date: Date): string {
  const now = new Date()
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()

  const dayLabel = isToday
    ? 'Today'
    : date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })

  const time = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  return `${dayLabel}, ${time}`
}

function toDatetimeLocalString(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  const h = String(date.getHours()).padStart(2, '0')
  const min = String(date.getMinutes()).padStart(2, '0')
  return `${y}-${m}-${d}T${h}:${min}`
}

export default function StepSetup() {
  const players = usePlayers()
  const venues = useVenues()
  const { opponentId, setOpponentId, date, setDate, venueId, setVenueId, format, setFormat } =
    useMatchLogStore()

  // Inline add-opponent modal
  const [showAddOpponent, setShowAddOpponent] = useState(false)
  const [newOpponentName, setNewOpponentName] = useState('')
  const [newOpponentEmoji, setNewOpponentEmoji] = useState(randomEmoji())

  // Inline add-venue modal
  const [showAddVenue, setShowAddVenue] = useState(false)
  const [newVenueName, setNewVenueName] = useState('')
  const [newVenueIsHome, setNewVenueIsHome] = useState(false)

  // Date picker
  const [showDatePicker, setShowDatePicker] = useState(false)

  const opponents = useMemo(
    () =>
      players
        ?.filter((p) => !p.isCurrentUser)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) ?? [],
    [players]
  )

  const sortedVenues = useMemo(
    () =>
      venues
        ?.slice()
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) ?? [],
    [venues]
  )

  async function handleAddOpponent() {
    const trimmed = newOpponentName.trim()
    if (!trimmed) return
    const id = await db.players.add({
      name: trimmed,
      emoji: newOpponentEmoji.trim() || randomEmoji(),
      isCurrentUser: false,
      createdAt: new Date(),
    })
    setOpponentId(id as number)
    setShowAddOpponent(false)
    setNewOpponentName('')
    setNewOpponentEmoji(randomEmoji())
  }

  async function handleAddVenue() {
    const trimmed = newVenueName.trim()
    if (!trimmed) return
    const id = await db.venues.add({
      name: trimmed,
      isHome: newVenueIsHome,
      createdAt: new Date(),
    })
    setVenueId(id as number)
    setShowAddVenue(false)
    setNewVenueName('')
    setNewVenueIsHome(false)
  }

  return (
    <div className="flex flex-1 flex-col gap-6 px-4 pt-2 pb-4">
      {/* Opponent Picker */}
      <section>
        <h3 className="mb-2 text-sm font-medium text-text-secondary">Opponent</h3>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
          {opponents.map((player) => (
            <Chip
              key={player.id}
              selected={opponentId === player.id}
              onClick={() => setOpponentId(opponentId === player.id ? null : player.id!)}
              className="shrink-0"
            >
              {player.emoji} {player.name}
            </Chip>
          ))}
          <Chip
            onClick={() => setShowAddOpponent(true)}
            className="shrink-0"
          >
            +
          </Chip>
        </div>
      </section>

      {/* Date/Time */}
      <section>
        <h3 className="mb-2 text-sm font-medium text-text-secondary">Date & Time</h3>
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowDatePicker(!showDatePicker)}
            className="min-h-[48px] rounded-[20px] border border-white/20 px-4 text-sm font-medium text-text-primary"
          >
            {formatDateForDisplay(date)}
          </button>
          {showDatePicker && (
            <input
              type="datetime-local"
              value={toDatetimeLocalString(date)}
              onChange={(e) => {
                if (e.target.value) {
                  setDate(new Date(e.target.value))
                }
              }}
              onBlur={() => setShowDatePicker(false)}
              className="absolute top-0 left-0 h-full w-full cursor-pointer opacity-0"
              autoFocus
            />
          )}
        </div>
      </section>

      {/* Venue Picker */}
      <section>
        <h3 className="mb-2 text-sm font-medium text-text-secondary">Venue</h3>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
          {sortedVenues.map((venue) => (
            <Chip
              key={venue.id}
              selected={venueId === venue.id}
              onClick={() => setVenueId(venueId === venue.id ? null : venue.id!)}
              className="shrink-0"
            >
              📍 {venue.name}
            </Chip>
          ))}
          <Chip
            onClick={() => setShowAddVenue(true)}
            className="shrink-0"
          >
            +
          </Chip>
        </div>
      </section>

      {/* Format Selector */}
      <section>
        <h3 className="mb-2 text-sm font-medium text-text-secondary">Format</h3>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setFormat('Bo3')}
            className={`min-h-[48px] flex-1 rounded-[12px] text-sm font-semibold transition-colors ${
              format === 'Bo3'
                ? 'bg-primary text-black'
                : 'bg-surface text-text-primary'
            }`}
          >
            Best of 3
          </button>
          <button
            type="button"
            onClick={() => setFormat('Bo5')}
            className={`min-h-[48px] flex-1 rounded-[12px] text-sm font-semibold transition-colors ${
              format === 'Bo5'
                ? 'bg-primary text-black'
                : 'bg-surface text-text-primary'
            }`}
          >
            Best of 5
          </button>
        </div>
      </section>

      {/* Inline Add Opponent Modal */}
      {showAddOpponent && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-t-[20px] bg-surface-elevated p-6">
            <h3 className="mb-4 text-lg font-semibold text-text-primary">Add Opponent</h3>

            <label className="mb-1 block text-sm text-text-secondary">Name</label>
            <input
              type="text"
              value={newOpponentName}
              onChange={(e) => setNewOpponentName(e.target.value)}
              placeholder="Opponent name"
              className="mb-4 w-full rounded-[12px] border border-white/10 bg-surface px-4 py-3 text-text-primary placeholder:text-text-secondary/50 focus:border-primary focus:outline-none"
              autoFocus
            />

            <label className="mb-1 block text-sm text-text-secondary">Emoji</label>
            <input
              type="text"
              value={newOpponentEmoji}
              onChange={(e) => setNewOpponentEmoji(e.target.value)}
              placeholder="Single emoji"
              maxLength={2}
              className="mb-6 w-full rounded-[12px] border border-white/10 bg-surface px-4 py-3 text-text-primary placeholder:text-text-secondary/50 focus:border-primary focus:outline-none"
            />

            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowAddOpponent(false)
                  setNewOpponentName('')
                  setNewOpponentEmoji(randomEmoji())
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button onClick={handleAddOpponent} disabled={!newOpponentName.trim()} className="flex-1">
                Add
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Inline Add Venue Modal */}
      {showAddVenue && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-t-[20px] bg-surface-elevated p-6">
            <h3 className="mb-4 text-lg font-semibold text-text-primary">Add Venue</h3>

            <label className="mb-1 block text-sm text-text-secondary">Venue Name</label>
            <input
              type="text"
              value={newVenueName}
              onChange={(e) => setNewVenueName(e.target.value)}
              placeholder="Venue name"
              className="mb-4 w-full rounded-[12px] border border-white/10 bg-surface px-4 py-3 text-text-primary placeholder:text-text-secondary/50 focus:border-primary focus:outline-none"
              autoFocus
            />

            <div className="mb-6 flex items-center justify-between">
              <label className="text-sm text-text-secondary">Home Court</label>
              <button
                type="button"
                onClick={() => setNewVenueIsHome(!newVenueIsHome)}
                className={`relative h-7 w-12 rounded-full transition-colors ${
                  newVenueIsHome ? 'bg-primary' : 'bg-white/20'
                }`}
                role="switch"
                aria-checked={newVenueIsHome}
                aria-label="Home Court toggle"
              >
                <span
                  className={`absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white transition-transform ${
                    newVenueIsHome ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowAddVenue(false)
                  setNewVenueName('')
                  setNewVenueIsHome(false)
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button onClick={handleAddVenue} disabled={!newVenueName.trim()} className="flex-1">
                Add
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
