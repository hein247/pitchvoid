import { ArrowLeft, FileText, Play, X } from 'lucide-react';
import OnePager, { type OnePagerData } from '@/components/dashboard/OnePager';
import OnePagerEditor from '@/components/dashboard/OnePagerEditor';
import MobileEditorSheet from '@/components/dashboard/MobileEditorSheet';
import ScriptViewer, { type ScriptData } from '@/components/dashboard/ScriptViewer';
import FormatToggle from '@/components/dashboard/FormatToggle';
import VersionHistoryDropdown from '@/components/dashboard/VersionHistoryDropdown';
import MobileOverflowMenu from '@/components/dashboard/MobileOverflowMenu';
import DesktopOverflowMenu from '@/components/dashboard/DesktopOverflowMenu';
import RefinementBar from '@/components/dashboard/output/RefinementBar';
import { OrbitalLoader } from '@/components/ui/orbital-loader';
import type { ProjectRecord } from '@/hooks/useProjects';

type OutputFormat = 'one-pager' | 'script';

interface OutputViewProps {
  project: ProjectRecord;
  parsedContext: { context?: string; mode?: string } | null;
  outputFormat: OutputFormat;
  onePagerData: OnePagerData | null;
  scriptData: ScriptData | null;
  isRegenerating: boolean;
  isRefining: boolean;
  generationPhase: string;
  refineAnimationKey: number;
  feedbackKey: number;
  trustWarning?: string | null;
  showUndo: boolean;
  showEditor: boolean;
  activeVersionId?: string;
  isFree: boolean;
  isMobile: boolean;
  onBack: () => void;
  onFormatChange: (format: OutputFormat) => void;
  onRegenerateInFormat: (format: OutputFormat) => void;
  onRefine: (instruction: string) => void;
  onUndo: () => void;
  onShare: () => void;
  onPractice: () => void;
  onExportPDF: () => void;
  onToggleEditor: () => void;
  onCloseEditor: () => void;
  onSetOnePagerData: (data: OnePagerData) => void;
  onSetScriptData: (data: ScriptData) => void;
  onSetOutputFormat: (format: OutputFormat) => void;
  onSetActiveVersionId: (id: string) => void;
  onCopyAll: () => void;
  checkAndTriggerPaywall: (action: string, options?: Record<string, unknown>) => boolean;
  fetchVersions: (projectId: string) => Promise<any[]>;
  onRefineFromEditor: (prompt: string) => void;
  isGenerating: boolean;
}

const OutputView = ({
  project, parsedContext, outputFormat, onePagerData, scriptData,
  isRegenerating, isRefining, generationPhase, refineAnimationKey, feedbackKey, trustWarning,
  showUndo, showEditor, activeVersionId, isFree, isMobile,
  onBack, onFormatChange, onRegenerateInFormat, onRefine, onUndo,
  onShare, onPractice, onExportPDF, onToggleEditor, onCloseEditor,
  onSetOnePagerData, onSetScriptData, onSetOutputFormat, onSetActiveVersionId,
  onCopyAll, checkAndTriggerPaywall, fetchVersions,
  onRefineFromEditor, isGenerating,
}: OutputViewProps) => {
  const displayTitle = (outputFormat === 'script' ? scriptData?.title : onePagerData?.title) || project.title;

  const handleSelectVersion = (version: any) => {
    onSetActiveVersionId(version.id);
    const vData = version.output_data;
    if (version.output_format === 'script' && vData.script) {
      onSetScriptData(vData.script as unknown as ScriptData);
      onSetOutputFormat('script');
    } else if (vData.onePager) {
      onSetOnePagerData(vData.onePager as unknown as OnePagerData);
      onSetOutputFormat('one-pager');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[hsl(0_0%_7%)]">
      {/* Preview Panel — full screen */}
      <div className="grain-bg flex flex-col relative flex-1">
        <header className="px-3 sm:px-6 py-3 sm:py-4 flex items-center gap-2 sm:gap-3 justify-between border-b border-border relative z-50">
          {/* Left: Back + Title */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <button
              onClick={onBack}
              className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="font-medium font-display text-sm sm:text-base truncate max-w-[140px] sm:max-w-[300px] lg:max-w-[400px]" style={{ color: 'rgba(240,237,246,0.95)' }} title={displayTitle}>{displayTitle}</h2>
                {parsedContext?.context && parsedContext.context !== 'general' && (
                  <span className="text-[10px] uppercase tracking-wider hidden sm:inline" style={{ color: 'rgba(168,85,247,0.35)' }}>
                    {parsedContext.context.replace(/_/g, ' ').replace('thinking ', '')}
                  </span>
                )}
              </div>
              {isRegenerating && (
                <p className="text-xs text-primary animate-pulse">{generationPhase}</p>
              )}
              {!isRegenerating && outputFormat === 'one-pager' && onePagerData && (
                <p className="text-xs hidden sm:block" style={{ color: 'rgba(240,237,246,0.4)' }}>{onePagerData.context_line || 'One-pager'}</p>
              )}
              {!isRegenerating && outputFormat === 'script' && scriptData && (
                <p className="text-xs hidden sm:block" style={{ color: 'rgba(240,237,246,0.4)' }}>Speaking script</p>
              )}
            </div>
          </div>

          {/* Right: Actions */}
          {(onePagerData || scriptData) && (
            <div className="flex items-center gap-1 sm:gap-0 flex-shrink-0">
              {/* Desktop: Format Toggle + Versions + Overflow */}
              <div className="hidden sm:flex items-center gap-1">
                <div className="flex items-center rounded-xl border border-border p-1 bg-card/50 backdrop-blur-sm">
                  <FormatToggle
                    activeFormat={outputFormat}
                    onFormatChange={onFormatChange}
                    hasOnePager={!!onePagerData}
                    hasScript={!!scriptData}
                    onRegenerate={onRegenerateInFormat}
                    isRegenerating={isRegenerating}
                    lockedFormats={isFree ? ['script'] : []}
                    onLockedClick={(format) => checkAndTriggerPaywall('use_format', { format })}
                  />

                  {/* Practice mode - for scripts only */}
                  {outputFormat === 'script' && scriptData && (
                    <>
                      <div className="w-px h-6 bg-border mx-1" />
                      <button
                        onClick={onPractice}
                        className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent/10 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                        title="Practice"
                      >
                        <Play className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>

                {/* Version History */}
                <VersionHistoryDropdown
                  projectId={project.id}
                  currentVersionId={activeVersionId}
                  fetchVersions={fetchVersions}
                  onSelectVersion={handleSelectVersion}
                />

                {/* Desktop overflow for secondary actions */}
                <DesktopOverflowMenu
                  onShare={onShare}
                  onExport={onExportPDF}
                  onEdit={onePagerData && !isRegenerating ? onToggleEditor : undefined}
                  onCopyAll={onCopyAll}
                  isFree={isFree}
                />
              </div>

              {/* Mobile: only overflow menu */}
              <MobileOverflowMenu
                onShare={onShare}
                onExport={onExportPDF}
                onEdit={onePagerData && !isRegenerating ? onToggleEditor : undefined}
                onPractice={outputFormat === 'script' && scriptData ? onPractice : undefined}
                onCopyAll={onCopyAll}
                onVersionHistory={() => {/* handled by sheet */}}
                isFree={isFree}
                activeProject={project}
                activeVersionId={activeVersionId}
                fetchVersions={fetchVersions}
                onSelectVersion={handleSelectVersion}
                activeFormat={outputFormat}
                onFormatChange={onFormatChange}
                hasOnePager={!!onePagerData}
                hasScript={!!scriptData}
                onRegenerate={onRegenerateInFormat}
                isRegenerating={isRegenerating}
                lockedFormats={isFree ? ['script'] : []}
                onLockedClick={(format) => checkAndTriggerPaywall('use_format', { format })}
              />
            </div>
          )}
        </header>
        
        <div className={`overflow-y-auto px-5 sm:p-6 lg:p-8 py-4 relative z-10 transition-opacity duration-300 ${isRefining ? 'opacity-30' : 'opacity-100'}`} style={{ paddingBottom: onePagerData || scriptData ? '260px' : undefined }}>
          {/* Inline refining overlay */}
          {isRefining && (
            <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
              <OrbitalLoader size="sm" message="Refining..." />
            </div>
          )}
          {/* Show orbital loader during regeneration */}
          {isRegenerating ? (
            <div className="py-16 flex items-center justify-center">
              <OrbitalLoader
                messages={['Finding the structure...', 'Organizing your thoughts...', 'Almost there...']}
                messageInterval={2000}
              />
            </div>
          ) : outputFormat === 'script' && scriptData ? (
            <ScriptViewer
              data={scriptData}
              onUpdate={(updatedData) => onSetScriptData(updatedData)}
              refineAnimationKey={refineAnimationKey}
            />
          ) : outputFormat === 'one-pager' && onePagerData ? (
            <OnePager
              data={onePagerData}
              projectTitle={project.title}
              refineAnimationKey={refineAnimationKey}
            />
          ) : (onePagerData || scriptData) && !isRegenerating ? (
            /* Format not yet generated — show loading, useEffect will trigger generation */
            <div className="py-16 flex items-center justify-center animate-fadeIn">
              <OrbitalLoader
                messages={['Finding the structure...', 'Organizing your thoughts...', 'Almost there...']}
                messageInterval={2000}
              />
            </div>
          ) : (
            <div className="py-16 flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 rounded-2xl flex items-center justify-center bg-gradient-to-br from-accent/15 to-primary/8 border border-dashed border-accent/30">
                  <FileText className="w-8 h-8 sm:w-9 sm:h-9 text-accent/50" />
                </div>
                <p className="text-muted-foreground text-sm">Your pitch will appear here</p>
                <p className="text-muted-foreground/60 text-xs mt-1">Describe your scenario below to get started</p>
              </div>
            </div>
          )}

          {/* Trust Warning */}
          {trustWarning && !isRegenerating && (onePagerData || scriptData) && (
            <div className="max-w-[680px] mx-auto mt-4 px-4 py-2.5 rounded-lg" style={{ backgroundColor: 'rgba(234,179,8,0.08)', border: '1px solid rgba(234,179,8,0.15)' }}>
              <p className="text-xs" style={{ color: 'rgba(234,179,8,0.4)' }}>{trustWarning}</p>
            </div>
          )}
        </div>

        {/* Refinement Bar */}
        {(onePagerData || scriptData) && !isRegenerating && (
          <RefinementBar
            onRefine={onRefine}
            isRefining={isRefining}
            showUndo={showUndo}
            onUndo={onUndo}
            projectId={project?.id}
            format={outputFormat === 'script' ? 'script' : 'one-pager'}
            generationKey={feedbackKey}
            generatedOutput={
              outputFormat === 'script'
                ? (scriptData as unknown as Record<string, unknown>)
                : (onePagerData as unknown as Record<string, unknown>)
            }
          />
        )}
      </div>

      {/* Editor Overlay */}
      {showEditor && onePagerData && (
        <div className="fixed inset-0 z-40 flex items-end justify-center modal-overlay" onClick={onCloseEditor}>
          <div
            className="w-full max-w-3xl max-h-[70vh] overflow-y-auto rounded-t-2xl border border-border bg-background p-4 sm:p-6 animate-slideUp"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-foreground font-display">Edit One-Pager</h3>
              <button onClick={onCloseEditor} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>
            {isMobile ? (
              <MobileEditorSheet
                data={onePagerData}
                onUpdate={(updatedData) => onSetOnePagerData(updatedData)}
                onRefine={onRefineFromEditor}
                isRefining={isGenerating}
              />
            ) : (
              <OnePagerEditor
                data={onePagerData}
                onUpdate={(updatedData) => onSetOnePagerData(updatedData)}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default OutputView;
