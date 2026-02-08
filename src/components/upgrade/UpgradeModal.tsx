import React from 'react';
import { Link } from 'react-router-dom';
import { ProBadge, FeatureLockIcon } from './ProBadge';
import { logUpgradeModalShown } from '@/lib/activityLogger';

interface UpgradeModalProps {
  /**
   * Whether the modal is open
   */
  isOpen: boolean;
  /**
   * Callback to close the modal
   */
  onClose: () => void;
  /**
   * The feature that triggered the upgrade prompt
   */
  featureName?: string;
  /**
   * Optional custom title
   */
  title?: string;
  /**
   * Optional custom description
   */
  description?: string;
}

/**
 * UpgradeModal - shows when user attempts to access a Pro feature
 */
export function UpgradeModal({
  isOpen,
  onClose,
  featureName,
  title,
  description,
}: UpgradeModalProps) {
  // Log when modal is shown
  React.useEffect(() => {
    if (isOpen) {
      logUpgradeModalShown(featureName);
    }
  }, [isOpen, featureName]);

  if (!isOpen) return null;

  const defaultTitle = featureName
    ? `${featureName} is a Pro Feature`
    : 'Upgrade to Pro';
  const defaultDescription =
    'Unlock unlimited friends, groups, advanced analytics, and more with SquashIQ Pro.';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="upgrade-modal-title"
    >
      <div
        className="relative w-full max-w-md mx-4 bg-surface rounded-lg shadow-xl border border-border overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-yellow-400/10 to-yellow-600/10 border-b border-border p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <FeatureLockIcon size={24} />
              <h2
                id="upgrade-modal-title"
                className="text-xl font-bold text-white"
              >
                {title || defaultTitle}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-textSecondary hover:text-white transition-colors p-1"
              aria-label="Close modal"
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
          <p className="text-textSecondary text-sm">
            {description || defaultDescription}
          </p>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* Pro Features List */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <ProBadge size="sm" />
              What you'll get with Pro:
            </h3>
            <ul className="space-y-2">
              {[
                'Unlimited friends & groups',
                'Advanced analytics & charts',
                'Export your data',
                'Custom themes',
                'Priority support',
              ].map((feature, index) => (
                <li
                  key={index}
                  className="flex items-start gap-2 text-sm text-textSecondary"
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-primary flex-shrink-0 mt-0.5"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          {/* Pricing */}
          <div className="bg-black/40 rounded-lg p-4 border border-primary/20">
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-3xl font-bold text-white">$5</span>
              <span className="text-sm text-textSecondary">/month</span>
            </div>
            <p className="text-xs text-textSecondary">
              Cancel anytime. No commitments.
            </p>
          </div>

          {/* Coming Soon Badge */}
          <div className="flex items-center justify-center gap-2 py-2">
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 text-xs font-semibold border border-blue-500/30">
              Coming Soon
            </span>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2">
            <Link
              to="/pricing?source=upgrade_modal"
              onClick={onClose}
              className="block w-full bg-gradient-to-r from-yellow-400 to-yellow-600 text-black font-bold py-3 rounded-lg hover:from-yellow-500 hover:to-yellow-700 transition-all text-center"
            >
              Learn More →
            </Link>
            <button
              onClick={onClose}
              className="block w-full bg-transparent text-textSecondary font-medium py-3 rounded-lg hover:text-white transition-colors text-center border border-border hover:border-primary/30"
            >
              Maybe Later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Hook to manage upgrade modal state
 */
export function useUpgradeModal() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [context, setContext] = React.useState<{
    featureName?: string;
    title?: string;
    description?: string;
  }>({});

  const showUpgradeModal = React.useCallback(
    (options?: {
      featureName?: string;
      title?: string;
      description?: string;
    }) => {
      setContext(options || {});
      setIsOpen(true);
    },
    []
  );

  const closeUpgradeModal = React.useCallback(() => {
    setIsOpen(false);
  }, []);

  return {
    isOpen,
    context,
    showUpgradeModal,
    closeUpgradeModal,
  };
}
