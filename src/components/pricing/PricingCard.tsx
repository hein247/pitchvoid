import { Check, Sparkles } from 'lucide-react';
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

const FEATURES: Record<PlanType, string[]> = {
  free: [
    '3 pitch generations',
    'Slides format only',
    'Up to 4 slides',
    'Basic AI generation',
    'PitchVoid watermark',
  ],
  pro: [
    'Unlimited pitch generations',
    'All formats: Slides, One-Pager, Script',
    'Up to 12 slides',
    'Priority AI generation',
    'Export & download',
    'No watermarks',
    'Practice mode',
    'Version history',
  ],
  teams: [
    'Everything in Pro',
    'Up to 15 slides',
    'Team workspace',
    'Shared pitch library',
    'Admin controls',
    'Priority support',
    'Custom branding (soon)',
  ],
};

export function PricingCard({
  plan,
  isYearly,
  isCurrentPlan,
  onSelect,
  isLoading,
}: PricingCardProps) {
  const planData = PRICING[plan];
  const features = FEATURES[plan];
  const price = isYearly ? planData.yearlyPrice : planData.monthlyPrice;
  const monthlyEquivalent = isYearly ? Math.round(planData.yearlyPrice / 12) : planData.monthlyPrice;
  const savings = getYearlySavings(plan);

  const isPopular = planData.popular;
  const isFree = plan === 'free';
  const isTeams = plan === 'teams';

  return (
    <div
      className={cn(
        'relative rounded-2xl border p-6 flex flex-col',
        isPopular
          ? 'border-primary bg-gradient-to-b from-primary/10 to-transparent shadow-lg shadow-primary/10'
          : 'border-border bg-white/[0.02]',
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

      {/* Current plan badge */}
      {isCurrentPlan && (
        <div className="absolute -top-3 right-4">
          <span className="bg-muted text-muted-foreground text-xs font-medium px-3 py-1 rounded-full">
            Current Plan
          </span>
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <h3 className="text-xl font-bold text-foreground">{planData.name}</h3>
        <p className="text-sm text-muted-foreground mt-1">{planData.description}</p>
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
          <p className="text-xs text-muted-foreground mt-1">per user</p>
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
      <Button
        onClick={() => onSelect(plan)}
        disabled={isCurrentPlan || isLoading}
        className={cn(
          'w-full h-11',
          isPopular
            ? 'bg-gradient-to-r from-primary to-accent hover:opacity-90'
            : isFree
            ? 'bg-muted hover:bg-muted/80 text-foreground'
            : 'bg-white/10 hover:bg-white/15 text-foreground'
        )}
      >
        {isCurrentPlan
          ? 'Current Plan'
          : isFree
          ? 'Get Started Free'
          : `Get ${planData.name}`}
      </Button>
    </div>
  );
}
