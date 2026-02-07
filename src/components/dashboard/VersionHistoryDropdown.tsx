import { useState, useEffect } from 'react';
import { History, ChevronDown, Check } from 'lucide-react';
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
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <button
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-accent/10 transition-colors border border-border/50"
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
  );
};

export default VersionHistoryDropdown;
