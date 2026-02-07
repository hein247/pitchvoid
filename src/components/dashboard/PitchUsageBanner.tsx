import { Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PitchUsageBannerProps {
  pitchCount: number;
  maxPitches: number | null;
  plan: string;
}

const PitchUsageBanner = ({ pitchCount, maxPitches, plan }: PitchUsageBannerProps) => {
  const navigate = useNavigate();

  // Don't show for unlimited plans
  if (maxPitches === null) return null;

  const remaining = Math.max(0, maxPitches - pitchCount);
  const usagePercent = Math.min(100, (pitchCount / maxPitches) * 100);

  // Only show when usage >= 33% (at least 1 of 3 used)
  if (pitchCount === 0) return null;

  // Color based on urgency
  const isWarning = remaining <= 1;
  const isDepleted = remaining === 0;

  return (
    <div
      className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border text-sm transition-all ${
        isDepleted
          ? 'bg-destructive/10 border-destructive/30 text-destructive'
          : isWarning
            ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
            : 'bg-accent/5 border-accent/20 text-muted-foreground'
      }`}
    >
      <Zap className={`w-4 h-4 flex-shrink-0 ${isDepleted ? 'text-destructive' : isWarning ? 'text-amber-400' : 'text-accent'}`} />

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate">
            {isDepleted
              ? `All ${maxPitches} free pitches used`
              : `${pitchCount} of ${maxPitches} free pitches used`}
          </span>
          {remaining > 0 && (
            <span className="text-xs whitespace-nowrap">
              {remaining} left
            </span>
          )}
        </div>

        {/* Mini progress bar */}
        <div className="h-1 w-full rounded-full bg-muted/30 mt-1.5">
          <div
            className={`h-full rounded-full transition-all ${
              isDepleted
                ? 'bg-destructive'
                : isWarning
                  ? 'bg-amber-400'
                  : 'bg-accent'
            }`}
            style={{ width: `${usagePercent}%` }}
          />
        </div>
      </div>

      {plan === 'free' && (
        <button
          onClick={() => navigate('/pricing')}
          className="text-xs font-medium px-3 py-1.5 rounded-lg bg-primary/20 text-primary hover:bg-primary/30 transition-colors whitespace-nowrap flex-shrink-0"
        >
          Upgrade
        </button>
      )}
    </div>
  );
};

export default PitchUsageBanner;
