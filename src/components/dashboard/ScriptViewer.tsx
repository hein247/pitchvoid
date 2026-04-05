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
      return (
        <strong key={i} style={{ fontWeight: 600, color: 'rgba(255,255,255,1)' }}>
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
      <strong style={{ fontWeight: 600, color: 'rgba(255,255,255,1)' }}>
        {emphasis}
      </strong>
      {text.slice(idx + emphasis.length)}
    </>
  );
}

/** Peach dot bullet */
const PeachDot = ({ opacity = 0.5 }: { opacity?: number }) => (
  <span
    className="shrink-0 rounded-full mt-[9px]"
    style={{
      width: 6,
      height: 6,
      backgroundColor: `rgba(200,150,100,${opacity})`,
    }}
  />
);

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

  return (
    <motion.div
      key={refineAnimationKey}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-[680px] mx-auto relative overflow-hidden rounded-[20px] p-7 sm:p-12"
      style={{
        background: 'linear-gradient(180deg, rgba(200,150,100,0.12) 0%, rgba(20,18,26,0.95) 40%, rgba(14,12,20,0.98) 100%)',
        border: '1px solid rgba(200,150,100,0.15)',
      }}
    >
      {/* Title row */}
      <div className="flex items-start justify-between gap-4">
        <h1
          className="text-[28px] sm:text-[42px] font-normal font-display leading-tight"
          style={{ color: 'rgba(240,237,246,0.95)', letterSpacing: '-0.01em' }}
        >
          {data.title}
        </h1>
        <button
          onClick={copyAll}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs shrink-0 mt-2 transition-colors"
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

      {/* Context line + format tag */}
      <div className="flex items-center gap-2 mt-3">
        {data.context_line && (
          <p className="text-[13px]" style={{ color: 'rgba(240,237,246,0.4)' }}>
            {data.context_line}
          </p>
        )}
        <span
          className="text-[12px] rounded-full px-3 py-1"
          style={{
            background: 'rgba(200,150,100,0.15)',
            border: '1px solid rgba(200,150,100,0.3)',
            color: 'rgba(200,150,100,0.8)',
          }}
        >
          Script
        </span>
      </div>

      {/* Divider */}
      <div
        className="my-4 sm:my-6"
        style={{ height: 1, background: 'rgba(200,150,100,0.2)' }}
      />

      {/* Duration right-aligned */}
      {data.total_duration && (
        <div className="flex justify-end mb-6 sm:mb-8">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" style={{ color: 'rgba(200,150,100,0.5)' }} />
            <span className="text-[12px]" style={{ color: 'rgba(200,150,100,0.5)' }}>
              ~{data.total_duration}
            </span>
          </div>
        </div>
      )}

      {/* Lines */}
      <div className="flex flex-col gap-5">
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
                >
                  <button
                    onClick={() => copyLine(line.text || '', key)}
                    className="w-full text-left relative min-h-[44px]"
                  >
                    <div className="flex items-start gap-3">
                      <PeachDot opacity={0.7} />
                      <div className="flex-1">
                        <p
                          className="text-[15px] sm:text-[17px] font-medium leading-[1.7]"
                          style={{ color: 'rgba(240,237,246,0.92)' }}
                        >
                          {renderLineText(line.text || '')}
                        </p>
                        {line.note && (
                          <p className="mt-2 text-[14px] font-display italic" style={{ color: 'rgba(200,150,100,0.4)' }}>
                            <span style={{ color: 'rgba(200,150,100,0.35)', marginRight: 6 }}>◆</span>
                            {line.note}
                          </p>
                        )}
                        {line.duration && (
                          <span className="text-[11px] mt-1 inline-block" style={{ color: 'rgba(200,150,100,0.35)' }}>
                            {line.duration}
                          </span>
                        )}
                      </div>
                    </div>
                    {isCopied && (
                      <span className="absolute inset-0 flex items-center justify-center sm:inset-auto sm:top-0 sm:right-0 text-[10px] font-medium text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full pointer-events-none">
                        Copied
                      </span>
                    )}
                  </button>
                </motion.div>
              </SwipeableLineWrapper>
            );
          }

          // --- PAUSE ---
          if (line.type === 'pause') {
            return (
              <motion.div
                key={key}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: idx * 0.04 }}
                className="flex items-center gap-3 my-3"
              >
                <div className="flex-1 h-px" style={{ background: 'rgba(200,150,100,0.1)' }} />
                <p className="text-[14px] font-display italic shrink-0" style={{ color: 'rgba(200,150,100,0.35)' }}>
                  {line.note || 'Pause'}
                </p>
                <div className="flex-1 h-px" style={{ background: 'rgba(200,150,100,0.1)' }} />
              </motion.div>
            );
          }

          // --- TRANSITION ---
          if (line.type === 'transition') {
            return (
              <SwipeableLineWrapper key={key} onDelete={onDeleteLine ? () => onDeleteLine(idx) : undefined}>
                <motion.div
                  initial={{ opacity: 0, x: -4 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.04 }}
                >
                  <div className="flex items-start gap-3">
                    <PeachDot opacity={0.3} />
                    <p className="text-[14px] italic leading-[1.7]" style={{ color: 'rgba(240,237,246,0.5)' }}>
                      {renderLineText(line.text || '')}
                    </p>
                  </div>
                </motion.div>
              </SwipeableLineWrapper>
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
                >
                  <button
                    onClick={() => copyLine(line.text || '', key)}
                    className="w-full text-left relative min-h-[44px]"
                  >
                    <div className="flex items-start gap-3">
                      <PeachDot opacity={0.7} />
                      <div className="flex-1">
                        <p
                          className="text-[15px] sm:text-[17px] font-medium leading-[1.7]"
                          style={{ color: 'rgba(240,237,246,0.92)' }}
                        >
                          {renderLineText(line.text || '')}
                        </p>
                        {line.note && (
                          <p className="mt-2 text-[14px] font-display italic" style={{ color: 'rgba(200,150,100,0.4)' }}>
                            <span style={{ color: 'rgba(200,150,100,0.35)', marginRight: 6 }}>◆</span>
                            {line.note}
                          </p>
                        )}
                        {line.duration && (
                          <span className="text-[11px] mt-1 inline-block" style={{ color: 'rgba(200,150,100,0.35)' }}>
                            {line.duration}
                          </span>
                        )}
                      </div>
                    </div>
                    {isCopied && (
                      <span className="absolute inset-0 flex items-center justify-center sm:inset-auto sm:top-0 sm:right-0 text-[10px] font-medium text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full pointer-events-none">
                        Copied
                      </span>
                    )}
                  </button>
                </motion.div>
              </SwipeableLineWrapper>
            );
          }

          // --- REGULAR LINE ---
          return (
            <SwipeableLineWrapper key={key} onDelete={onDeleteLine ? () => onDeleteLine(idx) : undefined}>
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04 }}
              >
                <button
                  onClick={() => copyLine(line.text || '', key)}
                  className="w-full text-left flex items-start gap-3 relative min-h-[44px]"
                >
                  <PeachDot opacity={0.5} />
                  <p
                    className="text-[14px] sm:text-[16px] font-normal leading-[1.7] flex-1"
                    style={{ color: 'rgba(240,237,246,0.85)' }}
                  >
                    {renderLineText(line.text || '', line.emphasis)}
                  </p>
                  {isCopied && (
                    <span className="absolute inset-0 flex items-center justify-center sm:inset-auto sm:top-0 sm:right-0 text-[10px] font-medium text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full pointer-events-none">
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
