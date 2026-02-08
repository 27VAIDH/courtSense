import Card from '@/components/ui/Card'
import type { Milestone } from '@/lib/milestones'

interface MilestoneListProps {
  milestones: Milestone[]
}

function formatDate(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`

  // Format as "Mon Jan 6, 2026"
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${days[date.getDay()]} ${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`
}

export default function MilestoneList({ milestones }: MilestoneListProps) {
  if (milestones.length === 0) {
    return (
      <Card>
        <h3 className="text-sm font-semibold text-text-primary mb-2">Milestones</h3>
        <p className="text-xs text-text-secondary">
          Keep logging matches to unlock milestones!
        </p>
      </Card>
    )
  }

  // Sort newest first
  const sorted = [...milestones].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )

  return (
    <Card>
      <h3 className="text-sm font-semibold text-text-primary mb-3">Milestones</h3>

      <div className="space-y-3">
        {sorted.map((milestone, idx) => (
          <div
            key={`${milestone.type}-${milestone.date.getTime()}-${idx}`}
            className="flex items-start gap-3 pb-3 border-b border-white/10 last:border-b-0 last:pb-0"
          >
            {/* Icon */}
            <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-surface rounded-full text-xl">
              {milestone.icon}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-text-primary">
                {milestone.title}
              </p>
              <p className="text-xs text-text-secondary mt-0.5">
                {milestone.description}
              </p>
              <p className="text-xs text-text-secondary/70 mt-1">
                {formatDate(new Date(milestone.date))}
              </p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
