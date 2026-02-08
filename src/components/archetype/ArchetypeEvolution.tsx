import { useEffect } from 'react'
import type { Archetype } from '@/lib/archetypes'
import { useArchetypeHistoryStore } from '@/stores/archetypeHistoryStore'

interface ArchetypeEvolutionProps {
  currentArchetype: Archetype
}

export default function ArchetypeEvolution({
  currentArchetype,
}: ArchetypeEvolutionProps) {
  const { history, addArchetype } = useArchetypeHistoryStore()

  // Track archetype changes
  useEffect(() => {
    addArchetype(currentArchetype.name)
  }, [currentArchetype.name, addArchetype])

  if (history.length === 0) {
    return null
  }

  // Only show if there's been a change (more than 1 unique archetype)
  const uniqueArchetypes = new Set(history.map((h) => h.archetype))
  if (uniqueArchetypes.size === 1 && history.length === 1) {
    return null
  }

  return (
    <div>
      <h4 className="text-xs font-semibold text-text-secondary mb-3 uppercase tracking-wide">
        Evolution Timeline
      </h4>
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {history.map((entry, index) => {
          const date = new Date(entry.date)
          const monthLabel = date.toLocaleDateString('en-US', {
            month: 'short',
            year: '2-digit',
          })

          // Find archetype color from current or previous archetypes
          // This is a simplification - in a real app you'd want to import ARCHETYPES
          const isCurrentArchetype = entry.archetype === currentArchetype.name
          const color = isCurrentArchetype ? currentArchetype.color : '#7C4DFF'

          return (
            <div
              key={index}
              className="flex flex-col items-center gap-1 flex-shrink-0"
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                style={{
                  backgroundColor: `${color}20`,
                  color: color,
                  border: `2px solid ${color}`,
                }}
              >
                {entry.archetype.split(' ').pop()?.charAt(0) || '?'}
              </div>
              <span className="text-[10px] text-text-secondary whitespace-nowrap">
                {monthLabel}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
