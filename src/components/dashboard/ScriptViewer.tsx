import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Check, Copy, Clock, Trash2 } from 'lucide-react';

/** A single line in the flat script sequence */
export interface ScriptLine {
  type: 'opener' | 'line' | 'pause' | 'transition' | 'closer';
  text?: string;
  note?: string;
  emphasis?: string | null;
  duration?: string;
}

export interface ScriptData {
  title: string;
  context_line?: string;
  total_duration: string;
  lines: ScriptLine[];
  opener?: { line: string; delivery_note?: string };
  sections?: Array<{ name: string; duration: string; points: string[]; transition?: string }>;
  closer?: { line: string; delivery_note?: string };
}

interface ScriptViewerProps {
  data: ScriptData;
  onUpdate?: (data: ScriptData) => void;
  refineAnimationKey?: number;
  onDeleteLine?: (lineIdx: number) => void;
}

/** Migrate old section-based schema to flat lines */
function migrateToLines(raw: any): ScriptData {
  if (Array.isArray(raw.lines) && raw.lines.length > 0) {
    return raw as ScriptData;
  }

  const lines: ScriptLine[] = [];

  if (raw.opener?.line) {
    lines.push({ type: 'opener', text: raw.opener.line, note: raw.opener.delivery_note, duration: '10 sec' });
  }

  if (Array.isArray(raw.sections)) {
    for (const section of raw.sections) {
      if (Array.isArray(section.points)) {
        for (const point of section.points) {
          lines.push({ type: 'line', text: point, emphasis: null });
        }
      } else if (section.content) {
        lines.push({ type: 'line', text: section.content, emphasis: null });
      }
      if (section.transition) {
        lines.push({ type: 'transition', text: section.transition });
      }
    }
  }

  if (raw.closer?.line) {
    lines.push({ type: 'closer', text: raw.closer.line, note: raw.closer.delivery_note, duration: '10 sec' });
  }

  return {
    title: raw.title || 'Untitled Script',
    context_line: raw.context_line || '',
    total_duration: raw.total_duration || '',
    lines,
  };
}

function parseMarkdownBold(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      const inner = part.slice(2, -2);
      const isNumeric = /[\d$%x×]/.test(inner);
      return (
        <strong key={i} style={{ fontWeight: 700, color: isNumeric ? 'rgba(255,255,255,1)' : 'rgba(240,237,246,0.92)' }}>
          {inner}
        </strong>
      );
    }
    return part;
  });
}

function renderLineText(text: string, emphasis?: string | null) {
  if (text.includes('**')) {
    return <>{parseMarkdownBold(text)}</>;
  }
  if (!emphasis || !text.includes(emphasis)) {
    return <>{text}</>;
  }
  const idx = text.indexOf(emphasis);
  return (
    <>
      {text.slice(0, idx)}
      <strong style={{ fontWeight: 700, color: 'rgba(255,255,255,1)' }}>
        {emphasis}
      </strong>
      {text.slice(idx + emphasis.length)}
    </>
  );
}

/** Swipeable line wrapper for mobile delete gesture */
const SwipeableLineWrapper = ({
  children,
  onDelete,
}: {
  children: React.ReactNode;
  onDelete?: () => void;
}) => {
  const startXRef = useRef<number | null>(null);
  const [offsetX, setOffsetX] = useState(0);
  const [showDelete, setShowDelete] = useState(false);

  if (!onDelete) return <>{children}</>;

  const handleTouchStart = (e: React.TouchEvent) => {
    startXRef.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (startXRef.current === null) return;
    const diff = e.touches[0].clientX - startXRef.current;
    if (diff < 0) setOffsetX(Math.max(diff, -80));
  };

  const handleTouchEnd = () => {
    if (offsetX < -40) {
      setShowDelete(true);
      setOffsetX(-80);
    } else {
      setShowDelete(false);
      setOffsetX(0);
    }
    startXRef.current = null;
  };

  return (
    <div className="relative overflow-hidden">
      {showDelete && (
        <button
          onClick={() => { setShowDelete(false); setOffsetX(0); onDelete(); }}
          className="absolute right-0 top-0 bottom-0 w-20 bg-destructive flex items-center justify-center z-10"
        >
          <Trash2 className="w-4 h-4 text-destructive-foreground" />
        </button>
      )}
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          transform: `translateX(${offsetX}px)`,
          transition: startXRef.current !== null ? 'none' : 'transform 0.2s ease-out',
        }}
      >
        {children}
      </div>
    </div>
  );
};

const ScriptViewer = ({ data: rawData, refineAnimationKey, onDeleteLine }: ScriptViewerProps) => {
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  const data = migrateToLines(rawData);

  const copyLine = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(key);
    setTimeout(() => setCopiedIndex(null), 1500);
  };

  const copyAll = () => {
    const text = data.lines
      .map(l => {
        if (l.type === 'pause') return `[PAUSE] ${l.note || ''}`;
        if (l.type === 'transition') return `→ ${l.text || ''}`;
        if (l.type === 'opener') return `[OPEN WITH] ${l.text || ''}`;
        if (l.type === 'closer') return `[CLOSE WITH] ${l.text || ''}`;
        return l.text || '';
      })
      .join('\n\n');
    navigator.clipboard.writeText(text);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 1500);
  };

  let lineNumber = 0;

  return (
    <motion.div
      key={refineAnimationKey}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-[680px] mx-auto py-2 relative"
    >
      {/* Subtle radial glow behind content */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(124,77,255,0.04) 0%, transparent 70%)',
        }}
      />

      {/* Context line — Level 3 */}
      {data.context_line && (
        <p className="text-sm mb-4 relative z-10 text-primary/90 font-medium">
          {data.context_line}
        </p>
      )}

      {/* Duration + Copy All row */}
      <div className="flex items-center justify-between mb-6 sm:mb-8 relative z-10">
        {data.total_duration && (
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" style={{ color: 'rgba(124,77,255,0.85)' }} />
            <span className="text-xs" style={{ color: 'rgba(124,77,255,0.75)' }}>~{data.total_duration}</span>
          </div>
        )}
        <button
          onClick={copyAll}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors"
          style={{ color: copiedAll ? undefined : 'rgba(240,237,246,0.4)' }}
          onMouseEnter={(e) => { if (!copiedAll) e.currentTarget.style.color = 'rgba(240,237,246,0.7)'; }}
          onMouseLeave={(e) => { if (!copiedAll) e.currentTarget.style.color = 'rgba(240,237,246,0.4)'; }}
        >
          {copiedAll ? (
            <>
              <Check className="w-3.5 h-3.5 text-green-400" />
              <span className="text-green-400">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy all</span>
            </>
          )}
        </button>
      </div>

      {/* Lines sequence */}
      <div className="space-y-1 relative z-10">
        {data.lines.map((line, idx) => {
          const key = `line-${idx}`;
          const isCopied = copiedIndex === key;

          // --- OPENER ---
          if (line.type === 'opener') {
            return (
              <SwipeableLineWrapper key={key} onDelete={onDeleteLine ? () => onDeleteLine(idx) : undefined}>
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.04 }}
                  className="mb-6 sm:mb-8"
                >
                  {/* Label — Level 2 */}
                  <p
                    className="text-[13px] uppercase tracking-[0.15em] font-medium mb-3 sm:mb-4"
                    style={{ color: 'rgba(124,77,255,0.9)' }}
                  >
                    Open with
                  </p>
                  <button
                    onClick={() => copyLine(line.text || '', key)}
                    className="w-full text-left relative min-h-[44px]"
                    style={{ borderLeft: '2px solid rgba(124,77,255,0.3)', paddingLeft: 16 }}
                  >
                    {/* Main line — Level 1 */}
                    <p
                      className="text-base sm:text-lg leading-[1.55] font-medium"
                      style={{ color: 'rgba(240,237,246,0.92)' }}
                    >
                      {renderLineText(line.text || '')}
                    </p>
                    {/* Stage direction — Level 3 */}
                    {line.note && (
                      <p className="mt-2 text-[11px] italic" style={{ color: 'rgba(124,77,255,0.55)' }}>
                        <span style={{ color: 'rgba(124,77,255,0.45)', marginRight: 6 }}>◆</span>
                        {line.note}
                      </p>
                    )}
                    {isCopied && (
                      <span className="absolute inset-0 flex items-center justify-center sm:inset-auto sm:top-0 sm:right-0 text-[10px] font-medium text-green-400 bg-green-400/10 sm:bg-green-400/10 px-2 py-0.5 rounded-full pointer-events-none">
                        Copied
                      </span>
                    )}
                  </button>
                  <div className="mt-4 sm:mt-5 border-b" style={{ borderColor: 'rgba(124,77,255,0.15)' }} />
                </motion.div>
              </SwipeableLineWrapper>
            );
          }

          // --- PAUSE / SECTION SEPARATOR ---
          if (line.type === 'pause') {
            return (
              <motion.div
                key={key}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: idx * 0.04 }}
                className="text-center"
                style={{ paddingTop: 32, paddingBottom: 32 }}
              >
                <p className="text-sm tracking-[0.3em] mb-1" style={{ color: 'rgba(124,77,255,0.4)' }}>
                  · · ·
                </p>
                {line.note && (
                  <p className="text-[11px] italic" style={{ color: 'rgba(124,77,255,0.55)' }}>
                    <span style={{ color: 'rgba(124,77,255,0.45)', marginRight: 6 }}>◆</span>
                    {line.note}
                  </p>
                )}
              </motion.div>
            );
          }

          // --- TRANSITION ---
          if (line.type === 'transition') {
            return (
              <motion.div
                key={key}
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.04 }}
                className="py-3"
                style={{ paddingLeft: 42 }}
              >
                <p className="text-[13px] italic" style={{ color: 'rgba(124,77,255,0.55)' }}>
                  <span style={{ color: 'rgba(124,77,255,0.45)', marginRight: 6 }}>◆</span>
                  {renderLineText(line.text || '')}
                </p>
              </motion.div>
            );
          }

          // --- CLOSER ---
          if (line.type === 'closer') {
            return (
              <SwipeableLineWrapper key={key} onDelete={onDeleteLine ? () => onDeleteLine(idx) : undefined}>
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.04 }}
                  className="mt-6 sm:mt-8"
                >
                  <div className="mb-4 sm:mb-5 border-b" style={{ borderColor: 'rgba(124,77,255,0.15)' }} />
                  {/* Label — Level 2 */}
                  <p
                    className="text-[13px] uppercase tracking-[0.15em] font-medium mb-3 sm:mb-4"
                    style={{ color: 'rgba(124,77,255,0.9)' }}
                  >
                    Close with
                  </p>
                  <button
                    onClick={() => copyLine(line.text || '', key)}
                    className="w-full text-left relative min-h-[44px]"
                    style={{ borderLeft: '2px solid rgba(124,77,255,0.3)', paddingLeft: 16 }}
                  >
                    {/* Main line — Level 1 */}
                    <p
                      className="text-base sm:text-lg leading-[1.55] font-medium"
                      style={{ color: 'rgba(240,237,246,0.92)' }}
                    >
                      {renderLineText(line.text || '')}
                    </p>
                    {/* Stage direction — Level 3 */}
                    {line.note && (
                      <p className="mt-2 text-[11px] italic" style={{ color: 'rgba(124,77,255,0.55)' }}>
                        <span style={{ color: 'rgba(124,77,255,0.45)', marginRight: 6 }}>◆</span>
                        {line.note}
                      </p>
                    )}
                    {isCopied && (
                      <span className="absolute inset-0 flex items-center justify-center sm:inset-auto sm:top-0 sm:right-0 text-[10px] font-medium text-green-400 bg-green-400/10 sm:bg-green-400/10 px-2 py-0.5 rounded-full pointer-events-none">
                        Copied
                      </span>
                    )}
                  </button>
                </motion.div>
              </SwipeableLineWrapper>
            );
          }

          // --- REGULAR LINE ---
          lineNumber++;
          const num = String(lineNumber).padStart(2, '0');

          return (
            <SwipeableLineWrapper key={key} onDelete={onDeleteLine ? () => onDeleteLine(idx) : undefined}>
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04 }}
                className="py-2.5 sm:py-3"
              >
                <button
                  onClick={() => copyLine(line.text || '', key)}
                  className="w-full text-left flex items-start relative group min-h-[44px]"
                >
                  {/* Line number — Level 4 */}
                  <span
                    className="text-[11px] font-mono pt-0.5 shrink-0 select-none"
                    style={{ color: 'rgba(124,77,255,0.65)', width: 24 }}
                  >
                    {num}
                  </span>

                  {/* Line text with left border — Level 1 */}
                  <p
                    className="text-[14px] sm:text-[15px] leading-[1.7] flex-1"
                    style={{
                      color: 'rgba(240,237,246,0.92)',
                      borderLeft: '2px solid rgba(124,77,255,0.3)',
                      paddingLeft: 16,
                    }}
                  >
                    {renderLineText(line.text || '', line.emphasis)}
                  </p>

                  {isCopied && (
                    <span className="absolute inset-0 flex items-center justify-center sm:inset-auto sm:top-0 sm:right-0 text-[10px] font-medium text-green-400 bg-green-400/10 sm:bg-green-400/10 px-2 py-0.5 rounded-full pointer-events-none">
                      Copied
                    </span>
                  )}
                </button>
              </motion.div>
            </SwipeableLineWrapper>
          );
        })}
      </div>
    </motion.div>
  );
};

export default ScriptViewer;
