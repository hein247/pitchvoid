import { useState, useRef, useEffect } from 'react';
import { ThumbsUp, ThumbsDown, Check } from 'lucide-react';
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

interface TopBarFeedbackProps {
  projectId: string;
  format: 'one-pager' | 'script';
  generatedOutput?: Record<string, unknown>;
  generationKey: number;
}

const TopBarFeedback = ({ projectId, format, generatedOutput, generationKey }: TopBarFeedbackProps) => {
  const { user } = useAuth();
  const [rating, setRating] = useState<1 | 5 | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIssues, setSelectedIssues] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [showCheck, setShowCheck] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Reset on new generation
  useEffect(() => {
    setRating(null);
    setShowDropdown(false);
    setSelectedIssues([]);
    setSubmitted(false);
    setShowCheck(false);
    setIsSubmitting(false);
  }, [generationKey]);

  // Close dropdown on outside click
  useEffect(() => {
    if (!showDropdown) return;
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showDropdown]);

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
      // Non-critical
    } finally {
      setIsSubmitting(false);
      setSubmitted(true);
    }
  };

  const handleThumbsUp = () => {
    if (submitted || isSubmitting) return;
    setRating(5);
    setShowCheck(true);
    submitFeedback(5);
    setTimeout(() => setShowCheck(false), 800);
  };

  const handleThumbsDown = () => {
    if (submitted || isSubmitting) return;
    setRating(1);
    setShowDropdown(true);
  };

  const toggleIssue = (value: string) => {
    setSelectedIssues(prev =>
      prev.includes(value) ? prev.filter(i => i !== value) : [...prev, value]
    );
  };

  const handleSubmitIssues = () => {
    submitFeedback(1, selectedIssues);
    setShowDropdown(false);
  };

  return (
    <div className="relative flex items-center" ref={dropdownRef}>
      {/* Thumbs Up */}
      <button
        onClick={handleThumbsUp}
        disabled={submitted || isSubmitting}
        className={`p-2 rounded-lg transition-all min-h-[44px] min-w-[44px] flex items-center justify-center ${
          submitted
            ? 'text-muted-foreground/25 cursor-default'
            : rating === 5
              ? 'text-green-400/70'
              : 'text-muted-foreground hover:text-foreground hover:bg-accent/10'
        }`}
        title="Good output"
      >
        {showCheck ? (
          <Check className="w-4 h-4 text-green-400 animate-in zoom-in duration-200" />
        ) : (
          <ThumbsUp className="w-3.5 h-3.5" />
        )}
      </button>

      {/* Thumbs Down */}
      <button
        onClick={handleThumbsDown}
        disabled={submitted || isSubmitting}
        className={`p-2 rounded-lg transition-all min-h-[44px] min-w-[44px] flex items-center justify-center ${
          submitted
            ? 'text-muted-foreground/25 cursor-default'
            : rating === 1
              ? 'text-red-400/70'
              : 'text-muted-foreground hover:text-foreground hover:bg-accent/10'
        }`}
        title="Needs improvement"
      >
        <ThumbsDown className="w-3.5 h-3.5" />
      </button>

      {/* Desktop Dropdown */}
      {showDropdown && (
        <div className="absolute top-full right-0 mt-2 w-64 rounded-xl border border-border bg-card shadow-xl z-50 p-3 animate-in fade-in slide-in-from-top-2 duration-200">
          <p className="text-xs text-muted-foreground mb-2 font-medium">What went wrong?</p>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {ISSUE_CHIPS.map((chip) => (
              <button
                key={chip.value}
                onClick={() => toggleIssue(chip.value)}
                className={`px-2.5 py-1.5 rounded-full text-[11px] border transition-all ${
                  selectedIssues.includes(chip.value)
                    ? 'border-primary/30 bg-primary/10 text-primary/80'
                    : 'border-border text-muted-foreground hover:border-border/80 hover:text-foreground'
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
              className="w-full py-2 rounded-lg text-xs font-medium bg-primary/10 text-primary hover:bg-primary/15 transition-all disabled:opacity-50"
            >
              Submit
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default TopBarFeedback;

/* ──── Mobile Bottom Sheet variant ──── */

export interface MobileFeedbackSheetProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  format: 'one-pager' | 'script';
  generatedOutput?: Record<string, unknown>;
}

export const MobileFeedbackSheet = ({ isOpen, onClose, projectId, format, generatedOutput }: MobileFeedbackSheetProps) => {
  const { user } = useAuth();
  const [selectedIssues, setSelectedIssues] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleIssue = (value: string) => {
    setSelectedIssues(prev =>
      prev.includes(value) ? prev.filter(i => i !== value) : [...prev, value]
    );
  };

  const handleSubmit = async () => {
    if (!user) return;
    setIsSubmitting(true);
    try {
      await supabase.functions.invoke('submit-feedback', {
        body: {
          project_id: projectId,
          rating: 1,
          issues: selectedIssues,
          format,
          output_json: generatedOutput || null,
        },
      });
    } catch {
      // Non-critical
    } finally {
      setIsSubmitting(false);
      setSelectedIssues([]);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50" />
      <div
        className="relative w-full rounded-t-2xl border-t border-border bg-background p-4 animate-slideUp"
        onClick={e => e.stopPropagation()}
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 16px)' }}
      >
        <div className="w-10 h-1 rounded-full bg-border mx-auto mb-4" />
        <p className="text-sm font-medium text-foreground mb-3">What went wrong?</p>
        <div className="flex flex-wrap gap-2 mb-4">
          {ISSUE_CHIPS.map((chip) => (
            <button
              key={chip.value}
              onClick={() => toggleIssue(chip.value)}
              className={`px-3 py-2 rounded-full text-xs border transition-all min-h-[44px] ${
                selectedIssues.includes(chip.value)
                  ? 'border-primary/30 bg-primary/10 text-primary/80'
                  : 'border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>
        {selectedIssues.length > 0 && (
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full py-3 rounded-xl text-sm font-medium bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50 min-h-[44px]"
          >
            Submit
          </button>
        )}
        <button
          onClick={onClose}
          className="w-full py-3 rounded-xl text-sm text-muted-foreground hover:bg-accent/5 transition-colors min-h-[44px] mt-2"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};
