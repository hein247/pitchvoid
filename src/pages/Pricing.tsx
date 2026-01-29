import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield, CreditCard, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { PricingCard } from '@/components/pricing/PricingCard';
import { usePricing } from '@/hooks/usePricing';
import { PlanType } from '@/lib/pricing';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export default function Pricing() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { userPlan, isLoading } = usePricing();
  const { toast } = useToast();
  const [isYearly, setIsYearly] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState<PlanType | null>(null);

  const handleSelectPlan = async (plan: PlanType) => {
    if (plan === 'free') {
      // Already on free or downgrading - redirect to dashboard
      navigate('/dashboard');
      return;
    }

    if (!user) {
      // Redirect to auth if not logged in
      navigate('/auth?redirect=/pricing');
      return;
    }

    // For pro/teams, initiate Stripe checkout
    setCheckoutLoading(plan);
    
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: {
          planType: plan,
          isYearly,
          seatCount: plan === 'teams' ? 2 : undefined,
        },
      });

      if (error) throw error;

      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (err) {
      console.error('Checkout error:', err);
      toast({
        title: 'Checkout failed',
        description: 'Unable to start checkout. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setCheckoutLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          
          <div className="font-bold text-xl text-foreground">PitchVoid</div>
          
          <div className="w-20" /> {/* Spacer for centering */}
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-12">
        {/* Hero */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Simple, transparent pricing
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Choose the plan that works for you. Upgrade anytime to unlock more
            features and unlimited pitch generations.
          </p>
        </div>

        {/* Billing toggle */}
        <div className="flex items-center justify-center gap-4 mb-10">
          <Label
            htmlFor="billing-toggle"
            className={`text-sm cursor-pointer ${!isYearly ? 'text-foreground' : 'text-muted-foreground'}`}
          >
            Monthly
          </Label>
          <Switch
            id="billing-toggle"
            checked={isYearly}
            onCheckedChange={setIsYearly}
          />
          <Label
            htmlFor="billing-toggle"
            className={`text-sm cursor-pointer ${isYearly ? 'text-foreground' : 'text-muted-foreground'}`}
          >
            Yearly
            <span className="ml-1 text-xs text-primary font-medium">
              Save 17%
            </span>
          </Label>
        </div>

        {/* Pricing cards */}
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-16">
          <PricingCard
            plan="free"
            isYearly={isYearly}
            isCurrentPlan={userPlan === 'free'}
            onSelect={handleSelectPlan}
            isLoading={checkoutLoading === 'free'}
          />
          <PricingCard
            plan="pro"
            isYearly={isYearly}
            isCurrentPlan={userPlan === 'pro'}
            onSelect={handleSelectPlan}
            isLoading={checkoutLoading === 'pro'}
          />
          <PricingCard
            plan="teams"
            isYearly={isYearly}
            isCurrentPlan={userPlan === 'teams'}
            onSelect={handleSelectPlan}
            isLoading={checkoutLoading === 'teams'}
          />
        </div>

        {/* Guarantees */}
        <div className="bg-white/[0.02] border border-border rounded-2xl p-8 max-w-3xl mx-auto">
          <h2 className="text-xl font-semibold text-center text-foreground mb-6">
            Our guarantees
          </h2>
          <div className="grid sm:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <CreditCard className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-medium text-foreground mb-1">No CC required</h3>
              <p className="text-sm text-muted-foreground">
                Try free tier without entering payment info
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-medium text-foreground mb-1">Cancel anytime</h3>
              <p className="text-sm text-muted-foreground">
                No lock-in, pause or cancel in one click
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <RotateCcw className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-medium text-foreground mb-1">7-day refund</h3>
              <p className="text-sm text-muted-foreground">
                Not satisfied? Get a full refund, no questions
              </p>
            </div>
          </div>
        </div>

        {/* FAQ teaser */}
        <div className="text-center mt-12">
          <p className="text-muted-foreground text-sm">
            Have questions?{' '}
            <a href="mailto:support@pitchvoid.com" className="text-primary hover:underline">
              Contact us
            </a>
          </p>
        </div>
      </main>
    </div>
  );
}
