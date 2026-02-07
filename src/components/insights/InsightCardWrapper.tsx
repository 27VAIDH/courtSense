import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { useInsightStore, type InsightId } from '@/stores/insightStore'

interface InsightCardWrapperProps {
  id: InsightId
  isUnlocked: boolean
  children: React.ReactNode
}

export default function InsightCardWrapper({
  id,
  isUnlocked,
  children,
}: InsightCardWrapperProps) {
  const { seenUnlocked, markSeen } = useInsightStore()
  const hasBeenSeen = seenUnlocked.has(id)
  const shouldAnimate = isUnlocked && !hasBeenSeen
  const markedRef = useRef(false)

  useEffect(() => {
    if (shouldAnimate && !markedRef.current) {
      markedRef.current = true
      // Mark as seen after animation completes
      const timer = setTimeout(() => {
        markSeen(id)
      }, 1200)
      return () => clearTimeout(timer)
    }
  }, [shouldAnimate, id, markSeen])

  if (shouldAnimate) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="relative"
      >
        {/* Glow border effect */}
        <motion.div
          className="absolute inset-0 rounded-[16px] pointer-events-none"
          initial={{ boxShadow: '0 0 0px rgba(0, 230, 118, 0)' }}
          animate={{
            boxShadow: [
              '0 0 0px rgba(0, 230, 118, 0)',
              '0 0 15px rgba(0, 230, 118, 0.4)',
              '0 0 0px rgba(0, 230, 118, 0)',
            ],
          }}
          transition={{ duration: 1.5, ease: 'easeInOut' }}
        />
        {children}
      </motion.div>
    )
  }

  return <>{children}</>
}
