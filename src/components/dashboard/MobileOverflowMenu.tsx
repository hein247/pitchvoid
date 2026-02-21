import { useState } from 'react';
import { MoreVertical, Share2, Download, Play, Copy, History, Lock, X } from 'lucide-react';
import { VersionHistorySheet } from './VersionHistoryDropdown';
import type { ProjectVersion, ProjectRecord } from '@/hooks/useProjects';

interface MobileOverflowMenuProps {
  onShare: () => void;
  onExport: () => void;
  onPractice?: () => void;
  onCopyAll: () => void;
  onVersionHistory: () => void;
  isFree: boolean;
  activeProject: ProjectRecord | null;
  activeVersionId?: string;
  fetchVersions: (projectId: string) => Promise<ProjectVersion[]>;
  onSelectVersion: (version: ProjectVersion) => void;
}

const MobileOverflowMenu = ({
  onShare,
  onExport,
  onPractice,
  onCopyAll,
  isFree,
  activeProject,
  activeVersionId,
  fetchVersions,
  onSelectVersion,
}: MobileOverflowMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showVersionSheet, setShowVersionSheet] = useState(false);

  return (
    <div className="sm:hidden">
      <button
        onClick={() => setIsOpen(true)}
        className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent/10 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {/* Bottom sheet overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={() => setIsOpen(false)}>
          <div className="absolute inset-0 bg-black/50" />
          <div
            className="relative w-full rounded-t-2xl border-t border-border bg-background p-4 animate-slideUp"
            onClick={e => e.stopPropagation()}
            style={{ paddingBottom: 'env(safe-area-inset-bottom, 16px)' }}
          >
            {/* Drag handle */}
            <div className="w-10 h-1 rounded-full bg-border mx-auto mb-4" />

            <div className="space-y-1">
              <button
                onClick={() => { setIsOpen(false); onShare(); }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-accent/5 transition-colors min-h-[52px]"
              >
                <Share2 className="w-4 h-4 text-primary" />
                <span className="text-sm text-foreground">Share</span>
              </button>

              <button
                onClick={() => { setIsOpen(false); onExport(); }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-accent/5 transition-colors min-h-[52px]"
              >
                <Download className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-foreground">Download PDF</span>
                {isFree && <Lock className="w-3 h-3 text-muted-foreground ml-auto" />}
              </button>

              <button
                onClick={() => { setIsOpen(false); onCopyAll(); }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-accent/5 transition-colors min-h-[52px]"
              >
                <Copy className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-foreground">Copy all</span>
              </button>

              {onPractice && (
                <button
                  onClick={() => { setIsOpen(false); onPractice(); }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-accent/5 transition-colors min-h-[52px]"
                >
                  <Play className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-foreground">Practice</span>
                </button>
              )}

              {activeProject && (
                <button
                  onClick={() => { setIsOpen(false); setShowVersionSheet(true); }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-accent/5 transition-colors min-h-[52px]"
                >
                  <History className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-foreground">Versions</span>
                </button>
              )}

              <button
                onClick={() => setIsOpen(false)}
                className="w-full flex items-center justify-center px-4 py-3 rounded-xl text-muted-foreground hover:bg-accent/5 transition-colors min-h-[52px] mt-2 border-t border-border pt-4"
              >
                <span className="text-sm">Cancel</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Version History Bottom Sheet */}
      {activeProject && (
        <VersionHistorySheet
          isOpen={showVersionSheet}
          onClose={() => setShowVersionSheet(false)}
          projectId={activeProject.id}
          currentVersionId={activeVersionId}
          fetchVersions={fetchVersions}
          onSelectVersion={onSelectVersion}
        />
      )}
    </div>
  );
};

export default MobileOverflowMenu;
