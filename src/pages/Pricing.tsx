import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ProBadge } from '../components/upgrade/ProBadge';
import { logPricingPageViewed } from '../lib/activityLogger';

interface PricingTier {
  name: string;
  tier: 'free' | 'pro' | 'enterprise';
  price: string;
  period: string;
  description: string;
  features: string[];
  cta: string;
  ctaVariant: 'default' | 'primary' | 'premium';
  popular?: boolean;
}

const tiers: PricingTier[] = [
  {
    name: 'Free',
    tier: 'free',
    price: '$0',
    period: 'forever',
    description: 'Perfect for recreational players getting started',
    features: [
      'Unlimited match logging',
      'Basic analytics & insights',
      'Local opponent tracking',
      'Offline support',
      'Up to 5 friends',
      'Up to 2 groups',
      'Mobile PWA',
    ],
    cta: 'Get Started',
    ctaVariant: 'default',
  },
  {
    name: 'Pro',
    tier: 'pro',
    price: '$5',
    period: 'per month',
    description: 'For serious players who want to level up their game',
    features: [
      'Everything in Free',
      'Unlimited friends & groups',
      'Advanced analytics & charts',
      'Export data (CSV, JSON)',
      'Custom themes',
      'Priority support',
      'Early access to new features',
    ],
    cta: 'Coming Soon',
    ctaVariant: 'primary',
    popular: true,
  },
  {
    name: 'Enterprise',
    tier: 'enterprise',
    price: '$20',
    period: 'per month',
    description: 'For clubs and organizations managing teams',
    features: [
      'Everything in Pro',
      'White-label branding',
      'API access',
      'Team accounts',
      'SSO (Single Sign-On)',
      'Custom integrations',
      'Dedicated support',
      'SLA guarantees',
    ],
    cta: 'Coming Soon',
    ctaVariant: 'premium',
  },
];

/**
 * Pricing page - shows tier comparison and upgrade options
 */
export default function Pricing() {
  const [searchParams] = useSearchParams();

  // Log page view with source
  React.useEffect(() => {
    const source = searchParams.get('source') || 'direct';
    logPricingPageViewed(source);
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-surface/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-white hover:text-primary transition-colors">
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
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            <span className="font-semibold">Back</span>
          </Link>
        </div>
      </div>

      {/* Hero Section */}
      <div className="max-w-4xl mx-auto px-4 pt-12 pb-8 text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
          Choose Your Plan
        </h1>
        <p className="text-lg text-textSecondary max-w-2xl mx-auto">
          Start free and upgrade when you're ready to unlock advanced features.
          All plans include our core analytics and match logging.
        </p>
      </div>

      {/* Pricing Cards */}
      <div className="max-w-6xl mx-auto px-4 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {tiers.map((tier) => (
            <div
              key={tier.tier}
              className={`relative bg-surface rounded-lg border ${
                tier.popular
                  ? 'border-primary shadow-lg shadow-primary/20'
                  : 'border-border'
              } overflow-hidden flex flex-col`}
            >
              {/* Popular Badge */}
              {tier.popular && (
                <div className="absolute top-0 right-0 bg-gradient-to-r from-primary to-green-400 text-black text-xs font-bold px-3 py-1 rounded-bl-lg">
                  MOST POPULAR
                </div>
              )}

              {/* Card Content */}
              <div className="p-6 flex-1 flex flex-col">
                {/* Header */}
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-2xl font-bold text-white">{tier.name}</h3>
                    {tier.tier !== 'free' && <ProBadge size="sm" />}
                  </div>
                  <p className="text-sm text-textSecondary">{tier.description}</p>
                </div>

                {/* Pricing */}
                <div className="mb-6">
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold text-white">
                      {tier.price}
                    </span>
                    <span className="text-textSecondary text-sm">
                      {tier.period}
                    </span>
                  </div>
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-6 flex-1">
                  {tier.features.map((feature, index) => (
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

                {/* CTA Button */}
                <button
                  className={`w-full py-3 rounded-lg font-bold transition-all ${
                    tier.ctaVariant === 'primary'
                      ? 'bg-gradient-to-r from-primary to-green-400 text-black hover:from-green-400 hover:to-primary'
                      : tier.ctaVariant === 'premium'
                      ? 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-black hover:from-yellow-500 hover:to-yellow-700'
                      : 'bg-surface-light text-white hover:bg-surface-lighter border border-border'
                  } ${
                    tier.tier !== 'free' ? 'cursor-not-allowed opacity-75' : ''
                  }`}
                  disabled={tier.tier !== 'free'}
                >
                  {tier.cta}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* FAQ Section */}
      <div className="max-w-3xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold text-white mb-8 text-center">
          Frequently Asked Questions
        </h2>
        <div className="space-y-6">
          <div className="bg-surface rounded-lg p-6 border border-border">
            <h3 className="text-lg font-semibold text-white mb-2">
              When will paid plans be available?
            </h3>
            <p className="text-textSecondary">
              We're currently building out the infrastructure for Pro and Enterprise
              tiers. Payment integration will be added after we reach 1,000+ active
              users. In the meantime, enjoy all features for free!
            </p>
          </div>
          <div className="bg-surface rounded-lg p-6 border border-border">
            <h3 className="text-lg font-semibold text-white mb-2">
              Can I upgrade or downgrade later?
            </h3>
            <p className="text-textSecondary">
              Yes! Once paid plans launch, you'll be able to upgrade or downgrade at
              any time. Your data is always preserved, though some features may be
              limited on lower tiers.
            </p>
          </div>
          <div className="bg-surface rounded-lg p-6 border border-border">
            <h3 className="text-lg font-semibold text-white mb-2">
              What happens to my data if I downgrade?
            </h3>
            <p className="text-textSecondary">
              Your data is never deleted. If you exceed tier limits (e.g., more than 5
              friends on Free tier), you'll keep your existing data but won't be able
              to add more until you upgrade or remove some items.
            </p>
          </div>
          <div className="bg-surface rounded-lg p-6 border border-border">
            <h3 className="text-lg font-semibold text-white mb-2">
              Is there a discount for annual billing?
            </h3>
            <p className="text-textSecondary">
              We plan to offer annual billing at a discount (approximately 2 months
              free) when paid plans launch. Stay tuned!
            </p>
          </div>
        </div>
      </div>

      {/* Footer CTA */}
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <div className="bg-gradient-to-r from-primary/10 to-green-400/10 rounded-lg p-8 border border-primary/20">
          <h2 className="text-2xl font-bold text-white mb-3">
            Ready to start tracking your squash journey?
          </h2>
          <p className="text-textSecondary mb-6">
            Join SquashIQ today and get instant access to all features while we're in
            beta.
          </p>
          <Link
            to="/"
            className="inline-block bg-gradient-to-r from-primary to-green-400 text-black font-bold px-8 py-3 rounded-lg hover:from-green-400 hover:to-primary transition-all"
          >
            Get Started Free →
          </Link>
        </div>
      </div>
    </div>
  );
}
