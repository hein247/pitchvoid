import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Copy, Clock } from 'lucide-react';

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
  // Legacy fields for migration
  opener?: { line: string; delivery_note?: string };
  sections?: Array<{ name: string; duration: string; points: string[]; transition?: string }>;
  closer?: { line: string; delivery_note?: string };
}

interface ScriptViewerProps {
  data: ScriptData;
  onUpdate?: (data: ScriptData) => void;
}

/** Migrate old section-based schema to flat lines */
function migrateToLines(raw: any): ScriptData {
  // New flat lines schema
  if (Array.isArray(raw.lines) && raw.lines.length > 0) {
    return raw as ScriptData;
  }

  // Old schema: opener + sections + closer → flat lines
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

/** Parse markdown **bold** into <strong> tags */
function parseMarkdownBold(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} style={{ fontWeight: 700, color: '#f0edf6' }}>
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}

/** Render line text with markdown bold and emphasis fallback */
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
      <strong style={{ fontWeight: 700, color: '#f0edf6' }}>
        {emphasis}
      </strong>
      {text.slice(idx + emphasis.length)}
    </>
  );
}

const ScriptViewer = ({ data: rawData }: ScriptViewerProps) => {
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

  // Count regular lines for numbering
  let lineNumber = 0;

  return (
    <div className="max-w-[680px] mx-auto py-2">
      {/* Context line */}
      {data.context_line && (
        <p className="text-xs mb-4" style={{ color: 'rgba(240,237,246,0.25)' }}>
          {data.context_line}
        </p>
      )}

      {/* Duration + Copy All row */}
      <div className="flex items-center justify-between mb-8">
        {data.total_duration && (
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">~{data.total_duration}</span>
          </div>
        )}
        <button
          onClick={copyAll}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors hover:bg-accent/10 text-muted-foreground"
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
      <div className="space-y-1">
        {data.lines.map((line, idx) => {
          const key = `line-${idx}`;
          const isCopied = copiedIndex === key;

          // --- OPENER ---
          if (line.type === 'opener') {
            return (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04 }}
                className="mb-8"
              >
                <p
                  className="text-[10px] uppercase tracking-[0.18em] font-medium mb-3"
                  style={{ color: 'rgba(168,85,247,0.55)' }}
                >
                  Open with
                </p>
                <button
                  onClick={() => copyLine(line.text || '', key)}
                  className="w-full text-left relative"
                >
                  <p
                    className="text-lg leading-[1.55] font-medium"
                    style={{ color: 'rgba(240,237,246,0.8)' }}
                  >
                    {renderLineText(line.text || '')}
                  </p>
                  {line.note && (
                    <p className="mt-2 text-[11px] italic" style={{ color: 'rgba(240,237,246,0.2)' }}>
                      {line.note}
                    </p>
                  )}
                  {isCopied && (
                    <span className="absolute top-0 right-0 text-[10px] font-medium text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full">
                      Copied
                    </span>
                  )}
                </button>
                <div className="mt-5 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }} />
              </motion.div>
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
                className="py-5 text-center"
              >
                <p className="text-sm tracking-[0.3em] mb-1" style={{ color: 'rgba(240,237,246,0.15)' }}>
                  · · ·
                </p>
                {line.note && (
                  <p className="text-[11px] italic" style={{ color: 'rgba(240,237,246,0.2)' }}>
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
                className="py-3 pl-9"
              >
                <p className="text-[13px] italic" style={{ color: 'rgba(240,237,246,0.3)' }}>
                  {renderLineText(line.text || '')}
                </p>
              </motion.div>
            );
          }

          // --- CLOSER ---
          if (line.type === 'closer') {
            return (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04 }}
                className="mt-8"
              >
                <div className="mb-5 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }} />
                <p
                  className="text-[10px] uppercase tracking-[0.18em] font-medium mb-3"
                  style={{ color: 'rgba(168,85,247,0.55)' }}
                >
                  Close with
                </p>
                <button
                  onClick={() => copyLine(line.text || '', key)}
                  className="w-full text-left relative"
                >
                  <p
                    className="text-lg leading-[1.55] font-medium"
                    style={{ color: 'rgba(240,237,246,0.8)' }}
                  >
                    {renderLineText(line.text || '')}
                  </p>
                  {line.note && (
                    <p className="mt-2 text-[11px] italic" style={{ color: 'rgba(240,237,246,0.2)' }}>
                      {line.note}
                    </p>
                  )}
                  {isCopied && (
                    <span className="absolute top-0 right-0 text-[10px] font-medium text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full">
                      Copied
                    </span>
                  )}
                </button>
              </motion.div>
            );
          }

          // --- REGULAR LINE ---
          lineNumber++;
          const num = String(lineNumber).padStart(2, '0');

          return (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04 }}
              className="py-2.5"
            >
              <button
                onClick={() => copyLine(line.text || '', key)}
                className="w-full text-left flex gap-4 items-start relative group"
              >
                {/* Line number */}
                <span
                  className="text-[11px] font-mono pt-0.5 shrink-0 select-none"
                  style={{ color: 'rgba(240,237,246,0.15)', width: '20px' }}
                >
                  {num}
                </span>

                {/* Line text */}
                <p
                  className="text-[15px] leading-[1.65] flex-1"
                  style={{ color: 'rgba(240,237,246,0.6)' }}
                >
                  {renderLineText(line.text || '', line.emphasis)}
                </p>

                {isCopied && (
                  <span className="absolute top-0 right-0 text-[10px] font-medium text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full">
                    Copied
                  </span>
                )}
              </button>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default ScriptViewer;
