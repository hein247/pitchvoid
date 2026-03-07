import { useState, useEffect } from 'react';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { MobileFeedbackSheet } from './TopBarFeedback';

const ISSUE_CHIPS: { label: string; value: string }[] = [
  { label: 'Too formal', value: 'too_formal' },
  { label: 'Too vague', value: 'too_vague' },
  { label: 'Wrong tone', value: 'wrong_tone' },
  { label: 'Missing detail', value: 'missing_detail' },
  { label: 'Too long', value: 'too_long' },
  { label: 'Made something up', value: 'hallucinated' },
];

interface InlineFeedbackProps {
  projectId: string;
  format: 'one-pager' | 'script';
  generatedOutput?: Record<string, unknown>;
  generationKey: number;
}

const InlineFeedback = ({ projectId, format, generatedOutput, generationKey }: InlineFeedbackProps) => {
  const { user } = useAuth();
  const [rating, setRating] = useState<1 | 5 | null>(null);
  const [showIssues, setShowIssues] = useState(false);
  const [selectedIssues, setSelectedIssues] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showMobileSheet, setShowMobileSheet] = useState(false);

  // Reset on new generation
  useEffect(() => {
    setRating(null);
    setShowIssues(false);
    setSelectedIssues([]);
    setSubmitted(false);
    setIsSubmitting(false);
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
      // Non-critical
    } finally {
      setIsSubmitting(false);
      setSubmitted(true);
    }
  };

  const handleThumbsUp = () => {
    if (submitted || isSubmitting) return;
    setRating(5);
    setShowIssues(false);
    submitFeedback(5);
  };

  const handleThumbsDown = () => {
    if (submitted || isSubmitting) return;
    setRating(1);
    // On mobile, show bottom sheet; on desktop, show inline chips
    if (window.innerWidth < 640) {
      setShowMobileSheet(true);
    } else {
      setShowIssues(true);
    }
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

  if (submitted) {
    return (
      <div className="flex flex-col items-center gap-2 py-8 animate-fadeIn">
        <span style={{ fontSize: 13, color: 'rgba(240,237,246,0.3)' }}>
          {rating === 5 ? 'Thanks!' : 'Thanks — we\'ll improve!'}
        </span>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col items-center gap-4 py-8 animate-fadeIn">
        {/* Label */}
        <span style={{ fontSize: 13, color: 'rgba(240,237,246,0.3)' }}>
          Did this help?
        </span>

        {/* Thumbs row */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleThumbsUp}
            disabled={isSubmitting}
            className="p-3 rounded-xl transition-all min-h-[44px] min-w-[44px] flex items-center justify-center"
            style={{
              color: rating === 5 ? 'rgba(74,222,128,0.7)' : undefined,
            }}
            title="Yes, this helped"
          >
            <ThumbsUp
              className="transition-colors"
              style={{
                width: 24,
                height: 24,
                color: rating === 5
                  ? 'rgba(74,222,128,0.7)'
                  : 'rgba(240,237,246,0.25)',
              }}
              onMouseEnter={(e) => {
                if (!rating) (e.currentTarget as SVGElement).style.color = 'rgba(240,237,246,0.5)';
              }}
              onMouseLeave={(e) => {
                if (!rating) (e.currentTarget as SVGElement).style.color = 'rgba(240,237,246,0.25)';
              }}
            />
          </button>
          <button
            onClick={handleThumbsDown}
            disabled={isSubmitting}
            className="p-3 rounded-xl transition-all min-h-[44px] min-w-[44px] flex items-center justify-center"
            title="Needs improvement"
          >
            <ThumbsDown
              className="transition-colors"
              style={{
                width: 24,
                height: 24,
                color: rating === 1
                  ? 'rgba(248,113,113,0.7)'
                  : 'rgba(240,237,246,0.25)',
              }}
              onMouseEnter={(e) => {
                if (!rating) (e.currentTarget as SVGElement).style.color = 'rgba(240,237,246,0.5)';
              }}
              onMouseLeave={(e) => {
                if (!rating) (e.currentTarget as SVGElement).style.color = 'rgba(240,237,246,0.25)';
              }}
            />
          </button>
        </div>

        {/* Desktop issue chips */}
        {showIssues && (
          <div className="flex flex-col items-center gap-3 animate-fadeIn max-w-md">
            <p style={{ fontSize: 12, color: 'rgba(240,237,246,0.4)' }} className="font-medium">
              What went wrong?
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {ISSUE_CHIPS.map((chip) => (
                <button
                  key={chip.value}
                  onClick={() => toggleIssue(chip.value)}
                  className={`px-3 py-1.5 rounded-full text-[11px] border transition-all ${
                    selectedIssues.includes(chip.value)
                      ? 'border-primary/30 bg-primary/10 text-primary/80'
                      : 'border-border/30 text-muted-foreground/40 hover:border-border/50 hover:text-muted-foreground/60'
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
                className="px-5 py-2 rounded-full text-xs font-medium bg-primary/10 text-primary/60 hover:bg-primary/15 transition-all disabled:opacity-50"
              >
                Submit
              </button>
            )}
          </div>
        )}
      </div>

      {/* Mobile feedback sheet */}
      <MobileFeedbackSheet
        isOpen={showMobileSheet}
        onClose={() => {
          setShowMobileSheet(false);
          // If they closed without submitting, mark as submitted with just the rating
          if (!submitted) {
            submitFeedback(1);
          }
        }}
        projectId={projectId}
        format={format}
        generatedOutput={generatedOutput}
      />
    </>
  );
};

export default InlineFeedback;
