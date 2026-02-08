import { useMemo } from 'react'
import { useBadgeStore } from '@/stores/badgeStore'
import { ALL_BADGES, type Badge, type EarnedBadge, type BadgeRarity } from '@/lib/badges'
import Card from '@/components/ui/Card'

const RARITY_COLORS: Record<BadgeRarity, string> = {
  Common: 'text-text-secondary',
  Rare: 'text-blue-400',
  Epic: 'text-purple-400',
  Legendary: 'text-yellow-400',
}

const RARITY_BG: Record<BadgeRarity, string> = {
  Common: 'bg-text-secondary/10',
  Rare: 'bg-blue-400/10',
  Epic: 'bg-purple-400/10',
  Legendary: 'bg-yellow-400/10',
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
}

interface BadgeCardProps {
  badge: Badge
  earned?: EarnedBadge
}

function BadgeCard({ badge, earned }: BadgeCardProps) {
  const isEarned = !!earned

  return (
    <Card className={`p-4 transition-all ${isEarned ? '' : 'opacity-40 grayscale'}`}>
      <div className="flex flex-col items-center text-center">
        {/* Badge emoji */}
        <div className={`mb-2 text-4xl ${isEarned ? '' : 'opacity-50'}`}>
          {badge.emoji}
        </div>

        {/* Badge name */}
        <h3 className={`mb-1 text-sm font-bold ${isEarned ? 'text-text-primary' : 'text-text-secondary'}`}>
          {badge.name}
        </h3>

        {/* Rarity label */}
        <div className={`mb-2 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${RARITY_COLORS[badge.rarity]} ${RARITY_BG[badge.rarity]}`}>
          {badge.rarity}
        </div>

        {/* Description or criteria */}
        <p className="mb-2 text-xs text-text-secondary">
          {isEarned ? badge.description : badge.criteriaText}
        </p>

        {/* Date earned */}
        {earned && (
          <p className="text-xs text-text-secondary/70">
            Earned {formatDate(earned.earnedAt)}
          </p>
        )}
      </div>
    </Card>
  )
}

export default function BadgeGrid() {
  const earnedBadges = useBadgeStore((state) => state.earnedBadges)

  const earnedMap = useMemo(() => {
    const map = new Map<string, EarnedBadge>()
    for (const badge of earnedBadges) {
      map.set(badge.id, badge)
    }
    return map
  }, [earnedBadges])

  const earnedCount = earnedBadges.length
  const totalCount = ALL_BADGES.length

  return (
    <div className="mb-8">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-text-primary">Pressure Badges</h2>
        <span className="text-sm text-text-secondary">
          {earnedCount} / {totalCount}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {ALL_BADGES.map((badge) => (
          <BadgeCard
            key={badge.id}
            badge={badge}
            earned={earnedMap.get(badge.id)}
          />
        ))}
      </div>
    </div>
  )
}
