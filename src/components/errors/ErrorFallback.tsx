interface ErrorFallbackProps {
  /**
   * Optional error object
   */
  error?: Error;
  /**
   * Optional reset callback
   */
  resetError?: () => void;
}

/**
 * ErrorFallback - displayed when an error boundary catches an error
 */
export function ErrorFallback({ error, resetError }: ErrorFallbackProps) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-surface rounded-lg shadow-xl border border-border p-8 text-center">
        {/* Error Icon */}
        <div className="mb-6 flex justify-center">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center">
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-red-500"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-white mb-3">
          Oops! Something went wrong
        </h1>

        {/* Description */}
        <p className="text-textSecondary mb-6">
          We've been notified and will fix this as soon as possible. Please try
          refreshing the page.
        </p>

        {/* Error details (only in development) */}
        {import.meta.env.DEV && error && (
          <div className="mb-6 text-left bg-black/40 rounded-lg p-4 border border-red-500/20">
            <h3 className="text-sm font-semibold text-red-400 mb-2">
              Error Details (dev only):
            </h3>
            <p className="text-xs text-red-300 font-mono break-all">
              {error.message}
            </p>
            {error.stack && (
              <details className="mt-2">
                <summary className="text-xs text-textSecondary cursor-pointer hover:text-white">
                  Stack trace
                </summary>
                <pre className="text-[10px] text-textSecondary mt-2 overflow-auto max-h-40">
                  {error.stack}
                </pre>
              </details>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-primary text-black font-bold py-3 rounded-lg hover:bg-green-400 transition-colors"
          >
            Refresh Page
          </button>
          {resetError && (
            <button
              onClick={resetError}
              className="w-full bg-transparent text-textSecondary font-medium py-3 rounded-lg hover:text-white transition-colors border border-border hover:border-primary/30"
            >
              Try Again
            </button>
          )}
          <button
            onClick={() => (window.location.href = '/')}
            className="w-full bg-transparent text-textSecondary font-medium py-3 rounded-lg hover:text-white transition-colors border border-border hover:border-primary/30"
          >
            Go to Dashboard
          </button>
        </div>

        {/* Support Link */}
        <div className="mt-6 pt-6 border-t border-border">
          <p className="text-xs text-textSecondary">
            Still having issues?{' '}
            <a
              href="https://github.com/anthropics/claude-code/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Report this bug
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
