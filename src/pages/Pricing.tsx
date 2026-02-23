import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface CreditPack {
  id: string;
  credits: number;
  label: string;
  tagline: string;
  price: number;
  perUse: string;
  features: string[];
  highlighted?: boolean;
  badge?: string;
}

const CREDIT_PACKS: CreditPack[] = [
  {
    id: 'credits_10',
    credits: 10,
    label: '10 Credits',
    tagline: 'A few important conversations.',
    price: 5,
    perUse: '$0.50 per use',
    features: [
      'Works for anything — pitches, interviews, tough conversations, speeches',
      'One-pager and talking script formats',
      'Refine until it sounds like you',
      'Download as PDF',
      'Practice mode with breathing and teleprompter',
      'Credits never expire',
    ],
  },
  {
    id: 'credits_30',
    credits: 30,
    label: '30 Credits',
    tagline: 'For someone who is always in the room.',
    price: 12,
    perUse: '$0.40 per use',
    highlighted: true,
    badge: 'Best Value',
    features: [
      'Everything above',
      'Best price per credit',
    ],
  },
  {
    id: 'credits_100',
    credits: 100,
    label: '100 Credits',
    tagline: 'Never walk in unprepared.',
    price: 29,
    perUse: '$0.29 per use',
    features: [
      'Everything above',
      'Lowest price per credit',
      'Faster output',
    ],
  },
];

export default function Pricing() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);

  const handleBuy = async (pack: CreditPack) => {
    if (!user) {
      navigate('/auth?redirect=/pricing');
      return;
    }

    setCheckoutLoading(pack.id);

    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { creditPackId: pack.id, credits: pack.credits },
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

          <button
            onClick={() => navigate('/')}
            className="font-bold text-xl font-display brand-gradient-text"
          >
            PitchVoid
          </button>

          <div className="w-20" />
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-14 sm:py-20">
        {/* Headline */}
        <div className="text-center mb-14">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-4 font-display">
            Pay for what you use. Nothing more.
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
            No subscriptions. No monthly charges. Buy credits, use them whenever you need to sound like you know what you're doing.
          </p>
        </div>

        {/* Credit pack cards */}
        <div className="grid md:grid-cols-3 gap-5 sm:gap-6 mb-16 sm:mb-20">
          {CREDIT_PACKS.map((pack) => (
            <div
              key={pack.id}
              className={cn(
                'relative rounded-2xl border p-6 flex flex-col backdrop-blur-sm',
                pack.highlighted
                  ? 'border-accent bg-gradient-to-b from-accent/10 to-transparent shadow-lg shadow-accent/10'
                  : 'border-border bg-[rgba(255,255,255,0.02)]'
              )}
            >
              {/* Badge */}
              {pack.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-accent text-accent-foreground text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    {pack.badge}
                  </span>
                </div>
              )}

              {/* Header */}
              <div className="mb-5">
                <h3 className="text-xl font-bold text-foreground">{pack.label}</h3>
                <p className="text-sm text-primary/80 mt-1.5 font-medium italic">
                  {pack.tagline}
                </p>
              </div>

              {/* Price */}
              <div className="mb-6">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-foreground">${pack.price}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">{pack.perUse}</p>
              </div>

              {/* Features */}
              <ul className="space-y-3 mb-6 flex-1">
                {pack.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Button
                onClick={() => handleBuy(pack)}
                disabled={checkoutLoading === pack.id}
                className={cn(
                  'w-full h-11 mt-auto',
                  pack.highlighted
                    ? 'bg-gradient-to-r from-primary to-accent hover:opacity-90 text-primary-foreground'
                    : 'bg-[rgba(255,255,255,0.06)] hover:bg-[rgba(255,255,255,0.12)] text-foreground border border-border'
                )}
              >
                {checkoutLoading === pack.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  `Get ${pack.credits} credits`
                )}
              </Button>
            </div>
          ))}
        </div>

        {/* How credits work */}
        <div className="max-w-2xl mx-auto">
          <h2 className="text-xl sm:text-2xl font-semibold text-foreground text-center mb-8 font-display">
            How credits work
          </h2>

          <div className="space-y-4 mb-6">
            <div className="flex items-start gap-3 text-sm sm:text-base text-muted-foreground">
              <span className="text-lg leading-none mt-0.5">🎯</span>
              <span>1 credit = 1 generated output (one-pager or talking script)</span>
            </div>
            <div className="flex items-start gap-3 text-sm sm:text-base text-muted-foreground">
              <span className="text-lg leading-none mt-0.5">🔄</span>
              <span>Refining, editing, and switching versions are free — unlimited</span>
            </div>
            <div className="flex items-start gap-3 text-sm sm:text-base text-muted-foreground">
              <span className="text-lg leading-none mt-0.5">🎧</span>
              <span>Practice mode, breathing, teleprompter, and PDF export are always free</span>
            </div>
          </div>

          <p className="text-center text-sm text-muted-foreground/70">
            Every new account starts with 3 free credits. No credit card needed.
          </p>
        </div>

        {/* Contact */}
        <div className="text-center mt-14">
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
