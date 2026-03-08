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

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-40"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      {/* Spacer gradient for visual separation */}
      <div className="h-8 bg-gradient-to-t from-background/95 to-transparent pointer-events-none" />
      <div className="bg-background/95 backdrop-blur-xl border-t border-border">
      <div className="max-w-5xl mx-auto px-3 sm:px-4 pt-5 sm:pt-6 pb-4 sm:pb-5">
        {/* Label */}
        <div className="flex items-center justify-between mb-2 sm:mb-2.5">
          <p className="text-[10px] sm:text-xs text-muted-foreground font-medium">Refine your pitch</p>
          <button
            onClick={() => navigate('/feedback')}
            className="hidden sm:flex items-center gap-1 text-[10px] text-foreground/60 hover:text-primary/60 transition-colors"
          >
            <span>Feedback</span>
            <kbd className="px-1.5 py-0.5 rounded border border-foreground/20 bg-foreground/5 text-[9px] font-mono text-foreground/60">⌘K</kbd>
          </button>
        </div>

        {/* Quick Edit Chips */}
        <div className="flex items-center gap-1.5 sm:gap-2 mb-3 sm:mb-4 overflow-x-auto pb-1.5 sm:pb-2 scrollbar-hide">
          {/* Undo button */}
          {showUndo && onUndo && (
            <button
              onClick={onUndo}
              className="flex-shrink-0 flex items-center gap-1 sm:gap-1.5 px-3 sm:px-4 py-2 sm:py-2 min-h-[44px] sm:min-h-0 rounded-full text-[10px] sm:text-sm font-medium transition-all duration-300 animate-in fade-in"
              style={{
                backgroundColor: 'rgba(239,68,68,0.15)',
                border: '1px solid rgba(239,68,68,0.3)',
                color: 'rgba(239,68,68,0.6)',
              }}
            >
              <Undo2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span>Undo</span>
            </button>
          )}

          {quickChips.map((chip) => (
            <button
              key={chip}
              onClick={() => handleChipClick(chip)}
              disabled={isRefining}
              className={`flex-shrink-0 px-3 sm:px-4 py-1.5 sm:py-2 min-h-[44px] sm:min-h-0 bg-card border border-border rounded-full text-[10px] sm:text-sm transition-colors ${
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
              className={`flex-shrink-0 flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 min-h-[44px] sm:min-h-0 bg-card border border-border rounded-full text-[10px] sm:text-sm transition-colors ${
                isRefining ? 'opacity-40 pointer-events-none' : 'hover:bg-accent/10'
              }`}
            >
              <Settings className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>More</span>
            </button>
          )}
        </div>

        {/* Chat Input + Feedback Thumbs */}
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Tell me what to change..."
            disabled={isRefining}
            className="flex-1 min-w-0 bg-card border border-border rounded-xl px-3 sm:px-4 py-3 min-h-[44px] text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary/50 transition-colors disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || isRefining}
            className={`flex-shrink-0 px-3 sm:px-4 py-2.5 min-h-[44px] rounded-lg text-xs sm:text-sm font-medium transition-opacity text-background ${
              isRefining ? 'opacity-40 pointer-events-none' : 'hover:opacity-90 disabled:opacity-50'
            }`}
            style={{ background: 'linear-gradient(135deg, #ffb380, #ff8f5a)' }}
          >
            {isRefining ? 'Refining...' : 'Refine'}
          </button>

          {/* Feedback thumbs */}
          {projectId && (
            <div className="relative flex items-center gap-0 flex-shrink-0" ref={popoverRef}>
              <button
                type="button"
                onClick={handleThumbsUp}
                disabled={feedbackSubmitted}
                className="p-1.5 rounded-lg transition-colors"
                title="Good output"
              >
                <ThumbsUp
                  className="w-[18px] h-[18px] transition-colors"
                  style={{
                    color: feedbackRating === 'up'
                      ? 'rgba(74,222,128,0.7)'
                      : feedbackSubmitted
                        ? 'rgba(240,237,246,0.12)'
                        : 'rgba(240,237,246,0.25)',
                  }}
                />
              </button>
              <button
                type="button"
                onClick={handleThumbsDown}
                disabled={feedbackSubmitted}
                className="p-1.5 rounded-lg transition-colors"
                title="Needs improvement"
              >
                <ThumbsDown
                  className="w-[18px] h-[18px] transition-colors"
                  style={{
                    color: feedbackRating === 'down'
                      ? 'rgba(248,113,113,0.7)'
                      : feedbackSubmitted
                        ? 'rgba(240,237,246,0.12)'
                        : 'rgba(240,237,246,0.25)',
                  }}
                />
              </button>

              {/* Thumbs-down popover */}
              {showPopover && (
                <div className="absolute bottom-full right-0 mb-2 w-56 rounded-xl border border-border bg-card shadow-xl z-50 p-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
                  <p className="text-xs text-muted-foreground mb-2 font-medium">What went wrong?</p>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {ISSUE_CHIPS.map((chip) => (
                      <button
                        key={chip.value}
                        type="button"
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
                      type="button"
                      onClick={handleSubmitIssues}
                      disabled={isSubmittingFeedback}
                      className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium bg-primary/10 text-primary hover:bg-primary/15 transition-all disabled:opacity-50"
                    >
                      <Send className="w-3 h-3" />
                      Send
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </form>
      </div>
      </div>
    </div>
  );
};

export default RefinementBar;
