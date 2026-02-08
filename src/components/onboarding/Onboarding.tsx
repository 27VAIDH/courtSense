import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import Button from '@/components/ui/Button'

interface OnboardingScreen {
  title: string
  description: string
  icon: string
}

const SCREENS: OnboardingScreen[] = [
  {
    title: 'Log matches in 60 seconds',
    description: 'Quick score entry with large tap targets designed for post-match logging',
    icon: '⚡',
  },
  {
    title: 'Discover what makes you win',
    description: 'Unlock insights as you play to understand your patterns and performance',
    icon: '📊',
  },
  {
    title: 'Track your improvement',
    description: 'See your progress over time with beautiful charts and personalized recommendations',
    icon: '📈',
  },
]

interface OnboardingProps {
  onComplete: () => void
}

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [currentScreen, setCurrentScreen] = useState(0)
  const [direction, setDirection] = useState(1)
  const navigate = useNavigate()

  const handleNext = () => {
    if (currentScreen === SCREENS.length - 1) {
      // On last screen, complete onboarding and navigate to /log
      onComplete()
      navigate('/log')
    } else {
      setDirection(1)
      setCurrentScreen((prev) => prev + 1)
    }
  }

  const handlePrev = () => {
    if (currentScreen > 0) {
      setDirection(-1)
      setCurrentScreen((prev) => prev - 1)
    }
  }

  const screen = SCREENS[currentScreen]

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

  return (
    <div className="fixed inset-0 z-50 bg-bg flex flex-col items-center justify-center px-6">
      {/* Progress dots */}
      <div className="absolute top-12 flex gap-2">
        {SCREENS.map((_, i) => (
          <div
            key={i}
            className={`h-2 rounded-full transition-all ${
              i === currentScreen
                ? 'w-8 bg-primary'
                : 'w-2 bg-surface-elevated'
            }`}
          />
        ))}
      </div>

      {/* Swipeable content */}
      <div className="relative w-full max-w-sm overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentScreen}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="flex flex-col items-center text-center"
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={(_, info) => {
              if (info.offset.x < -50 && currentScreen < SCREENS.length - 1) {
                handleNext()
              } else if (info.offset.x > 50 && currentScreen > 0) {
                handlePrev()
              }
            }}
          >
            <span className="text-8xl mb-6">{screen.icon}</span>
            <h1 className="text-2xl font-bold text-text-primary mb-3">
              {screen.title}
            </h1>
            <p className="text-text-secondary text-base leading-relaxed max-w-[300px]">
              {screen.description}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation buttons */}
      <div className="absolute bottom-12 w-full max-w-sm px-6">
        {currentScreen === SCREENS.length - 1 ? (
          <Button onClick={handleNext} className="w-full">
            Get Started
          </Button>
        ) : (
          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={() => {
                onComplete()
                navigate('/')
              }}
              className="flex-1"
            >
              Skip
            </Button>
            <Button onClick={handleNext} className="flex-1">
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
