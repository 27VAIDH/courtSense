import { useState } from 'react'
import { usePlayers } from '@/db/hooks'
import { db } from '@/db/database'
import type { Player } from '@/db/types'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'

const SPORTS_EMOJIS = ['🎾', '🏃', '💪', '🔥', '⚡', '🏆', '🎯', '🦅', '🐍', '🦁', '🐺', '🦊']

function randomEmoji() {
  return SPORTS_EMOJIS[Math.floor(Math.random() * SPORTS_EMOJIS.length)]
}

interface ModalState {
  open: boolean
  mode: 'add' | 'edit'
  player?: Player
}

export default function OpponentManager() {
  const players = usePlayers()
  const [modal, setModal] = useState<ModalState>({ open: false, mode: 'add' })
  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null)

  const opponents = players
    ?.filter((p) => !p.isCurrentUser)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  function openAddModal() {
    setName('')
    setEmoji(randomEmoji())
    setModal({ open: true, mode: 'add' })
  }

  function openEditModal(player: Player) {
    setName(player.name)
    setEmoji(player.emoji)
    setModal({ open: true, mode: 'edit', player })
  }

  function closeModal() {
    setModal({ open: false, mode: 'add' })
    setName('')
    setEmoji('')
  }

  async function handleSave() {
    const trimmed = name.trim()
    if (!trimmed) return

    const emojiValue = emoji.trim() || randomEmoji()

    if (modal.mode === 'add') {
      await db.players.add({
        name: trimmed,
        emoji: emojiValue,
        isCurrentUser: false,
        createdAt: new Date(),
      })
    } else if (modal.mode === 'edit' && modal.player?.id) {
      await db.players.update(modal.player.id, {
        name: trimmed,
        emoji: emojiValue,
      })
    }
    closeModal()
  }

  async function handleDelete(id: number) {
    await db.players.delete(id)
    setDeleteConfirm(null)
  }

  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-text-primary">Opponents</h2>
        <Button onClick={openAddModal} className="px-4 text-sm">
          + Add Opponent
        </Button>
      </div>

      {opponents && opponents.length === 0 && (
        <p className="text-sm text-text-secondary">No opponents yet. Add your first one!</p>
      )}

      <div className="space-y-2">
        {opponents?.map((player) => (
          <Card key={player.id} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{player.emoji}</span>
              <span className="font-medium text-text-primary">{player.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => openEditModal(player)}
                className="flex min-h-[48px] min-w-[48px] items-center justify-center text-text-secondary"
                aria-label={`Edit ${player.name}`}
              >
                ✏️
              </button>
              {deleteConfirm === player.id ? (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleDelete(player.id!)}
                    className="min-h-[48px] rounded-lg px-3 text-sm font-medium text-loss"
                  >
                    Confirm
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteConfirm(null)}
                    className="min-h-[48px] rounded-lg px-3 text-sm font-medium text-text-secondary"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setDeleteConfirm(player.id!)}
                  className="flex min-h-[48px] min-w-[48px] items-center justify-center text-text-secondary"
                  aria-label={`Delete ${player.name}`}
                >
                  🗑️
                </button>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Add/Edit Modal */}
      {modal.open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-t-[20px] bg-surface-elevated p-6">
            <h3 className="mb-4 text-lg font-semibold text-text-primary">
              {modal.mode === 'add' ? 'Add Opponent' : 'Edit Opponent'}
            </h3>

            <label className="mb-1 block text-sm text-text-secondary">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Opponent name"
              className="mb-4 w-full rounded-[12px] border border-white/10 bg-surface px-4 py-3 text-text-primary placeholder:text-text-secondary/50 focus:border-primary focus:outline-none"
              autoFocus
            />

            <label className="mb-1 block text-sm text-text-secondary">Emoji</label>
            <input
              type="text"
              value={emoji}
              onChange={(e) => setEmoji(e.target.value)}
              placeholder="Single emoji"
              maxLength={2}
              className="mb-6 w-full rounded-[12px] border border-white/10 bg-surface px-4 py-3 text-text-primary placeholder:text-text-secondary/50 focus:border-primary focus:outline-none"
            />

            <div className="flex gap-3">
              <Button variant="secondary" onClick={closeModal} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={!name.trim()} className="flex-1">
                {modal.mode === 'add' ? 'Add' : 'Save'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
