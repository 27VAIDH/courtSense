import { useState } from 'react'
import { useVenues } from '@/db/hooks'
import { db } from '@/db/database'
import type { Venue } from '@/db/types'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'

interface ModalState {
  open: boolean
  mode: 'add' | 'edit'
  venue?: Venue
}

export default function VenueManager() {
  const venues = useVenues()
  const [modal, setModal] = useState<ModalState>({ open: false, mode: 'add' })
  const [name, setName] = useState('')
  const [isHome, setIsHome] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null)

  const sortedVenues = venues
    ?.slice()
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  function openAddModal() {
    setName('')
    setIsHome(false)
    setModal({ open: true, mode: 'add' })
  }

  function openEditModal(venue: Venue) {
    setName(venue.name)
    setIsHome(venue.isHome)
    setModal({ open: true, mode: 'edit', venue })
  }

  function closeModal() {
    setModal({ open: false, mode: 'add' })
    setName('')
    setIsHome(false)
  }

  async function handleSave() {
    const trimmed = name.trim()
    if (!trimmed) return

    if (modal.mode === 'add') {
      await db.venues.add({
        name: trimmed,
        isHome,
        createdAt: new Date(),
      })
    } else if (modal.mode === 'edit' && modal.venue?.id) {
      await db.venues.update(modal.venue.id, {
        name: trimmed,
        isHome,
      })
    }
    closeModal()
  }

  async function handleDelete(id: number) {
    await db.venues.delete(id)
    setDeleteConfirm(null)
  }

  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-text-primary">Venues</h2>
        <Button onClick={openAddModal} className="px-4 text-sm">
          + Add Venue
        </Button>
      </div>

      {sortedVenues && sortedVenues.length === 0 && (
        <p className="text-sm text-text-secondary">No venues yet. Add your first one!</p>
      )}

      <div className="space-y-2">
        {sortedVenues?.map((venue) => (
          <Card key={venue.id} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">📍</span>
              <div className="flex items-center gap-2">
                <span className="font-medium text-text-primary">{venue.name}</span>
                {venue.isHome && (
                  <span className="rounded-full bg-primary/20 px-2 py-0.5 text-xs font-medium text-primary">
                    Home
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => openEditModal(venue)}
                className="flex min-h-[48px] min-w-[48px] items-center justify-center text-text-secondary"
                aria-label={`Edit ${venue.name}`}
              >
                ✏️
              </button>
              {deleteConfirm === venue.id ? (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleDelete(venue.id!)}
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
                  onClick={() => setDeleteConfirm(venue.id!)}
                  className="flex min-h-[48px] min-w-[48px] items-center justify-center text-text-secondary"
                  aria-label={`Delete ${venue.name}`}
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
              {modal.mode === 'add' ? 'Add Venue' : 'Edit Venue'}
            </h3>

            <label className="mb-1 block text-sm text-text-secondary">Venue Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Venue name"
              className="mb-4 w-full rounded-[12px] border border-white/10 bg-surface px-4 py-3 text-text-primary placeholder:text-text-secondary/50 focus:border-primary focus:outline-none"
              autoFocus
            />

            <div className="mb-6 flex items-center justify-between">
              <label className="text-sm text-text-secondary">Home Court</label>
              <button
                type="button"
                onClick={() => setIsHome(!isHome)}
                className={`relative h-7 w-12 rounded-full transition-colors ${
                  isHome ? 'bg-primary' : 'bg-white/20'
                }`}
                role="switch"
                aria-checked={isHome}
                aria-label="Home Court toggle"
              >
                <span
                  className={`absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white transition-transform ${
                    isHome ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

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
