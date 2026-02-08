import { useState } from 'react'
import { motion, AnimatePresence, PanInfo } from 'framer-motion'
import { db } from '@/db/database'
import Button from '@/components/ui/Button'

interface RallyAnalyzerProps {
  matchId: number
  onComplete: () => void
  onCancel: () => void
}

const WIN_METHODS = [
  'Winners / Kill shots',
  'Opponent errors',
  'Long rallies / Outlasted them',
  'Serve dominance',
  'Drop shots / Deception',
]

const LOSE_METHODS = [
  'Unforced errors',
  'Opponent winners',
  'Lost long rallies',
  'Poor serves',
  'Bad positioning',
]

const RALLY_LENGTHS = [
  'Short (1-4 shots)',
  'Medium (5-10 shots)',
  'Long (10+ shots)',
]

const COURT_COVERAGES = [
  'Dominated the T',
  'Stuck in back corners',
  'Good movement overall',
  'Sluggish / Heavy legs',
]

const BEST_SHOTS = [
  'Forehand drive',
  'Backhand drive',
  'Drop shot',
  'Boast',
  'Lob',
  'Serve',
  'Volley',
]

interface CardData {
  title: string
  options: string[]
  type: 'single' | 'multi'
  maxSelect?: number
}

const CARDS: CardData[] = [
  {
    title: 'How did you win most points?',
    options: WIN_METHODS,
    type: 'single',
  },
  {
    title: 'How did you lose most points?',
    options: LOSE_METHODS,
    type: 'single',
  },
  {
    title: 'Average rally length felt like...',
    options: RALLY_LENGTHS,
    type: 'single',
  },
  {
    title: 'Your court coverage today?',
    options: COURT_COVERAGES,
    type: 'single',
  },
  {
    title: 'Which shot felt best today?',
    options: BEST_SHOTS,
    type: 'multi',
    maxSelect: 2,
  },
]

export default function RallyAnalyzer({ matchId, onComplete, onCancel }: RallyAnalyzerProps) {
  const [currentCard, setCurrentCard] = useState(0)
  const [direction, setDirection] = useState(0)
  const [saving, setSaving] = useState(false)

  // Selections: card index -> selected option(s)
  const [selections, setSelections] = useState<Record<number, string | string[]>>({})

  const totalCards = CARDS.length
  const cardData = CARDS[currentCard]

  function handleSelect(option: string) {
    if (cardData.type === 'single') {
      setSelections((prev) => ({ ...prev, [currentCard]: option }))
    } else {
      // Multi-select
      const current = (selections[currentCard] as string[] | undefined) || []
      if (current.includes(option)) {
        // Deselect
        setSelections((prev) => ({
          ...prev,
          [currentCard]: current.filter((o) => o !== option),
        }))
      } else {
        // Select (with max limit)
        if (current.length < (cardData.maxSelect ?? 10)) {
          setSelections((prev) => ({
            ...prev,
            [currentCard]: [...current, option],
          }))
        }
      }
    }
  }

  function isSelected(option: string): boolean {
    const sel = selections[currentCard]
    if (Array.isArray(sel)) return sel.includes(option)
    return sel === option
  }

  function handleNext() {
    if (currentCard < totalCards - 1) {
      setDirection(1)
      setCurrentCard((prev) => prev + 1)
    }
  }

  function handleSkip() {
    // Clear current selection and advance
    setSelections((prev) => {
      const updated = { ...prev }
      delete updated[currentCard]
      return updated
    })
    if (currentCard < totalCards - 1) {
      setDirection(1)
      setCurrentCard((prev) => prev + 1)
    }
  }

  function handleBack() {
    if (currentCard > 0) {
      setDirection(-1)
      setCurrentCard((prev) => prev - 1)
    }
  }

  async function handleDone() {
    if (saving) return
    setSaving(true)

    try {
      // Map selections to DB fields
      const winMethod = selections[0] as string | undefined
      const loseMethod = selections[1] as string | undefined
      const rallyLength = selections[2] as string | undefined
      const courtCoverage = selections[3] as string | undefined
      const bestShots = selections[4] as string[] | undefined

      await db.rally_analyses.add({
        matchId,
        winMethod,
        loseMethod,
        rallyLength,
        courtCoverage,
        bestShots,
        createdAt: new Date(),
      })

      onComplete()
    } catch (err) {
      console.error('Failed to save rally analysis:', err)
      setSaving(false)
    }
  }

  function handleDragEnd(_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) {
    const swipeThreshold = 50
    if (info.offset.x < -swipeThreshold && currentCard < totalCards - 1) {
      // Swipe left -> next
      setDirection(1)
      setCurrentCard((prev) => prev + 1)
    } else if (info.offset.x > swipeThreshold && currentCard > 0) {
      // Swipe right -> back
      setDirection(-1)
      setCurrentCard((prev) => prev - 1)
    }
  }

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction > 0 ? -300 : 300,
      opacity: 0,
    }),
  }

  const isLastCard = currentCard === totalCards - 1

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-bg">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-6 pb-4">
        <button
          onClick={onCancel}
          className="flex min-h-[48px] items-center gap-1 text-text-secondary"
        >
          ✕ Close
        </button>
        <h1 className="text-lg font-bold text-text-primary">Rally Details</h1>
        <div className="w-16" />
      </div>

      {/* Progress Dots */}
      <div className="flex justify-center gap-2 px-4 pb-6">
        {Array.from({ length: totalCards }).map((_, i) => (
          <div
            key={i}
            className={`h-2 w-2 rounded-full transition-colors ${
              i === currentCard ? 'bg-primary' : 'bg-white/20'
            }`}
          />
        ))}
      </div>

      {/* Card Container */}
      <div className="relative flex-1 overflow-hidden px-4">
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={currentCard}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={handleDragEnd}
            className="absolute inset-0 flex flex-col"
          >
            {/* Question */}
            <h2 className="mb-6 text-center text-xl font-bold text-text-primary">
              {cardData.title}
            </h2>

            {/* Options */}
            <div className="flex flex-col gap-3">
              {cardData.options.map((option) => (
                <button
                  key={option}
                  onClick={() => handleSelect(option)}
                  className={`min-h-[56px] rounded-[12px] px-4 py-3 text-left text-sm font-medium transition-all ${
                    isSelected(option)
                      ? 'bg-primary/20 border-2 border-primary text-primary'
                      : 'bg-surface border-2 border-transparent text-text-primary active:bg-surface-elevated'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>

            {/* Multi-select hint */}
            {cardData.type === 'multi' && (
              <p className="mt-4 text-center text-xs text-text-secondary">
                Select up to {cardData.maxSelect} options
              </p>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom Actions */}
      <div className="border-t border-white/10 bg-bg px-4 py-4">
        <div className="flex gap-3">
          {currentCard > 0 && (
            <button
              onClick={handleBack}
              className="min-h-[48px] rounded-[12px] bg-surface px-4 text-sm font-semibold text-text-primary active:opacity-80"
            >
              ← Back
            </button>
          )}

          <button
            onClick={handleSkip}
            className="flex-1 min-h-[48px] rounded-[12px] text-sm font-semibold text-text-secondary active:opacity-80"
          >
            Skip
          </button>

          {isLastCard ? (
            <Button onClick={handleDone} disabled={saving} className="flex-1">
              {saving ? 'Saving...' : 'Done'}
            </Button>
          ) : (
            <Button onClick={handleNext} className="flex-1">
              Next →
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
