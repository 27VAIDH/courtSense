import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, useMotionValue, useTransform } from 'framer-motion'
import { useUIStore } from '@/stores/uiStore'
import { useMatchLogStore } from '@/stores/matchLogStore'
import StepIndicator from '@/components/matchlog/StepIndicator'
import StepSetup from '@/components/matchlog/StepSetup'
import StepScoreEntry from '@/components/matchlog/StepScoreEntry'
import StepTagsSave from '@/components/matchlog/StepTagsSave'
import Button from '@/components/ui/Button'
import { triggerLightHaptic } from '@/lib/haptics'

export default function LogMatch() {
  const navigate = useNavigate()
  const { hideTabBar, showTabBar } = useUIStore()
  const { step, setStep, opponentId, reset } = useMatchLogStore()
  const [showExitConfirm, setShowExitConfirm] = useState(false)

  // Track if any selection was made (for exit confirmation)
  const hasSelection = opponentId !== null

  // Swipe animation with Framer Motion
  const x = useMotionValue(0)
  const opacity = useTransform(x, [-100, 0, 100], [0.5, 1, 0.5])

  useEffect(() => {
    hideTabBar()
    return () => showTabBar()
  }, [hideTabBar, showTabBar])

  function handleClose() {
    if (hasSelection) {
      setShowExitConfirm(true)
    } else {
      handleExit()
    }
  }

  function handleExit() {
    reset()
    showTabBar()
    navigate('/')
  }

  function handleNext() {
    setStep(step + 1)
    triggerLightHaptic()
  }

  function handleBack() {
    setStep(step - 1)
    triggerLightHaptic()
  }

  function handleDragEnd(_event: MouseEvent | TouchEvent | PointerEvent, info: { offset: { x: number } }) {
    const threshold = 100

    // Swipe left (next step)
    if (info.offset.x < -threshold && step < 3) {
      handleNext()
    }
    // Swipe right (previous step)
    else if (info.offset.x > threshold && step > 1) {
      handleBack()
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-bg">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2" style={{ paddingTop: 'max(12px, env(safe-area-inset-top))' }}>
        <button
          type="button"
          onClick={handleClose}
          className="flex min-h-[48px] min-w-[48px] items-center justify-center text-2xl text-text-secondary"
          aria-label="Close"
        >
          ✕
        </button>
        <StepIndicator current={step} total={3} />
        <div className="w-12" /> {/* Spacer for centering */}
      </div>

      {/* Step Content */}
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.2}
        onDragEnd={handleDragEnd}
        className="flex-1 overflow-y-auto touch-pan-y"
        style={{ x, opacity }}
      >
        {step === 1 && <StepSetup />}
        {step === 2 && <StepScoreEntry />}
        {step === 3 && <StepTagsSave />}
      </motion.div>

      {/* Bottom Action */}
      <div className="px-4 pb-4" style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}>
        {step === 1 && (
          <Button
            onClick={handleNext}
            disabled={opponentId === null}
            className="w-full"
          >
            Next
          </Button>
        )}
        {step === 2 && (
          <div className="flex gap-3">
            <Button variant="secondary" onClick={handleBack} className="flex-1">
              Back
            </Button>
            <Button onClick={handleNext} className="flex-1">
              Next
            </Button>
          </div>
        )}
        {step === 3 && (
          <Button variant="secondary" onClick={handleBack} className="w-full">
            Back
          </Button>
        )}
      </div>

      {/* Exit Confirmation Dialog */}
      {showExitConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm rounded-[16px] bg-surface-elevated p-6">
            <h3 className="mb-2 text-lg font-semibold text-text-primary">Discard match?</h3>
            <p className="mb-6 text-sm text-text-secondary">
              Your selections will be lost if you exit now.
            </p>
            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={() => setShowExitConfirm(false)}
                className="flex-1"
              >
                Keep editing
              </Button>
              <Button
                onClick={handleExit}
                className="flex-1 !bg-loss"
              >
                Discard
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
