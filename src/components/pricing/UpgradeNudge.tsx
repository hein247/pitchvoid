import { X, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

interface UpgradeNudgeProps {
  message: string;
  show: boolean;
  onDismiss: () => void;
}

export function UpgradeNudge({ message, show, onDismiss }: UpgradeNudgeProps) {
  const navigate = useNavigate();

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="fixed top-4 right-4 z-50 max-w-sm w-auto"
        >
          <div className="bg-card/90 backdrop-blur-xl border border-accent/25 rounded-xl p-3.5 shadow-[0_8px_32px_rgba(124,77,255,0.12)]">
            <div className="flex items-center gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground leading-tight">{message}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Get more credits to keep generating
                </p>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                <Button
                  size="sm"
                  onClick={() => navigate('/pricing')}
                  className="magenta-gradient text-primary-foreground text-xs px-3 h-8 rounded-lg font-medium"
                >
                  Upgrade
                </Button>
                <button
                  onClick={onDismiss}
                  className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-white/10"
                  aria-label="Dismiss"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
