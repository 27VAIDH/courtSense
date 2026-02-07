interface StepIndicatorProps {
  current: number
  total: number
}

export default function StepIndicator({ current, total }: StepIndicatorProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-text-secondary">
        {current} of {total}
      </span>
      <div className="flex gap-1.5">
        {Array.from({ length: total }, (_, i) => (
          <div
            key={i}
            className={`h-2 w-2 rounded-full transition-colors ${
              i + 1 === current ? 'bg-primary' : i + 1 < current ? 'bg-primary/50' : 'bg-white/20'
            }`}
          />
        ))}
      </div>
    </div>
  )
}
