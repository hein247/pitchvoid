import { useState } from 'react';
import { ThumbsUp, ThumbsDown, X, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

const ISSUE_OPTIONS = [
  'Too formal',
  'Too vague',
  'Wrong tone',
  'Missing key point',
  'Too long',
] as const;

interface FeedbackBarProps {
  projectId: string;
  generatedOutput?: Record<string, unknown>;
}

const FeedbackBar = ({ projectId, generatedOutput }: FeedbackBarProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [rating, setRating] = useState<'up' | 'down' | null>(null);
  const [selectedIssues, setSelectedIssues] = useState<string[]>([]);
  const [showIssues, setShowIssues] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitFeedback = async (finalRating: 'up' | 'down', issues: string[] = []) => {
    if (!user) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('ai_feedback' as any).insert({
        project_id: projectId,
        user_id: user.id,
        rating: finalRating,
        issues,
        generated_output: generatedOutput || null,
      });
      if (error) throw error;
      setSubmitted(true);
      toast({ title: 'Thanks for the feedback!' });
    } catch {
      toast({ title: 'Could not save feedback', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleThumbsUp = () => {
    setRating('up');
    setShowIssues(false);
    submitFeedback('up');
  };

  const handleThumbsDown = () => {
    setRating('down');
    setShowIssues(true);
  };

  const toggleIssue = (issue: string) => {
    setSelectedIssues(prev =>
      prev.includes(issue) ? prev.filter(i => i !== issue) : [...prev, issue]
    );
  };

  const handleSubmitIssues = () => {
    submitFeedback('down', selectedIssues);
    setShowIssues(false);
  };

  if (submitted) {
    return (
      <div className="flex items-center gap-2 py-3 px-4 rounded-xl border border-border bg-card animate-fadeIn">
        <Check className="w-4 h-4 text-green-400" />
        <span className="text-sm text-muted-foreground">Feedback received — thanks!</span>
      </div>
    );
  }

  return (
    <div className="space-y-3 animate-fadeIn">
      {/* Rating buttons */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground">How was this output?</span>
        <button
          onClick={handleThumbsUp}
          disabled={isSubmitting}
          className={`p-2 rounded-lg border transition-all ${
            rating === 'up'
              ? 'border-green-500/40 bg-green-500/10 text-green-400'
              : 'border-border hover:border-green-500/30 hover:bg-green-500/5 text-muted-foreground hover:text-green-400'
          }`}
        >
          <ThumbsUp className="w-4 h-4" />
        </button>
        <button
          onClick={handleThumbsDown}
          disabled={isSubmitting}
          className={`p-2 rounded-lg border transition-all ${
            rating === 'down'
              ? 'border-red-500/40 bg-red-500/10 text-red-400'
              : 'border-border hover:border-red-500/30 hover:bg-red-500/5 text-muted-foreground hover:text-red-400'
          }`}
        >
          <ThumbsDown className="w-4 h-4" />
        </button>
      </div>

      {/* Issue selector */}
      {showIssues && (
        <div className="p-4 rounded-xl border border-border bg-card space-y-3 animate-slideUp">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">What could be better?</span>
            <button onClick={() => { setShowIssues(false); setRating(null); }} className="text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {ISSUE_OPTIONS.map((issue) => (
              <button
                key={issue}
                onClick={() => toggleIssue(issue)}
                className={`px-3 py-1.5 rounded-lg text-sm border transition-all ${
                  selectedIssues.includes(issue)
                    ? 'border-primary/40 bg-primary/10 text-primary'
                    : 'border-border text-muted-foreground hover:border-primary/20 hover:text-foreground'
                }`}
              >
                {issue}
              </button>
            ))}
          </div>
          <button
            onClick={handleSubmitIssues}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            Submit feedback
          </button>
        </div>
      )}
    </div>
  );
};

export default FeedbackBar;
