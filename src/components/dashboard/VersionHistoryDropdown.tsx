import { useState, useEffect } from 'react';
import { History, ChevronDown, Check, Download, Share2, Play, Copy, Lock, X } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { ProjectVersion } from '@/hooks/useProjects';

interface VersionHistoryDropdownProps {
  projectId: string;
  currentVersionId?: string;
  fetchVersions: (projectId: string) => Promise<ProjectVersion[]>;
  onSelectVersion: (version: ProjectVersion) => void;
}

const VersionHistoryDropdown = ({
  projectId,
  currentVersionId,
  fetchVersions,
  onSelectVersion,
}: VersionHistoryDropdownProps) => {
  const [versions, setVersions] = useState<ProjectVersion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (isOpen && versions.length === 0) {
      loadVersions();
    }
  }, [isOpen]);

  const loadVersions = async () => {
    setIsLoading(true);
    const data = await fetchVersions(projectId);
    setVersions(data);
    setIsLoading(false);
  };

  if (!projectId) return null;

  return (
    <>
      {/* Desktop: dropdown */}
      <div className="hidden sm:block">
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
          <DropdownMenuTrigger asChild>
            <button
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-accent/10 transition-colors border border-border/50 min-h-[44px]"
              title="Version History"
            >
              <History className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Versions</span>
              <ChevronDown className="w-3 h-3" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            {isLoading ? (
              <div className="px-3 py-4 text-center text-xs text-muted-foreground">Loading...</div>
            ) : versions.length === 0 ? (
              <div className="px-3 py-4 text-center text-xs text-muted-foreground">No versions yet</div>
            ) : (
              versions.map((version) => {
                const isCurrent = version.id === currentVersionId;
                const date = new Date(version.created_at);
                const formatLabel = version.output_format === 'one-pager' ? 'One-Pager' : 'Script';

                return (
                  <DropdownMenuItem
                    key={version.id}
                    onClick={() => onSelectVersion(version)}
                    className="flex items-center justify-between gap-2"
                  >
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-medium truncate">
                        v{version.version_number} — {formatLabel}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {date.toLocaleDateString()} {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    {isCurrent && <Check className="w-4 h-4 text-primary flex-shrink-0" />}
                  </DropdownMenuItem>
                );
              })
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Mobile: rendered as bottom sheet via MobileOverflowMenu */}
    </>
  );
};

export default VersionHistoryDropdown;

/** Mobile bottom sheet for version history */
export const VersionHistorySheet = ({
  isOpen,
  onClose,
  projectId,
  currentVersionId,
  fetchVersions,
  onSelectVersion,
}: VersionHistoryDropdownProps & { isOpen: boolean; onClose: () => void }) => {
  const [versions, setVersions] = useState<ProjectVersion[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && versions.length === 0 && projectId) {
      setIsLoading(true);
      fetchVersions(projectId).then(data => {
        setVersions(data);
        setIsLoading(false);
      });
    }
  }, [isOpen, projectId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50" />
      <div
        className="relative w-full max-h-[60vh] overflow-y-auto rounded-t-2xl border-t border-border bg-background p-4 animate-slideUp"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-foreground font-display">Version History</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground min-h-[44px] min-w-[44px] flex items-center justify-center">
            <X className="w-5 h-5" />
          </button>
        </div>
        {isLoading ? (
          <p className="text-center text-xs text-muted-foreground py-6">Loading...</p>
        ) : versions.length === 0 ? (
          <p className="text-center text-xs text-muted-foreground py-6">No versions yet</p>
        ) : (
          <div className="space-y-2">
            {versions.map((version) => {
              const isCurrent = version.id === currentVersionId;
              const date = new Date(version.created_at);
              const formatLabel = version.output_format === 'one-pager' ? 'One-Pager' : 'Script';

              return (
                <button
                  key={version.id}
                  onClick={() => { onSelectVersion(version); onClose(); }}
                  className={`w-full flex items-center justify-between p-4 rounded-xl border min-h-[52px] transition-colors ${
                    isCurrent ? 'border-primary bg-primary/5' : 'border-border hover:bg-accent/5'
                  }`}
                >
                  <div className="text-left">
                    <span className="text-sm font-medium">v{version.version_number} — {formatLabel}</span>
                    <br />
                    <span className="text-[11px] text-muted-foreground">
                      {date.toLocaleDateString()} {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  {isCurrent && <Check className="w-4 h-4 text-primary" />}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
