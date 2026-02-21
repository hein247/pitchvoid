import { useState } from 'react';
import { MoreVertical, Share2, Download, Play, Copy, History, Lock, ThumbsUp, ThumbsDown, Check, Edit2, FileText, ScrollText, RefreshCw } from 'lucide-react';
import { VersionHistorySheet } from './VersionHistoryDropdown';
import { MobileFeedbackSheet } from './TopBarFeedback';
import type { ProjectVersion, ProjectRecord } from '@/hooks/useProjects';

type OutputFormat = 'one-pager' | 'script';

interface MobileOverflowMenuProps {
  onShare: () => void;
  onExport: () => void;
  onEdit?: () => void;
  onPractice?: () => void;
  onCopyAll: () => void;
  onVersionHistory: () => void;
  isFree: boolean;
  activeProject: ProjectRecord | null;
  activeVersionId?: string;
  fetchVersions: (projectId: string) => Promise<ProjectVersion[]>;
  onSelectVersion: (version: ProjectVersion) => void;
  // Feedback props
  feedbackProjectId?: string;
  feedbackFormat?: 'one-pager' | 'script';
  feedbackOutput?: Record<string, unknown>;
  feedbackKey?: number;
  onThumbsUp?: () => void;
  feedbackSubmitted?: boolean;
  // Format toggle props
  activeFormat: OutputFormat;
  onFormatChange: (format: OutputFormat) => void;
  hasOnePager: boolean;
  hasScript: boolean;
  onRegenerate: (format: OutputFormat) => void;
  isRegenerating?: boolean;
  lockedFormats?: OutputFormat[];
  onLockedClick?: (format: OutputFormat) => void;
}

const MobileOverflowMenu = ({
  onShare,
  onExport,
  onEdit,
  onPractice,
  onCopyAll,
  isFree,
  activeProject,
  activeVersionId,
  fetchVersions,
  onSelectVersion,
  feedbackProjectId,
  feedbackFormat,
  feedbackOutput,
  feedbackSubmitted = false,
  onThumbsUp,
  activeFormat,
  onFormatChange,
  hasOnePager,
  hasScript,
  onRegenerate,
  isRegenerating = false,
  lockedFormats = [],
  onLockedClick,
}: MobileOverflowMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showVersionSheet, setShowVersionSheet] = useState(false);
  const [showFeedbackSheet, setShowFeedbackSheet] = useState(false);
  const [showCheck, setShowCheck] = useState(false);

  const formats: { id: OutputFormat; label: string; icon: typeof FileText; hasContent: boolean }[] = [
    { id: 'one-pager', label: 'One-Pager', icon: FileText, hasContent: hasOnePager },
    { id: 'script', label: 'Script', icon: ScrollText, hasContent: hasScript },
  ];

  const handleFormatClick = (id: OutputFormat, hasContent: boolean) => {
    if (isRegenerating) return;
    if (lockedFormats.includes(id)) {
      setIsOpen(false);
      onLockedClick?.(id);
      return;
    }
    if (hasContent) {
      onFormatChange(id);
    } else {
      onRegenerate(id);
    }
    setIsOpen(false);
  };

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
            className="relative w-full rounded-t-2xl border-t p-4 animate-slideUp"
            onClick={e => e.stopPropagation()}
            style={{
              paddingBottom: 'env(safe-area-inset-bottom, 16px)',
              background: 'rgba(14,12,24,0.95)',
              backdropFilter: 'blur(16px)',
              borderColor: 'rgba(168,85,247,0.1)',
            }}
          >
            {/* Drag handle */}
            <div className="w-10 h-1 rounded-full bg-border mx-auto mb-4" />

            <div className="space-y-1">
              {/* Format toggle */}
              <div className="flex gap-2 mb-2">
                {formats.map(({ id, label, icon: Icon, hasContent }) => {
                  const isLocked = lockedFormats.includes(id);
                  const isActive = activeFormat === id;
                  return (
                    <button
                      key={id}
                      onClick={() => handleFormatClick(id, hasContent)}
                      disabled={isRegenerating}
                      className={`flex-1 flex items-center justify-center gap-2 px-4 rounded-xl transition-all min-h-[48px] relative ${
                        isActive
                          ? 'bg-primary text-primary-foreground'
                          : isLocked
                          ? 'text-muted-foreground/50 border border-border'
                          : 'text-foreground border border-border hover:bg-accent/5'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-sm">{label}</span>
                      {isLocked && <Lock className="w-3 h-3 ml-1" />}
                      {!hasContent && !isLocked && (
                        <RefreshCw className={`w-3 h-3 ml-1 ${isRegenerating ? 'animate-spin' : ''}`} />
                      )}
                      {isLocked && (
                        <span className="absolute -top-1 -right-1 text-[8px] font-bold px-1 py-0.5 rounded bg-primary text-primary-foreground">
                          PRO
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="border-t border-border/50 my-2" />

              {/* Edit */}
              {onEdit && (
                <button
                  onClick={() => { setIsOpen(false); onEdit(); }}
                  className="w-full flex items-center gap-3 px-4 rounded-xl hover:bg-accent/5 transition-colors min-h-[48px]"
                >
                  <Edit2 className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-foreground">Edit</span>
                </button>
              )}

              <button
                onClick={() => { setIsOpen(false); onExport(); }}
                className="w-full flex items-center gap-3 px-4 rounded-xl hover:bg-accent/5 transition-colors min-h-[48px]"
              >
                <Download className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-foreground">Download PDF</span>
                {isFree && <Lock className="w-3 h-3 text-muted-foreground ml-auto" />}
              </button>

              <button
                onClick={() => { setIsOpen(false); onShare(); }}
                className="w-full flex items-center gap-3 px-4 rounded-xl hover:bg-accent/5 transition-colors min-h-[48px]"
              >
                <Share2 className="w-4 h-4 text-primary" />
                <span className="text-sm text-foreground">Share</span>
              </button>

              <button
                onClick={() => { setIsOpen(false); onCopyAll(); }}
                className="w-full flex items-center gap-3 px-4 rounded-xl hover:bg-accent/5 transition-colors min-h-[48px]"
              >
                <Copy className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-foreground">Copy all</span>
              </button>

              {onPractice && (
                <button
                  onClick={() => { setIsOpen(false); onPractice(); }}
                  className="w-full flex items-center gap-3 px-4 rounded-xl hover:bg-accent/5 transition-colors min-h-[48px]"
                >
                  <Play className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-foreground">Practice</span>
                </button>
              )}

              {activeProject && (
                <button
                  onClick={() => { setIsOpen(false); setShowVersionSheet(true); }}
                  className="w-full flex items-center gap-3 px-4 rounded-xl hover:bg-accent/5 transition-colors min-h-[48px]"
                >
                  <History className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-foreground">Versions</span>
                </button>
              )}

              {/* Feedback buttons */}
              {feedbackProjectId && (
                <>
                  <div className="border-t border-border/50 mt-2 pt-2">
                    <button
                      onClick={() => {
                        setIsOpen(false);
                        if (!feedbackSubmitted) {
                          onThumbsUp?.();
                          setShowCheck(true);
                          setTimeout(() => setShowCheck(false), 800);
                        }
                      }}
                      disabled={feedbackSubmitted}
                      className={`w-full flex items-center gap-3 px-4 rounded-xl transition-colors min-h-[48px] ${
                        feedbackSubmitted ? 'opacity-30' : 'hover:bg-accent/5'
                      }`}
                    >
                      {showCheck ? (
                        <Check className="w-4 h-4 text-green-400" />
                      ) : (
                        <ThumbsUp className="w-4 h-4 text-muted-foreground" />
                      )}
                      <span className="text-sm text-foreground">Good output</span>
                    </button>
                    <button
                      onClick={() => {
                        setIsOpen(false);
                        if (!feedbackSubmitted) setShowFeedbackSheet(true);
                      }}
                      disabled={feedbackSubmitted}
                      className={`w-full flex items-center gap-3 px-4 rounded-xl transition-colors min-h-[48px] ${
                        feedbackSubmitted ? 'opacity-30' : 'hover:bg-accent/5'
                      }`}
                    >
                      <ThumbsDown className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-foreground">Needs improvement</span>
                    </button>
                  </div>
                </>
              )}

              <div className="border-t border-border/50 mt-2 pt-2">
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-full flex items-center justify-center px-4 rounded-xl text-muted-foreground hover:bg-accent/5 transition-colors min-h-[48px]"
                >
                  <span className="text-sm">Cancel</span>
                </button>
              </div>
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

      {/* Mobile Feedback Bottom Sheet */}
      {feedbackProjectId && feedbackFormat && (
        <MobileFeedbackSheet
          isOpen={showFeedbackSheet}
          onClose={() => setShowFeedbackSheet(false)}
          projectId={feedbackProjectId}
          format={feedbackFormat}
          generatedOutput={feedbackOutput}
        />
      )}
    </div>
  );
};

export default MobileOverflowMenu;
