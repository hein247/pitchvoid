import { useState } from 'react';
import { Check, Sparkles, Clock, Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { PlanType, PRICING, getYearlySavings } from '@/lib/pricing';

interface PricingCardProps {
  plan: PlanType;
  isYearly: boolean;
  isCurrentPlan?: boolean;
  onSelect: (plan: PlanType) => void;
  isLoading?: boolean;
}

const OUTCOME_LINES: Record<PlanType, string> = {
  free: 'See what AI-crafted pitches feel like.',
  pro: 'Every pitch, polished and ready to send.',
  teams: "One workspace for your whole team's pitches.",
};

const FEATURES: Record<PlanType, string[]> = {
  free: [
    '3 pitch generations',
    'One-Pager format',
    'Basic AI generation',
    'Shareable links (watermark)',
  ],
  pro: [
    'Unlimited pitch generations',
    'All formats: One-Pager & Script',
    'Priority AI generation',
    'Export to PDF',
    'No watermarks',
    'Practice mode with teleprompter',
    'Version history',
  ],
  teams: [
    'Everything in Pro',
    'Shared team workspace',
    'Shared pitch library',
    'Admin controls & analytics',
    'Priority support',
    'Custom branding',
  ],
};

export function PricingCard({
  plan,
  isYearly,
  isCurrentPlan,
  onSelect,
  isLoading,
}: PricingCardProps) {
  const [waitlistEmail, setWaitlistEmail] = useState('');
  const [waitlistSubmitted, setWaitlistSubmitted] = useState(false);
  const [waitlistLoading, setWaitlistLoading] = useState(false);

  const planData = PRICING[plan];
  const features = FEATURES[plan];
  const monthlyEquivalent = isYearly ? Math.round(planData.yearlyPrice / 12) : planData.monthlyPrice;
  const price = isYearly ? planData.yearlyPrice : planData.monthlyPrice;
  const savings = getYearlySavings(plan);

  const isPopular = planData.popular;
  const isFree = plan === 'free';
  const isTeams = plan === 'teams';

  const handleWaitlistSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!waitlistEmail) return;
    setWaitlistLoading(true);
    // Simulate submission — replace with real endpoint later
    setTimeout(() => {
      setWaitlistSubmitted(true);
      setWaitlistLoading(false);
    }, 800);
  };

  return (
    <div
      className={cn(
        'relative rounded-2xl border p-6 flex flex-col',
        isPopular
          ? 'border-primary bg-gradient-to-b from-primary/10 to-transparent shadow-lg shadow-primary/10'
          : 'border-border bg-[rgba(255,255,255,0.02)]',
        isCurrentPlan && 'ring-2 ring-primary/50'
      )}
    >
      {/* Popular badge */}
      {isPopular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            Most Popular
          </span>
        </div>
      )}

      {/* Coming Soon badge for Teams */}
      {isTeams && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="bg-accent text-accent-foreground text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Coming Soon
          </span>
        </div>
      )}

      {/* Current plan badge */}
      {isCurrentPlan && !isTeams && (
        <div className="absolute -top-3 right-4">
          <span className="bg-muted text-muted-foreground text-xs font-medium px-3 py-1 rounded-full">
            Current Plan
          </span>
        </div>
      )}

      {/* Header */}
      <div className="mb-5">
        <h3 className="text-xl font-bold text-foreground">{planData.name}</h3>
        <p className="text-sm text-primary/80 mt-1.5 font-medium italic">
          {OUTCOME_LINES[plan]}
        </p>
      </div>

      {/* Price */}
      <div className="mb-6">
        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-bold text-foreground">
            ${isFree ? 0 : monthlyEquivalent}
          </span>
          {!isFree && (
            <span className="text-muted-foreground text-sm">/month</span>
          )}
        </div>
        {!isFree && isYearly && (
          <p className="text-sm text-muted-foreground mt-1">
            ${price} billed yearly
            {savings > 0 && (
              <span className="text-primary font-medium ml-1">
                (Save {savings}%)
              </span>
            )}
          </p>
        )}
        {!isFree && !isYearly && (
          <p className="text-sm text-muted-foreground mt-1">
            ${price} billed monthly
          </p>
        )}
        {isTeams && (
          <p className="text-xs text-muted-foreground mt-1">per user · min 2 seats</p>
        )}
      </div>

      {/* Features */}
      <ul className="space-y-3 mb-6 flex-1">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start gap-2 text-sm">
            <Check className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
            <span className="text-muted-foreground">{feature}</span>
          </li>
        ))}
      </ul>

      {/* CTA */}
      {isTeams ? (
        // Waitlist email capture for Teams
        <div className="mt-auto">
          {waitlistSubmitted ? (
            <div className="text-center py-3 px-4 rounded-xl bg-primary/10 border border-primary/30">
              <p className="text-sm text-primary font-medium">You're on the list! 🎉</p>
              <p className="text-xs text-muted-foreground mt-1">We'll notify you at launch.</p>
            </div>
          ) : (
            <form onSubmit={handleWaitlistSubmit} className="space-y-2">
              <input
                type="email"
                required
                placeholder="your@email.com"
                value={waitlistEmail}
                onChange={(e) => setWaitlistEmail(e.target.value)}
                className="w-full h-11 px-4 rounded-xl text-sm bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-colors"
              />
              <Button
                type="submit"
                disabled={waitlistLoading}
                className="w-full h-11 bg-accent/20 hover:bg-accent/30 text-foreground"
              >
                {waitlistLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Join Waitlist
                  </>
                )}
              </Button>
            </form>
          )}
        </div>
      ) : (
        <Button
          onClick={() => onSelect(plan)}
          disabled={isCurrentPlan || isLoading}
          className={cn(
            'w-full h-11 mt-auto',
            isPopular
              ? 'bg-gradient-to-r from-primary to-accent hover:opacity-90'
              : isFree
              ? 'bg-muted hover:bg-muted/80 text-foreground'
              : 'bg-[rgba(255,255,255,0.1)] hover:bg-[rgba(255,255,255,0.15)] text-foreground'
          )}
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : isCurrentPlan ? (
            'Current Plan'
          ) : isFree ? (
            'Get Started Free'
          ) : (
            `Get ${planData.name}`
          )}
        </Button>
      )}
    </div>
  );
}
