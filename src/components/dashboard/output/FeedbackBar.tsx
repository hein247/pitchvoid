import { useState, useEffect, useRef } from 'react';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

const ISSUE_CHIPS: { label: string; value: string }[] = [
  { label: 'Too formal', value: 'too_formal' },
  { label: 'Too vague', value: 'too_vague' },
  { label: 'Wrong tone', value: 'wrong_tone' },
  { label: 'Missing detail', value: 'missing_detail' },
  { label: 'Too long', value: 'too_long' },
  { label: 'Made something up', value: 'hallucinated' },
];

interface FeedbackBarProps {
  projectId: string;
  format: 'one-pager' | 'script';
  generatedOutput?: Record<string, unknown>;
  /** Increment to reset feedback state (e.g. after refine) */
  generationKey: number;
}

const FeedbackBar = ({ projectId, format, generatedOutput, generationKey }: FeedbackBarProps) => {
  const { user } = useAuth();
  const [visible, setVisible] = useState(false);
  const [rating, setRating] = useState<1 | 5 | null>(null);
  const [showIssues, setShowIssues] = useState(false);
  const [selectedIssues, setSelectedIssues] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [fadingOut, setFadingOut] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  // Reset state when generation key changes (new output or refine)
  useEffect(() => {
    setVisible(false);
    setRating(null);
    setShowIssues(false);
    setSelectedIssues([]);
    setSubmitted(false);
    setFadingOut(false);
    setIsSubmitting(false);

    timerRef.current = setTimeout(() => setVisible(true), 3000);
    return () => clearTimeout(timerRef.current);
  }, [generationKey]);

  const submitFeedback = async (r: 1 | 5, issues: string[] = []) => {
    if (!user) return;
    setIsSubmitting(true);
    try {
      await supabase.functions.invoke('submit-feedback', {
        body: {
          project_id: projectId,
          rating: r,
          issues,
          format,
          output_json: generatedOutput || null,
        },
      });
    } catch {
      // Silently fail — non-critical
    } finally {
      setIsSubmitting(false);
      setSubmitted(true);
      setFadingOut(false);
      // Auto-dismiss after 2s
      setTimeout(() => setFadingOut(true), 2000);
    }
  };

  const handleThumbsUp = () => {
    setRating(5);
    setShowIssues(false);
    submitFeedback(5);
  };

  const handleThumbsDown = () => {
    setRating(1);
    setShowIssues(true);
  };

  const toggleIssue = (value: string) => {
    setSelectedIssues(prev =>
      prev.includes(value) ? prev.filter(i => i !== value) : [...prev, value]
    );
  };

  const handleSubmitIssues = () => {
    submitFeedback(1, selectedIssues);
    setShowIssues(false);
  };

  // Don't render if not visible yet or fully faded out
  if (!visible) return null;
  if (submitted && fadingOut) return null;

  return (
    <div
      className={`transition-opacity duration-500 ${
        submitted ? 'opacity-100' : 'opacity-100'
      } ${fadingOut ? 'opacity-0' : ''}`}
      style={{ animation: !submitted ? 'fadeIn 0.5s ease-out' : undefined }}
    >
      {submitted ? (
        <div className="flex items-center justify-center gap-2 py-3">
          <span className="text-xs text-muted-foreground/30">
            {rating === 5 ? 'Thanks!' : 'Thanks — we\'ll improve!'}
          </span>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Rating row */}
          <div className="flex items-center justify-center gap-3">
            <span className="text-xs text-muted-foreground/30">How was this?</span>
            <button
              onClick={handleThumbsUp}
              disabled={isSubmitting}
              className={`p-2.5 sm:p-2 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 rounded-lg transition-all flex items-center justify-center ${
                rating === 5
                  ? 'text-green-400/60'
                  : 'text-muted-foreground/20 hover:text-green-400/40'
              }`}
            >
              <ThumbsUp className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleThumbsDown}
              disabled={isSubmitting}
              className={`p-2.5 sm:p-2 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 rounded-lg transition-all flex items-center justify-center ${
                rating === 1
                  ? 'text-red-400/60'
                  : 'text-muted-foreground/20 hover:text-red-400/40'
              }`}
            >
              <ThumbsDown className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Issue chips */}
          {showIssues && (
            <div className="flex flex-col items-center gap-3 animate-fadeIn">
              <div className="flex flex-wrap justify-center gap-2">
                {ISSUE_CHIPS.map((chip) => (
                  <button
                    key={chip.value}
                    onClick={() => toggleIssue(chip.value)}
                    className={`px-3 py-1.5 min-h-[44px] sm:min-h-0 rounded-full text-[11px] border transition-all ${
                      selectedIssues.includes(chip.value)
                        ? 'border-primary/30 bg-primary/10 text-primary/70'
                        : 'border-border/30 text-muted-foreground/30 hover:border-border/50 hover:text-muted-foreground/50'
                    }`}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
              {selectedIssues.length > 0 && (
                <button
                  onClick={handleSubmitIssues}
                  disabled={isSubmitting}
                  className="px-4 py-1.5 min-h-[44px] sm:min-h-0 rounded-full text-[11px] font-medium bg-primary/10 text-primary/60 hover:bg-primary/15 transition-all disabled:opacity-50"
                >
                  Submit
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FeedbackBar;
