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
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50 max-w-md w-full mx-4"
        >
          <div className="bg-gradient-to-r from-primary/20 to-accent/20 backdrop-blur-xl border border-primary/30 rounded-lg p-4 shadow-lg">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{message}</p>
                  <p className="text-xs text-muted-foreground">
                    Love it? Get unlimited for $9/mo
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => navigate('/pricing')}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs px-3"
                >
                  Upgrade
                </Button>
                <button
                  onClick={onDismiss}
                  className="text-foreground/70 hover:text-foreground transition-colors p-1.5 rounded-md hover:bg-white/10"
                  aria-label="Dismiss"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
