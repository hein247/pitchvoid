import { useState, useRef, useEffect } from 'react';
import { MoreVertical, Share2, Download, Copy, Edit2, Lock } from 'lucide-react';

interface DesktopOverflowMenuProps {
  onShare: () => void;
  onExport: () => void;
  onEdit?: () => void;
  onCopyAll: () => void;
  isFree: boolean;
}

const DesktopOverflowMenu = ({
  onShare,
  onExport,
  onEdit,
  onCopyAll,
  isFree,
}: DesktopOverflowMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent/10 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
        title="More actions"
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-48 rounded-xl border border-border bg-card shadow-xl z-[100] py-1 animate-in fade-in slide-in-from-top-2 duration-200">
          {onEdit && (
            <MenuItem icon={<Edit2 className="w-4 h-4" />} label="Edit" onClick={() => { setIsOpen(false); onEdit(); }} />
          )}
          <MenuItem
            icon={<Download className="w-4 h-4" />}
            label="Download PDF"
            onClick={() => { setIsOpen(false); onExport(); }}
            trailing={isFree ? <Lock className="w-3 h-3 text-muted-foreground/50" /> : undefined}
          />
          <MenuItem icon={<Share2 className="w-4 h-4" />} label="Share" onClick={() => { setIsOpen(false); onShare(); }} />
          <MenuItem icon={<Copy className="w-4 h-4" />} label="Copy all" onClick={() => { setIsOpen(false); onCopyAll(); }} />
        </div>
      )}
    </div>
  );
};

const MenuItem = ({ icon, label, onClick, trailing }: { icon: React.ReactNode; label: string; onClick: () => void; trailing?: React.ReactNode }) => (
  <button
    onClick={onClick}
    className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-foreground/80 hover:bg-accent/10 transition-colors"
  >
    <span className="text-muted-foreground">{icon}</span>
    <span className="flex-1 text-left">{label}</span>
    {trailing}
  </button>
);

export default DesktopOverflowMenu;
