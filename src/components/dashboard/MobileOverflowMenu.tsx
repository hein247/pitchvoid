import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { MoreVertical, Share2, Download, Play, Copy, History, Lock, Edit2, FileText, ScrollText, RefreshCw } from 'lucide-react';
import { VersionHistorySheet } from './VersionHistoryDropdown';
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
  const [isAnimating, setIsAnimating] = useState(false);
  const [showVersionSheet, setShowVersionSheet] = useState(false);
  const [showFeedbackSheet, setShowFeedbackSheet] = useState(false);
  const [showCheck, setShowCheck] = useState(false);

  // Handle open/close animation
  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => setIsAnimating(true));
    }
  }, [isOpen]);

  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(() => setIsOpen(false), 300);
  };

  const handleFormatClick = (id: OutputFormat, hasContent: boolean) => {
    if (isRegenerating) return;
    if (lockedFormats.includes(id)) {
      handleClose();
      onLockedClick?.(id);
      return;
    }
    if (hasContent) {
      onFormatChange(id);
    } else {
      onRegenerate(id);
    }
    // Don't close — let user see the format switch
  };

  const doAction = (fn: () => void) => {
    handleClose();
    fn();
  };

  const formats: { id: OutputFormat; label: string; icon: typeof FileText; hasContent: boolean }[] = [
    { id: 'one-pager', label: 'One-Pager', icon: FileText, hasContent: hasOnePager },
    { id: 'script', label: 'Script', icon: ScrollText, hasContent: hasScript },
  ];

  return (
    <div className="sm:hidden">
      <button
        onClick={() => setIsOpen(true)}
        className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent/10 transition-colors"
        style={{ minHeight: 44, minWidth: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {isOpen && createPortal(
        <>
          {/* Backdrop */}
          <div
            onClick={handleClose}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 9998,
              background: 'rgba(0,0,0,0.5)',
              opacity: isAnimating ? 1 : 0,
              transition: 'opacity 300ms ease-out',
            }}
          />

          {/* Bottom sheet */}
          <div
            style={{
              position: 'fixed',
              bottom: 0,
              left: 0,
              right: 0,
              zIndex: 9999,
              background: '#13111f',
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
              borderTop: '1px solid rgba(168,85,247,0.1)',
              padding: '8px 0',
              paddingBottom: 'env(safe-area-inset-bottom, 8px)',
              maxHeight: '70vh',
              overflowY: 'auto',
              transform: isAnimating ? 'translateY(0)' : 'translateY(100%)',
              transition: 'transform 300ms ease-out',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Drag indicator */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
              <div style={{ width: 40, height: 4, borderRadius: 2, background: 'rgba(240,237,246,0.15)' }} />
            </div>

            {/* Format toggle */}
            {formats.map(({ id, label, icon: Icon, hasContent }) => {
              const isLocked = lockedFormats.includes(id);
              const isActive = activeFormat === id;
              return (
                <button
                  key={id}
                  onClick={() => handleFormatClick(id, hasContent)}
                  disabled={isRegenerating}
                  style={{
                    width: '100%',
                    height: 52,
                    padding: '0 24px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    background: isActive ? 'rgba(168,85,247,0.12)' : 'transparent',
                    border: 'none',
                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                    cursor: 'pointer',
                    position: 'relative',
                  }}
                >
                  <Icon style={{ width: 16, height: 16, color: isActive ? 'rgba(168,85,247,0.9)' : 'rgba(240,237,246,0.5)' }} />
                  <span style={{ fontSize: 15, color: isActive ? 'rgba(240,237,246,1)' : 'rgba(240,237,246,0.8)', fontWeight: isActive ? 500 : 400 }}>
                    {label}
                  </span>
                  {isActive && (
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'rgba(168,85,247,0.8)', marginLeft: 4 }} />
                  )}
                  {isLocked && (
                    <>
                      <Lock style={{ width: 13, height: 13, color: 'rgba(240,237,246,0.35)', marginLeft: 'auto' }} />
                      <span style={{
                        position: 'absolute', top: 8, right: 16,
                        fontSize: 8, fontWeight: 700,
                        padding: '2px 4px', borderRadius: 3,
                        background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))',
                      }}>PRO</span>
                    </>
                  )}
                  {!hasContent && !isLocked && (
                    <RefreshCw style={{ width: 13, height: 13, color: 'rgba(240,237,246,0.35)', marginLeft: 'auto', ...(isRegenerating ? { animation: 'spin 1s linear infinite' } : {}) }} />
                  )}
                </button>
              );
            })}

            {/* Divider */}
            <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '8px 0' }} />

            {/* Action items */}
            {onEdit && (
              <MenuItem icon={<Edit2 style={iconStyle} />} label="Edit" onClick={() => doAction(onEdit)} />
            )}
            <MenuItem
              icon={<Download style={iconStyle} />}
              label="Download PDF"
              onClick={() => doAction(onExport)}
              trailing={isFree ? <Lock style={{ width: 13, height: 13, color: 'rgba(240,237,246,0.35)' }} /> : undefined}
            />
            <MenuItem icon={<Share2 style={iconStyle} />} label="Share" onClick={() => doAction(onShare)} />
            <MenuItem icon={<Copy style={iconStyle} />} label="Copy all" onClick={() => doAction(onCopyAll)} />
            {onPractice && (
              <MenuItem icon={<Play style={iconStyle} />} label="Practice" onClick={() => doAction(onPractice)} />
            )}
            {activeProject && (
              <MenuItem
                icon={<History style={iconStyle} />}
                label="Versions"
                onClick={() => { handleClose(); setShowVersionSheet(true); }}
              />
            )}

            {/* Divider */}
            <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '8px 0' }} />

            {/* Feedback row — side by side */}
            {feedbackProjectId && (
              <div style={{ display: 'flex', padding: '0 24px', gap: 8, marginBottom: 8 }}>
                <button
                  onClick={() => {
                    if (!feedbackSubmitted) {
                      onThumbsUp?.();
                      setShowCheck(true);
                      setTimeout(() => setShowCheck(false), 800);
                      handleClose();
                    }
                  }}
                  disabled={feedbackSubmitted}
                  style={{
                    ...feedbackBtnStyle,
                    opacity: feedbackSubmitted ? 0.3 : 1,
                  }}
                >
                  {showCheck ? (
                    <Check style={{ width: 16, height: 16, color: '#4ade80' }} />
                  ) : (
                    <ThumbsUp style={{ width: 16, height: 16, color: 'rgba(240,237,246,0.5)' }} />
                  )}
                  <span style={{ fontSize: 14, color: 'rgba(240,237,246,0.8)' }}>Good</span>
                </button>
                <button
                  onClick={() => {
                    if (!feedbackSubmitted) {
                      handleClose();
                      setShowFeedbackSheet(true);
                    }
                  }}
                  disabled={feedbackSubmitted}
                  style={{
                    ...feedbackBtnStyle,
                    opacity: feedbackSubmitted ? 0.3 : 1,
                  }}
                >
                  <ThumbsDown style={{ width: 16, height: 16, color: 'rgba(240,237,246,0.5)' }} />
                  <span style={{ fontSize: 14, color: 'rgba(240,237,246,0.8)' }}>Needs work</span>
                </button>
              </div>
            )}
          </div>
        </>, document.body
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

/* ---- Shared styles ---- */

const iconStyle: React.CSSProperties = { width: 16, height: 16, color: 'rgba(240,237,246,0.5)' };

const feedbackBtnStyle: React.CSSProperties = {
  flex: 1,
  height: 48,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  background: 'rgba(168,85,247,0.06)',
  border: '1px solid rgba(168,85,247,0.1)',
  borderRadius: 12,
  cursor: 'pointer',
};

/* ---- MenuItem sub-component ---- */

interface MenuItemProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  trailing?: React.ReactNode;
}

const MenuItem = ({ icon, label, onClick, trailing }: MenuItemProps) => (
  <button
    onClick={onClick}
    style={{
      width: '100%',
      height: 52,
      padding: '0 24px',
      display: 'flex',
      alignItems: 'center',
      gap: 14,
      background: 'transparent',
      border: 'none',
      borderBottom: '1px solid rgba(255,255,255,0.04)',
      cursor: 'pointer',
    }}
    onPointerDown={e => {
      (e.currentTarget as HTMLButtonElement).style.background = 'rgba(168,85,247,0.08)';
    }}
    onPointerUp={e => {
      (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
    }}
    onPointerLeave={e => {
      (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
    }}
  >
    {icon}
    <span style={{ fontSize: 15, color: 'rgba(240,237,246,0.8)' }}>{label}</span>
    {trailing && <span style={{ marginLeft: 'auto' }}>{trailing}</span>}
  </button>
);

export default MobileOverflowMenu;
