import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Check, Sparkles, Lock, Zap } from 'lucide-react';
import { PRICING } from '@/lib/pricing';
import { useNavigate } from 'react-router-dom';

interface PaywallModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: 'pitch_limit' | 'feature_locked' | 'slide_limit' | null;
  message?: string | null;
}

export function PaywallModal({ open, onOpenChange, type, message }: PaywallModalProps) {
  const navigate = useNavigate();
  const proLimits = PRICING.pro.limits;

  const getTitle = () => {
    switch (type) {
      case 'pitch_limit':
        return "You've reached your limit";
      case 'feature_locked':
        return 'Unlock this feature';
      case 'slide_limit':
        return 'Need more slides?';
      default:
        return 'Upgrade to Pro';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'pitch_limit':
        return <Zap className="w-8 h-8 text-primary" />;
      case 'feature_locked':
        return <Lock className="w-8 h-8 text-primary" />;
      case 'slide_limit':
        return <Sparkles className="w-8 h-8 text-primary" />;
      default:
        return <Sparkles className="w-8 h-8 text-primary" />;
    }
  };

  const handleUpgrade = () => {
    onOpenChange(false);
    navigate('/pricing');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-background/95 backdrop-blur-xl border-border">
        <DialogHeader className="text-center pb-4">
          <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            {getIcon()}
          </div>
          <DialogTitle className="text-2xl font-bold text-center">
            {getTitle()}
          </DialogTitle>
          {message && (
            <p className="text-muted-foreground text-center mt-2">
              {message}
            </p>
          )}
        </DialogHeader>

        <div className="space-y-4">
          {/* Pro benefits preview */}
          <div className="bg-white/[0.03] rounded-lg p-4 space-y-3">
            <p className="text-sm font-medium text-foreground">
              Upgrade to Pro and get:
            </p>
            <ul className="space-y-2">
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <Check className="w-4 h-4 text-primary flex-shrink-0" />
                <span>Unlimited pitch generations</span>
              </li>
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <Check className="w-4 h-4 text-primary flex-shrink-0" />
                <span>All formats: Slides, One-Pager, Script</span>
              </li>
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <Check className="w-4 h-4 text-primary flex-shrink-0" />
                <span>Up to {proLimits.maxSlides} slides per pitch</span>
              </li>
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <Check className="w-4 h-4 text-primary flex-shrink-0" />
                <span>Export & download your pitches</span>
              </li>
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <Check className="w-4 h-4 text-primary flex-shrink-0" />
                <span>No watermarks</span>
              </li>
            </ul>
          </div>

          {/* CTA */}
          <Button
            onClick={handleUpgrade}
            className="w-full h-12 text-base font-semibold bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity"
          >
            <Sparkles className="w-5 h-5 mr-2" />
            Upgrade — ${PRICING.pro.monthlyPrice}/mo
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            Cancel anytime • 7-day money-back guarantee
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
