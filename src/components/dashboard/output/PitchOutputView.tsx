import { useState } from 'react';
import { ArrowLeft, Play, Share2, Lock, FileText, ScrollText, Download } from 'lucide-react';
import FeedbackBar from './FeedbackBar';
import OutputOnePagerView, { OutputOnePagerData } from './OutputOnePagerView';
import OutputScriptView, { OutputScriptData } from './OutputScriptView';
import RefinementBar from './RefinementBar';
import OptionsModal from './OptionsModal';
import { usePricing } from '@/hooks/usePricing';

type OutputFormat = 'onepager' | 'script';

interface PitchOutputViewProps {
  title: string;
  subtitle?: string;
  projectId?: string;
  onePager?: OutputOnePagerData;
  script?: OutputScriptData;
  onBack?: () => void;
  onShare?: () => void;
  onPractice?: () => void;
  onRefine?: (prompt: string) => void;
  isRefining?: boolean;
  defaultFormat?: OutputFormat;
  hasOnePager?: boolean;
  hasScript?: boolean;
  onGenerateFormat?: (format: OutputFormat) => void;
}

const PitchOutputView = ({
  title,
  subtitle,
  projectId,
  onePager,
  script,
  onBack,
  onShare,
  onPractice,
  onRefine,
  isRefining = false,
  defaultFormat = 'onepager',
  hasOnePager = false,
  hasScript = false,
  onGenerateFormat,
}: PitchOutputViewProps) => {
  const [format, setFormat] = useState<OutputFormat>(defaultFormat);
  const [showOptions, setShowOptions] = useState(false);
  const { canPerformAction, isPro } = usePricing();

  // Check if user can use these formats
  const canUseOnePager = canPerformAction('use_format', { format: 'one-pager' }).allowed;
  const canUseScript = canPerformAction('use_format', { format: 'script' }).allowed;

  const formats: { id: OutputFormat; label: string; icon: typeof FileText; hasContent: boolean; locked: boolean }[] = [
    { id: 'onepager', label: 'One-Pager', icon: FileText, hasContent: hasOnePager, locked: !canUseOnePager },
    { id: 'script', label: 'Script', icon: ScrollText, hasContent: hasScript, locked: !canUseScript },
  ];

  const handleFormatClick = (formatId: OutputFormat) => {
    const formatConfig = formats.find(f => f.id === formatId);
    if (!formatConfig) return;

    if (formatConfig.locked) {
      return;
    }

    if (formatConfig.hasContent) {
      setFormat(formatId);
    } else {
      onGenerateFormat?.(formatId);
      setFormat(formatId);
    }
  };

  const handleRefine = (prompt: string) => {
    onRefine?.(prompt);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {onBack && (
              <button
                onClick={onBack}
                className="p-2 hover:bg-accent/10 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div>
              <h1 className="font-semibold text-lg font-display">{title}</h1>
              {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (!isPro) return;
                window.print();
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all ${
                isPro
                  ? 'border-primary/30 hover:bg-primary/10'
                  : 'border-border text-muted-foreground cursor-not-allowed'
              }`}
              title={isPro ? 'Download as PDF' : 'Upgrade to Pro to export'}
            >
              <Download className="w-4 h-4" />
              <span>PDF</span>
              {!isPro && <Lock className="w-3 h-3" />}
            </button>

            <button
              onClick={onPractice}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all ${
                isPro
                  ? 'border-primary/30 hover:bg-primary/10'
                  : 'border-border text-muted-foreground cursor-not-allowed'
              }`}
            >
              <Play className="w-4 h-4" />
              <span>Practice</span>
              {!isPro && <Lock className="w-3 h-3" />}
            </button>

            <button
              onClick={onShare}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary to-accent rounded-xl font-medium hover:opacity-90 transition-opacity text-primary-foreground"
            >
              <Share2 className="w-4 h-4" />
              <span>Share</span>
            </button>
          </div>
        </div>
      </header>

      {/* Format Tabs */}
      <div className="max-w-5xl mx-auto px-4 py-4">
        <div className="inline-flex bg-card rounded-xl p-1 border border-border">
          {formats.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleFormatClick(tab.id)}
              className={`relative px-5 py-2.5 rounded-lg font-medium transition-all font-sans ${
                format === tab.id
                  ? 'bg-gradient-to-r from-primary to-accent text-primary-foreground'
                  : tab.locked
                    ? 'text-muted-foreground/50 cursor-not-allowed'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent/5'
              }`}
            >
              <span className="flex items-center gap-2">
                <tab.icon className="w-4 h-4" />
                {tab.label}
                {tab.locked && <Lock className="w-3 h-3" />}
              </span>
              {tab.locked && (
                <span className="absolute -top-1 -right-1 text-[8px] font-bold px-1.5 py-0.5 rounded bg-primary text-primary-foreground">
                  PRO
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <main className="max-w-5xl mx-auto px-4 pb-[240px]">
        {format === 'onepager' && onePager && (
          <OutputOnePagerView data={onePager} />
        )}
        {format === 'script' && script && (
          <OutputScriptView
            data={script}
            onStartTeleprompter={onPractice}
          />
        )}

        {/* Feedback Bar - show when content is available */}
        {projectId && ((format === 'onepager' && onePager) || (format === 'script' && script)) && (
          <div className="mt-8 max-w-2xl mx-auto">
            <FeedbackBar
              projectId={projectId}
              format={format === 'onepager' ? 'one-pager' : 'script'}
              generationKey={0}
              generatedOutput={format === 'onepager' ? (onePager as unknown as Record<string, unknown>) : (script as unknown as Record<string, unknown>)}
            />
          </div>
        )}

        {/* Loading/Empty states */}
        {format === 'onepager' && !onePager && !formats.find(f => f.id === 'onepager')?.locked && (
          <div className="text-center py-20">
            <p className="text-muted-foreground mb-4">One-pager not generated yet.</p>
            <button
              onClick={() => onGenerateFormat?.('onepager')}
              className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:opacity-90 transition-opacity"
            >
              Generate One-Pager
            </button>
          </div>
        )}
        {format === 'script' && !script && !formats.find(f => f.id === 'script')?.locked && (
          <div className="text-center py-20">
            <p className="text-muted-foreground mb-4">Script not generated yet.</p>
            <button
              onClick={() => onGenerateFormat?.('script')}
              className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:opacity-90 transition-opacity"
            >
              Generate Script
            </button>
          </div>
        )}
      </main>

      {/* Bottom Refinement Bar */}
      <RefinementBar
        onRefine={handleRefine}
        onOpenOptions={() => setShowOptions(true)}
        isRefining={isRefining}
      />

      {/* Options Modal */}
      <OptionsModal
        isOpen={showOptions}
        onClose={() => setShowOptions(false)}
      />
    </div>
  );
};

export default PitchOutputView;
