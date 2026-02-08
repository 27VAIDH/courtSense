import { useState, useRef } from 'react'
import { motion, AnimatePresence, PanInfo } from 'framer-motion'
import html2canvas from 'html2canvas'
import { Match, Game, Player } from '@/db/types'
import QuarterInNumbers from './cards/QuarterInNumbers'
import WinRateJourney from './cards/WinRateJourney'
import BiggestRival from './cards/BiggestRival'
import BestMonth from './cards/BestMonth'
import ClutchMoments from './cards/ClutchMoments'
import HeadlineStat from './cards/HeadlineStat'
import Button from '@/components/ui/Button'

interface SeasonWrappedProps {
  matches: Match[]
  games: Game[]
  players: Player[]
  onClose: () => void
}

export default function SeasonWrapped({
  matches,
  games,
  players,
  onClose,
}: SeasonWrappedProps) {
  const [currentCard, setCurrentCard] = useState(0)
  const cardRef = useRef<HTMLDivElement>(null)

  const cards = [
    <QuarterInNumbers key="card1" matches={matches} games={games} />,
    <WinRateJourney key="card2" matches={matches} />,
    <BiggestRival key="card3" matches={matches} players={players} />,
    <BestMonth key="card4" matches={matches} />,
    <ClutchMoments key="card5" matches={matches} games={games} />,
    <HeadlineStat key="card6" matches={matches} games={games} players={players} />,
  ]

  const handleNext = () => {
    if (currentCard < cards.length - 1) {
      setCurrentCard(currentCard + 1)
    }
  }

  const handlePrev = () => {
    if (currentCard > 0) {
      setCurrentCard(currentCard - 1)
    }
  }

  const handleDragEnd = (_: any, info: PanInfo) => {
    const threshold = 50
    if (info.offset.x < -threshold) {
      handleNext()
    } else if (info.offset.x > threshold) {
      handlePrev()
    }
  }

  const handleShare = async () => {
    if (!cardRef.current) return

    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        backgroundColor: '#0A0A0A',
        width: 1080,
        height: 1920,
      })

      canvas.toBlob(async (blob) => {
        if (!blob) return

        const file = new File([blob], 'squashiq-wrapped.png', {
          type: 'image/png',
        })

        // Try native share first
        if (navigator.share && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              files: [file],
              title: 'My SquashIQ Season Wrapped',
            })
          } catch (err) {
            // User cancelled or share failed - fallback to download
            downloadImage(canvas)
          }
        } else {
          // No native share - download
          downloadImage(canvas)
        }
      })
    } catch (err) {
      console.error('Failed to generate image:', err)
    }
  }

  const downloadImage = (canvas: HTMLCanvasElement) => {
    const link = document.createElement('a')
    link.download = `squashiq-wrapped-${Date.now()}.png`
    link.href = canvas.toDataURL()
    link.click()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute right-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-surface text-2xl text-text-primary"
      >
        ✕
      </button>

      {/* Card container */}
      <div className="relative h-full w-full max-w-[480px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentCard}
            ref={cardRef}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={handleDragEnd}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.3 }}
            className="h-full w-full"
          >
            {cards[currentCard]}
          </motion.div>
        </AnimatePresence>

        {/* Progress dots */}
        <div className="absolute bottom-32 left-0 right-0 flex justify-center gap-2">
          {cards.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentCard(index)}
              className={`h-2 w-2 rounded-full transition-all ${
                index === currentCard
                  ? 'w-6 bg-primary'
                  : 'bg-text-secondary opacity-50'
              }`}
            />
          ))}
        </div>

        {/* Share button */}
        <div className="absolute bottom-8 left-0 right-0 px-8">
          <Button variant="primary" onClick={handleShare}>
            Share This Card
          </Button>
        </div>
      </div>
    </div>
  )
}
