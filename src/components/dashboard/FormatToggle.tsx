import { Layers, FileText, ScrollText, RefreshCw } from 'lucide-react';

type OutputFormat = 'slides' | 'one-pager' | 'script';

interface FormatToggleProps {
  activeFormat: OutputFormat;
  onFormatChange: (format: OutputFormat) => void;
  hasSlides: boolean;
  hasOnePager: boolean;
  hasScript: boolean;
  onRegenerate: (format: OutputFormat) => void;
  isRegenerating?: boolean;
}

const FormatToggle = ({
  activeFormat,
  onFormatChange,
  hasSlides,
  hasOnePager,
  hasScript,
  onRegenerate,
  isRegenerating = false,
}: FormatToggleProps) => {
  const formats: { id: OutputFormat; label: string; icon: typeof Layers; hasContent: boolean }[] = [
    { id: 'slides', label: 'Slides', icon: Layers, hasContent: hasSlides },
    { id: 'one-pager', label: 'One-Pager', icon: FileText, hasContent: hasOnePager },
    { id: 'script', label: 'Script', icon: ScrollText, hasContent: hasScript },
  ];

  return (
    <div className="flex items-center gap-2">
      {/* Format tabs */}
      <div className="flex items-center rounded-lg border border-accent/20 p-1 bg-background/50 backdrop-blur-sm">
        {formats.map(({ id, label, icon: Icon, hasContent }) => (
          <button
            key={id}
            onClick={() => hasContent ? onFormatChange(id) : onRegenerate(id)}
            disabled={isRegenerating}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all relative ${
              activeFormat === id
                ? 'bg-primary text-primary-foreground shadow-sm'
                : hasContent
                ? 'text-foreground hover:bg-accent/10'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent/5'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{label}</span>
            {!hasContent && (
              <RefreshCw className={`w-3 h-3 ml-1 ${isRegenerating ? 'animate-spin' : ''}`} />
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default FormatToggle;
