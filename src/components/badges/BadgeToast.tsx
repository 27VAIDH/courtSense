import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useBadgeStore } from '@/stores/badgeStore'
import type { BadgeRarity } from '@/lib/badges'

const RARITY_COLORS: Record<BadgeRarity, string> = {
  Common: 'border-text-secondary',
  Rare: 'border-blue-400',
  Epic: 'border-purple-400',
  Legendary: 'border-yellow-400',
}

const RARITY_GLOW: Record<BadgeRarity, string> = {
  Common: 'shadow-text-secondary/20',
  Rare: 'shadow-blue-400/30',
  Epic: 'shadow-purple-400/30',
  Legendary: 'shadow-yellow-400/40',
}

export default function BadgeToast() {
  const newBadges = useBadgeStore((state) => state.newBadges)
  const markBadgeShown = useBadgeStore((state) => state.markBadgeShown)

  const currentBadge = newBadges[0]

  useEffect(() => {
    if (currentBadge) {
      const timer = setTimeout(() => {
        markBadgeShown(currentBadge.id)
      }, 4000)

      return () => clearTimeout(timer)
    }
  }, [currentBadge, markBadgeShown])

  return (
    <AnimatePresence>
      {currentBadge && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className="fixed left-1/2 top-4 z-[100] w-[calc(100%-2rem)] max-w-md -translate-x-1/2"
        >
          <div
            className={`rounded-[20px] border-2 bg-surface-elevated p-4 shadow-lg ${RARITY_COLORS[currentBadge.rarity]} ${RARITY_GLOW[currentBadge.rarity]}`}
          >
            <div className="flex items-center gap-4">
              {/* Badge emoji */}
              <div className="text-5xl">{currentBadge.emoji}</div>

              <div className="flex-1">
                {/* Header */}
                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-primary">
                  Badge Earned!
                </p>

                {/* Badge name */}
                <h3 className="mb-1 text-lg font-bold text-text-primary">
                  {currentBadge.name}
                </h3>

                {/* Rarity + description */}
                <p className="text-xs text-text-secondary">
                  <span className={`font-medium ${RARITY_COLORS[currentBadge.rarity]}`}>
                    {currentBadge.rarity}
                  </span>
                  {' • '}
                  {currentBadge.description}
                </p>
              </div>

              {/* Close button */}
              <button
                type="button"
                onClick={() => markBadgeShown(currentBadge.id)}
                className="rounded-full p-2 text-text-secondary transition-colors hover:bg-white/5 hover:text-text-primary"
                aria-label="Dismiss"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M12 4L4 12M4 4L12 12"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
