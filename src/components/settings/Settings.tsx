import { useState } from 'react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { db } from '@/db/database'
import { usePlayers } from '@/db/hooks'
import { useSettingsStore } from '@/stores/settingsStore'

interface SettingsProps {
  appVersion?: string
}

export default function Settings({ appVersion = '1.0.0' }: SettingsProps) {
  const players = usePlayers() ?? []
  const currentUser = players.find((p) => p.isCurrentUser)
  const [editingName, setEditingName] = useState(false)
  const [nameValue, setNameValue] = useState(currentUser?.name || 'Me')
  const [importing, setImporting] = useState(false)
  const [exporting, setExporting] = useState(false)

  const { tightGameThreshold, setTightGameThreshold, recordExport } = useSettingsStore()

  const handleNameSave = async () => {
    if (currentUser?.id) {
      await db.players.update(currentUser.id, { name: nameValue })
      setEditingName(false)
    }
  }

  const handleExport = async () => {
    setExporting(true)
    try {
      // Read all data from Dexie
      const playersData = await db.players.toArray()
      const venuesData = await db.venues.toArray()
      const matchesData = await db.matches.toArray()
      const gamesData = await db.games.toArray()
      const rallyAnalysesData = await db.rally_analyses.toArray()

      const exportData = {
        version: appVersion,
        exportDate: new Date().toISOString(),
        data: {
          players: playersData,
          venues: venuesData,
          matches: matchesData,
          games: gamesData,
          rally_analyses: rallyAnalysesData,
        },
      }

      const json = JSON.stringify(exportData, null, 2)
      const blob = new Blob([json], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const date = new Date().toISOString().split('T')[0]
      const filename = `squashiq-backup-${date}.json`

      // Try native share first (mobile)
      if (navigator.share && navigator.canShare?.({ files: [new File([blob], filename)] })) {
        const file = new File([blob], filename, { type: 'application/json' })
        await navigator.share({
          files: [file],
          title: 'SquashIQ Backup',
        })
      } else {
        // Fallback to download
        const a = document.createElement('a')
        a.href = url
        a.download = filename
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }

      // Record export
      recordExport()
    } catch (error) {
      console.error('Export failed:', error)
      alert('Export failed. Please try again.')
    } finally {
      setExporting(false)
    }
  }

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setImporting(true)
    try {
      const text = await file.text()
      const importData = JSON.parse(text)

      // Validate structure
      if (!importData.data) {
        throw new Error('Invalid backup file format')
      }

      // Show confirmation
      const confirmed = window.confirm(
        'This will merge with your existing data. Continue?'
      )
      if (!confirmed) {
        setImporting(false)
        return
      }

      // Import data - skip duplicates by id
      const { players, venues, matches, games, rally_analyses } = importData.data

      // For each table, check if record exists by id before adding
      if (players?.length) {
        for (const player of players) {
          const exists = await db.players.get(player.id)
          if (!exists) {
            await db.players.add(player)
          }
        }
      }

      if (venues?.length) {
        for (const venue of venues) {
          const exists = await db.venues.get(venue.id)
          if (!exists) {
            await db.venues.add(venue)
          }
        }
      }

      if (matches?.length) {
        for (const match of matches) {
          const exists = await db.matches.get(match.id)
          if (!exists) {
            await db.matches.add(match)
          }
        }
      }

      if (games?.length) {
        for (const game of games) {
          const exists = await db.games.get(game.id)
          if (!exists) {
            await db.games.add(game)
          }
        }
      }

      if (rally_analyses?.length) {
        for (const analysis of rally_analyses) {
          const exists = await db.rally_analyses.get(analysis.id)
          if (!exists) {
            await db.rally_analyses.add(analysis)
          }
        }
      }

      alert('Import successful!')
    } catch (error) {
      console.error('Import failed:', error)
      alert('Import failed. Please check the file and try again.')
    } finally {
      setImporting(false)
      // Reset file input
      event.target.value = ''
    }
  }

  return (
    <div className="mt-8">
      <h2 className="mb-4 text-xl font-semibold text-text-primary">Settings</h2>

      {/* Player Name */}
      <Card className="mb-4">
        <div className="mb-2 text-sm font-medium text-text-secondary">Player Name</div>
        {editingName ? (
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={nameValue}
              onChange={(e) => setNameValue(e.target.value)}
              className="flex-1 rounded-lg bg-surface-elevated px-3 py-2 text-text-primary outline-none focus:ring-2 focus:ring-primary"
              autoFocus
            />
            <Button variant="primary" onClick={handleNameSave}>
              Save
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setNameValue(currentUser?.name || 'Me')
                setEditingName(false)
              }}
            >
              Cancel
            </Button>
          </div>
        ) : (
          <div
            className="flex cursor-pointer items-center justify-between rounded-lg bg-surface-elevated px-3 py-2"
            onClick={() => setEditingName(true)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') setEditingName(true)
            }}
          >
            <span className="text-text-primary">{currentUser?.name || 'Me'}</span>
            <span className="text-text-secondary">✏️</span>
          </div>
        )}
      </Card>

      {/* Tight Game Threshold */}
      <Card className="mb-4">
        <div className="mb-2 text-sm font-medium text-text-secondary">
          Tight Game Threshold
        </div>
        <div className="mb-2 text-xs text-text-secondary">
          Games where both players score this or higher are counted as tight games
        </div>
        <input
          type="number"
          min="5"
          max="11"
          value={tightGameThreshold}
          onChange={(e) => setTightGameThreshold(parseInt(e.target.value, 10))}
          className="w-full rounded-lg bg-surface-elevated px-3 py-2 text-text-primary outline-none focus:ring-2 focus:ring-primary"
        />
      </Card>

      {/* Data Management */}
      <Card className="mb-4">
        <div className="mb-4 text-sm font-medium text-text-secondary">
          Data Management
        </div>

        <div className="space-y-3">
          <Button
            variant="primary"
            onClick={handleExport}
            disabled={exporting}
            className="w-full"
          >
            {exporting ? 'Exporting...' : '📤 Export Data'}
          </Button>

          <label className="block">
            <Button
              variant="secondary"
              className="w-full"
              onClick={() => document.getElementById('import-file-input')?.click()}
              disabled={importing}
            >
              {importing ? 'Importing...' : '📥 Import Data'}
            </Button>
            <input
              id="import-file-input"
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
            />
          </label>
        </div>
      </Card>

      {/* App Version */}
      <div className="mt-6 text-center text-sm text-text-secondary">
        SquashIQ v{appVersion}
      </div>
    </div>
  )
}
