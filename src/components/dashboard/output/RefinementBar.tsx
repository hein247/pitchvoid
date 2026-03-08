import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, Undo2, ThumbsUp, ThumbsDown, Send } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

const ISSUE_CHIPS: { label: string; value: string }[] = [
  { label: 'Too formal', value: 'too_formal' },
  { label: 'Too vague', value: 'too_vague' },
  { label: 'Wrong tone', value: 'wrong_tone' },
  { label: 'Missing detail', value: 'missing_detail' },
  { label: 'Made something up', value: 'hallucinated' },
];

interface RefinementBarProps {
  onRefine: (prompt: string) => void;
  onOpenOptions?: () => void;
  isRefining?: boolean;
  quickChips?: string[];
  showUndo?: boolean;
  onUndo?: () => void;
  // Feedback props
  projectId?: string;
  format?: 'one-pager' | 'script';
  generatedOutput?: Record<string, unknown>;
  generationKey?: number;
}

const DEFAULT_CHIPS = ['Shorter', 'Bolder', 'Simpler', 'More casual'];

const RefinementBar = ({
  onRefine,
  onOpenOptions,
  isRefining = false,
  quickChips = DEFAULT_CHIPS,
  showUndo = false,
  onUndo,
  projectId,
  format,
  generatedOutput,
  generationKey = 0,
}: RefinementBarProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [inputValue, setInputValue] = useState('');

  // Feedback state
  const [feedbackRating, setFeedbackRating] = useState<'up' | 'down' | null>(null);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [showPopover, setShowPopover] = useState(false);
  const [selectedIssues, setSelectedIssues] = useState<string[]>([]);
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Reset feedback on new generation
  useEffect(() => {
    setFeedbackRating(null);
    setFeedbackSubmitted(false);
    setShowPopover(false);
    setSelectedIssues([]);
    setIsSubmittingFeedback(false);
  }, [generationKey]);

  // ⌘K shortcut to feedback page
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        navigate('/feedback');
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [navigate]);

  // Close popover on outside click
  useEffect(() => {
    if (!showPopover) return;
    const handler = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setShowPopover(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showPopover]);

  const submitFeedback = async (rating: string, issues: string[] = []) => {
    if (!user || !projectId) return;
    setIsSubmittingFeedback(true);
    try {
      await supabase.functions.invoke('submit-feedback', {
        body: {
          project_id: projectId,
          rating: rating === 'up' ? 5 : 1,
          issues,
          format: format || 'one-pager',
          output_json: generatedOutput || null,
        },
      });
    } catch {
      // Non-critical
    } finally {
      setIsSubmittingFeedback(false);
      setFeedbackSubmitted(true);
    }
  };

  const handleThumbsUp = () => {
    if (feedbackSubmitted || isSubmittingFeedback) return;
    setFeedbackRating('up');
    setShowPopover(false);
    submitFeedback('up');
  };

  const handleThumbsDown = () => {
    if (feedbackSubmitted || isSubmittingFeedback) return;
    setFeedbackRating('down');
    setShowPopover(true);
  };

  const toggleIssue = (value: string) => {
    setSelectedIssues(prev =>
      prev.includes(value) ? prev.filter(i => i !== value) : [...prev, value]
    );
  };

  const handleSubmitIssues = () => {
    submitFeedback('down', selectedIssues);
    setShowPopover(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && !isRefining) {
      onRefine(inputValue.trim());
      setInputValue('');
    }
  };

  const handleChipClick = (chip: string) => {
    if (!isRefining) {
      onRefine(chip);
    }
  };

  const feedbackLink = (
    <button
      type="button"
      onClick={() => navigate('/feedback')}
      className="flex-shrink-0 px-3 py-2 rounded-full text-[11px] text-muted-foreground/40 hover:text-muted-foreground/60 transition-colors"
    >
      Feedback
    </button>
  );

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-40"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="h-6 bg-gradient-to-t from-background/95 to-transparent pointer-events-none" />
      <div className="bg-background/95 backdrop-blur-xl border-t border-border">
        <div className="max-w-5xl mx-auto px-3 sm:px-4 py-3 sm:py-3.5">

          {/* DESKTOP: single row */}
          <form onSubmit={handleSubmit} className="hidden sm:flex items-center gap-2">
            {/* Undo */}
            {showUndo && onUndo && (
              <button
                type="button"
                onClick={onUndo}
                className="flex-shrink-0 flex items-center gap-1 px-3 py-2 rounded-full text-xs font-medium transition-all"
                style={{
                  backgroundColor: 'rgba(239,68,68,0.15)',
                  border: '1px solid rgba(239,68,68,0.3)',
                  color: 'rgba(239,68,68,0.6)',
                }}
              >
                <Undo2 className="w-3 h-3" />
                Undo
              </button>
            )}

            {/* Chips */}
            {quickChips.map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => handleChipClick(chip)}
                disabled={isRefining}
                className={`flex-shrink-0 px-3.5 py-2 bg-card border border-border rounded-full text-xs transition-colors ${
                  isRefining ? 'opacity-40 pointer-events-none' : 'hover:bg-accent/10'
                }`}
              >
                {chip}
              </button>
            ))}

            {onOpenOptions && (
              <button
                type="button"
                onClick={onOpenOptions}
                disabled={isRefining}
                className={`flex-shrink-0 flex items-center gap-1.5 px-3.5 py-2 bg-card border border-border rounded-full text-xs transition-colors ${
                  isRefining ? 'opacity-40 pointer-events-none' : 'hover:bg-accent/10'
                }`}
              >
                <Settings className="w-3.5 h-3.5" />
                More
              </button>
            )}

            {/* Text field — fills remaining space */}
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Tell me what to change..."
              disabled={isRefining}
              className="flex-1 min-w-0 bg-card border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary/50 transition-colors disabled:opacity-50"
            />

            {/* Refine button */}
            <button
              type="submit"
              disabled={!inputValue.trim() || isRefining}
              className={`flex-shrink-0 px-4 py-2.5 rounded-lg text-xs font-medium transition-opacity text-background ${
                isRefining ? 'opacity-40 pointer-events-none' : 'hover:opacity-90 disabled:opacity-50'
              }`}
              style={{ background: 'linear-gradient(135deg, #ffb380, #ff8f5a)' }}
            >
              {isRefining ? 'Refining...' : 'Refine'}
            </button>

            {/* Thumbs */}
            {thumbsMarkup}
          </form>

          {/* MOBILE: two rows */}
          <div className="sm:hidden space-y-2.5">
            {/* Row 1: scrollable chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
              {showUndo && onUndo && (
                <button
                  onClick={onUndo}
                  className="flex-shrink-0 flex items-center gap-1 px-3 py-2 min-h-[40px] rounded-full text-[11px] font-medium"
                  style={{
                    backgroundColor: 'rgba(239,68,68,0.15)',
                    border: '1px solid rgba(239,68,68,0.3)',
                    color: 'rgba(239,68,68,0.6)',
                  }}
                >
                  <Undo2 className="w-3 h-3" />
                  Undo
                </button>
              )}
              {quickChips.map((chip) => (
                <button
                  key={chip}
                  onClick={() => handleChipClick(chip)}
                  disabled={isRefining}
                  className={`flex-shrink-0 px-3 py-2 min-h-[40px] bg-card border border-border rounded-full text-[11px] transition-colors ${
                    isRefining ? 'opacity-40 pointer-events-none' : 'hover:bg-accent/10'
                  }`}
                >
                  {chip}
                </button>
              ))}
              {onOpenOptions && (
                <button
                  onClick={onOpenOptions}
                  disabled={isRefining}
                  className={`flex-shrink-0 flex items-center gap-1 px-3 py-2 min-h-[40px] bg-card border border-border rounded-full text-[11px] transition-colors ${
                    isRefining ? 'opacity-40 pointer-events-none' : 'hover:bg-accent/10'
                  }`}
                >
                  <Settings className="w-3.5 h-3.5" />
                  More
                </button>
              )}
            </div>

            {/* Row 2: input + refine + thumbs */}
            <form onSubmit={handleSubmit} className="flex items-center gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Tell me what to change..."
                disabled={isRefining}
                className="flex-1 min-w-0 bg-card border border-border rounded-xl px-3 py-2.5 min-h-[44px] text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary/50 transition-colors disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!inputValue.trim() || isRefining}
                className={`flex-shrink-0 px-3 py-2.5 min-h-[44px] rounded-lg text-xs font-medium transition-opacity text-background ${
                  isRefining ? 'opacity-40 pointer-events-none' : 'hover:opacity-90 disabled:opacity-50'
                }`}
                style={{ background: 'linear-gradient(135deg, #ffb380, #ff8f5a)' }}
              >
                {isRefining ? '...' : 'Refine'}
              </button>
              {thumbsMarkup}
            </form>
          </div>

        </div>
      </div>
    </div>
  );
};

export default RefinementBar;
