import { FileText, ScrollText, RefreshCw, Lock } from 'lucide-react';

type OutputFormat = 'one-pager' | 'script';

interface FormatToggleProps {
  activeFormat: OutputFormat;
  onFormatChange: (format: OutputFormat) => void;
  hasOnePager: boolean;
  hasScript: boolean;
  onRegenerate: (format: OutputFormat) => void;
  isRegenerating?: boolean;
  lockedFormats?: OutputFormat[];
  onLockedClick?: (format: OutputFormat) => void;
}

const FormatToggle = ({
  activeFormat,
  onFormatChange,
  hasOnePager,
  hasScript,
  onRegenerate,
  isRegenerating = false,
  lockedFormats = [],
  onLockedClick,
}: FormatToggleProps) => {
  const formats: { id: OutputFormat; label: string; icon: typeof FileText; hasContent: boolean }[] = [
    { id: 'one-pager', label: 'One-Pager', icon: FileText, hasContent: hasOnePager },
    { id: 'script', label: 'Script', icon: ScrollText, hasContent: hasScript },
  ];

  const handleClick = (id: OutputFormat, hasContent: boolean) => {
    if (isRegenerating) return;
    
    // Check if format is locked
    if (lockedFormats.includes(id)) {
      onLockedClick?.(id);
      return;
    }
    
    if (hasContent) {
      // Content exists - just switch view
      onFormatChange(id);
    } else {
      // No content - trigger regeneration
      onRegenerate(id);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {/* Format tabs */}
      <div className="flex items-center rounded-lg border border-accent/20 p-1 bg-background/50 backdrop-blur-sm">
        {formats.map(({ id, label, icon: Icon, hasContent }) => {
          const isLocked = lockedFormats.includes(id);
          
          return (
            <button
              key={id}
              onClick={() => handleClick(id, hasContent)}
              disabled={isRegenerating}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all relative ${
                activeFormat === id
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : isLocked
                  ? 'text-muted-foreground/50 cursor-pointer hover:bg-accent/5'
                  : hasContent
                  ? 'text-foreground hover:bg-accent/10 cursor-pointer'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent/5'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{label}</span>
              {isLocked ? (
                <Lock className="w-3 h-3 ml-1 text-primary/70" />
              ) : !hasContent ? (
                <RefreshCw className={`w-3 h-3 ml-1 ${isRegenerating ? 'animate-spin' : ''}`} />
              ) : hasContent && activeFormat !== id ? (
                <span className="w-1.5 h-1.5 rounded-full bg-primary/70 ml-1" title="Generated" />
              ) : null}
              {isLocked && (
                <span className="absolute -top-1 -right-1 text-[8px] font-bold px-1 py-0.5 rounded bg-primary text-primary-foreground">
                  PRO
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default FormatToggle;
