import { AlertTriangle, RefreshCw, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface GenerationErrorProps {
  error: string;
  errorType: 'rate_limit' | 'credits' | 'network' | 'generic';
  onRetry: () => void;
  retryCount?: number;
  resetTime?: string;
}

const ERROR_CONFIG: Record<string, { icon: typeof AlertTriangle; title: string; color: string }> = {
  rate_limit: {
    icon: Clock,
    title: 'Slow down // too many requests',
    color: 'text-amber-400',
  },
  credits: {
    icon: AlertTriangle,
    title: 'AI credits exhausted',
    color: 'text-amber-400',
  },
  network: {
    icon: RefreshCw,
    title: 'Connection issue',
    color: 'text-blue-400',
  },
  generic: {
    icon: AlertTriangle,
    title: 'Something went wrong',
    color: 'text-destructive',
  },
};

const GenerationError = ({ error, errorType, onRetry, retryCount = 0, resetTime }: GenerationErrorProps) => {
  const config = ERROR_CONFIG[errorType] || ERROR_CONFIG.generic;
  const Icon = config.icon;

  return (
    <div className="py-8 sm:py-12 text-center">
      <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-6 rounded-full bg-card border border-border flex items-center justify-center">
        <Icon className={`w-8 h-8 sm:w-10 sm:h-10 ${config.color}`} />
      </div>

      <h3 className="text-foreground font-display text-lg mb-2">{config.title}</h3>
      <p className="text-muted-foreground text-sm max-w-sm mx-auto mb-2">{error}</p>

      {resetTime && (
        <p className="text-xs text-muted-foreground mb-4">
          Resets at {resetTime}
        </p>
      )}

      {errorType !== 'credits' && (
        <Button
          onClick={onRetry}
          variant="outline"
          className="mt-4 gap-2"
          disabled={retryCount >= 3}
        >
          <RefreshCw className="w-4 h-4" />
          {retryCount >= 3 ? 'Too many retries' : 'Try again'}
        </Button>
      )}

      {retryCount >= 3 && (
        <p className="text-xs text-muted-foreground mt-3">
          Still not working? Try again in a few minutes or contact support.
        </p>
      )}
    </div>
  );
};

export default GenerationError;
