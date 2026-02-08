import { useState, useRef, ReactNode } from 'react'
import { motion, PanInfo } from 'framer-motion'
import { triggerManualSync } from '@/lib/sync'
import { useSyncStore } from '@/stores/syncStore'

interface PullToRefreshProps {
  children: ReactNode
}

const PULL_THRESHOLD = 80 // pixels to pull before triggering refresh

export default function PullToRefresh({ children }: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const { status } = useSyncStore()

  const handlePanStart = () => {
    // Only allow pull-to-refresh if scrolled to top
    const container = containerRef.current
    if (container && container.scrollTop > 0) {
      return false
    }
    return true
  }

  const handlePan = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    // Only track downward pulls
    if (info.offset.y > 0 && info.offset.y <= PULL_THRESHOLD * 1.5) {
      setPullDistance(info.offset.y)
    }
  }

  const handlePanEnd = async (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.y >= PULL_THRESHOLD && !isRefreshing && status !== 'syncing') {
      setIsRefreshing(true)
      try {
        await triggerManualSync()
      } finally {
        setIsRefreshing(false)
        setPullDistance(0)
      }
    } else {
      setPullDistance(0)
    }
  }

  const progress = Math.min(pullDistance / PULL_THRESHOLD, 1)
  const rotation = progress * 360

  return (
    <div ref={containerRef} className="h-full overflow-y-auto">
      {/* Pull indicator */}
      <motion.div
        className="flex items-center justify-center py-2"
        style={{
          height: pullDistance > 0 ? pullDistance : 0,
          opacity: progress,
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: progress }}
      >
        <motion.div
          className="text-2xl"
          style={{ rotate: rotation }}
        >
          {isRefreshing ? '⏳' : '🔄'}
        </motion.div>
      </motion.div>

      {/* Content with pan gesture */}
      <motion.div
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.2}
        onDragStart={handlePanStart}
        onPan={handlePan}
        onDragEnd={handlePanEnd}
        className="touch-pan-y"
      >
        {children}
      </motion.div>
    </div>
  )
}
