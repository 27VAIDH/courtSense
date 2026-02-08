interface ProBadgeProps {
  /**
   * Size variant
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * Optional custom class name
   */
  className?: string;
}

/**
 * ProBadge component - displays a "PRO" badge for premium features
 */
export function ProBadge({ size = 'md', className = '' }: ProBadgeProps) {
  const sizeClasses = {
    sm: 'text-[10px] px-1.5 py-0.5',
    md: 'text-xs px-2 py-1',
    lg: 'text-sm px-3 py-1.5',
  };

  return (
    <span
      className={`inline-flex items-center justify-center font-bold rounded ${sizeClasses[size]} bg-gradient-to-r from-yellow-400 to-yellow-600 text-black ${className}`}
      aria-label="Pro feature"
    >
      PRO
    </span>
  );
}

interface FeatureLockIconProps {
  /**
   * Size in pixels
   */
  size?: number;
  /**
   * Optional custom class name
   */
  className?: string;
}

/**
 * Lock icon for gated features
 */
export function FeatureLockIcon({ size = 16, className = '' }: FeatureLockIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`text-yellow-500 ${className}`}
      aria-hidden="true"
    >
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}
