import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Copy, Clock } from 'lucide-react';

export interface ScriptSection {
  name: string;
  duration: string;
  points: string[];
  transition?: string;
}

export interface ScriptData {
  title: string;
  total_duration: string;
  opener: {
    line: string;
    delivery_note?: string;
  };
  sections: ScriptSection[];
  closer: {
    line: string;
    delivery_note?: string;
  };
}

interface ScriptViewerProps {
  data: ScriptData;
  onUpdate?: (data: ScriptData) => void;
}

/** Render markdown **bold** as <strong> */
const renderPoint = (text: string) => {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className="font-semibold text-[rgba(240,237,246,0.85)]">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <span key={i}>{part}</span>;
  });
};

const ScriptViewer = ({ data: rawData }: ScriptViewerProps) => {
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  // Migrate old schema (content string, cue, key_phrases) to new (points array, opener, closer)
  const data: ScriptData = (() => {
    const d = rawData as any;
    // New schema check
    if (d.opener && d.closer && Array.isArray(d.sections) && d.sections[0]?.points) {
      return d as ScriptData;
    }
    // Old schema migration
    const oldSections = d.sections || [];
    const hasOldFormat = oldSections.length > 0 && typeof oldSections[0]?.content === 'string';
    
    if (hasOldFormat) {
      // Extract opener from first section, closer from last
      const opener = {
        line: oldSections[0]?.content || '',
        delivery_note: oldSections[0]?.cue || '',
      };
      const closer = {
        line: oldSections[oldSections.length - 1]?.content || '',
        delivery_note: oldSections[oldSections.length - 1]?.cue || '',
      };
      // Middle sections become point-based
      const middleSections = oldSections.slice(1, -1);
      const sections: ScriptSection[] = middleSections.map((s: any, i: number) => ({
        name: s.name || `Section ${i + 1}`,
        duration: s.duration || '',
        points: [s.content].filter(Boolean),
        transition: undefined,
      }));

      return {
        title: d.title || 'Untitled Script',
        total_duration: d.total_duration || '',
        opener,
        sections: sections.length > 0 ? sections : [{
          name: 'Main Point',
          duration: '',
          points: oldSections.map((s: any) => s.content).filter(Boolean),
        }],
        closer,
      };
    }

    // Fallback
    return {
      title: d.title || 'Untitled Script',
      total_duration: d.total_duration || '',
      opener: { line: '', delivery_note: '' },
      sections: [],
      closer: { line: '', delivery_note: '' },
    };
  })();

  const copyPoint = (text: string, key: string) => {
    const clean = text.replace(/\*\*/g, '');
    navigator.clipboard.writeText(clean);
    setCopiedIndex(key);
    setTimeout(() => setCopiedIndex(null), 1500);
  };

  const copyAll = () => {
    const parts: string[] = [];
    if (data.opener.line) parts.push(`[OPEN WITH]\n${data.opener.line}`);
    data.sections.forEach(s => {
      parts.push(`[${s.name}${s.duration ? ` — ${s.duration}` : ''}]\n${s.points.map(p => `• ${p.replace(/\*\*/g, '')}`).join('\n')}`);
      if (s.transition) parts.push(`→ ${s.transition}`);
    });
    if (data.closer.line) parts.push(`[CLOSE WITH]\n${data.closer.line}`);
    navigator.clipboard.writeText(parts.join('\n\n'));
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 1500);
  };

  return (
    <div className="max-w-[680px] mx-auto py-2">
      {/* Duration badge */}
      {data.total_duration && (
        <div className="flex items-center gap-1.5 mb-6">
          <Clock className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">~{data.total_duration}</span>
        </div>
      )}

      {/* Copy All */}
      <div className="flex justify-end mb-6">
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

      {/* Opener Card */}
      {data.opener.line && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <p
            className="text-[10px] uppercase tracking-[0.15em] font-medium mb-3"
            style={{ color: 'rgba(168,85,247,0.55)' }}
          >
            Open with
          </p>
          <button
            onClick={() => copyPoint(data.opener.line, 'opener')}
            className="group w-full text-left relative rounded-xl border transition-all duration-200 p-4 pl-6"
            style={{
              borderColor: copiedIndex === 'opener' ? 'rgba(74,222,128,0.4)' : 'rgba(255,255,255,0.06)',
              backgroundColor: 'rgba(255,255,255,0.02)',
            }}
            onMouseEnter={(e) => {
              if (copiedIndex !== 'opener') e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)';
            }}
            onMouseLeave={(e) => {
              if (copiedIndex !== 'opener') e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
            }}
          >
            {/* Thicker accent bar for opener */}
            <div
              className="absolute left-0 top-3 bottom-3 w-[4px] rounded-full"
              style={{ background: 'linear-gradient(180deg, rgba(168,85,247,0.7), rgba(168,85,247,0.25))' }}
            />
            <p className="text-base leading-[1.6]" style={{ color: 'rgba(240,237,246,0.75)' }}>
              {renderPoint(data.opener.line)}
            </p>
            {data.opener.delivery_note && (
              <p className="mt-2 text-[11px] italic" style={{ color: 'rgba(240,237,246,0.2)' }}>
                {data.opener.delivery_note}
              </p>
            )}
            {copiedIndex === 'opener' && (
              <span className="absolute top-2 right-3 text-[10px] font-medium text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full">
                Copied
              </span>
            )}
          </button>
        </motion.div>
      )}

      {/* Sections */}
      <div className="space-y-10">
        {data.sections.map((section, sIdx) => (
          <motion.div
            key={sIdx}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: sIdx * 0.08 }}
          >
            {/* Section header with duration */}
            <div className="flex items-baseline gap-3 mb-4">
              <p
                className="text-[11px] uppercase tracking-[0.15em] font-medium"
                style={{ color: 'rgba(168,85,247,0.45)' }}
              >
                {section.name}
              </p>
              {section.duration && (
                <span className="text-[11px]" style={{ color: 'rgba(240,237,246,0.2)' }}>
                  ~{section.duration}
                </span>
              )}
            </div>

            {/* Points */}
            <div className="space-y-3">
              {section.points.map((point, pIdx) => {
                const key = `${sIdx}-${pIdx}`;
                const isCopied = copiedIndex === key;
                return (
                  <button
                    key={key}
                    onClick={() => copyPoint(point, key)}
                    className="group w-full text-left relative rounded-xl border transition-all duration-200 p-4 pl-5"
                    style={{
                      borderColor: isCopied ? 'rgba(74,222,128,0.4)' : 'rgba(255,255,255,0.06)',
                      backgroundColor: 'rgba(255,255,255,0.02)',
                    }}
                    onMouseEnter={(e) => {
                      if (!isCopied) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)';
                    }}
                    onMouseLeave={(e) => {
                      if (!isCopied) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
                    }}
                  >
                    <div
                      className="absolute left-0 top-3 bottom-3 w-[3px] rounded-full"
                      style={{ background: 'linear-gradient(180deg, rgba(168,85,247,0.6), rgba(168,85,247,0.15))' }}
                    />
                    <p className="text-sm leading-[1.65]" style={{ color: 'rgba(240,237,246,0.65)' }}>
                      {renderPoint(point)}
                    </p>
                    {isCopied && (
                      <span className="absolute top-2 right-3 text-[10px] font-medium text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full">
                        Copied
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Transition line */}
            {section.transition && sIdx < data.sections.length - 1 && (
              <p
                className="mt-5 text-xs italic pl-4"
                style={{ color: 'rgba(240,237,246,0.25)' }}
              >
                → {section.transition}
              </p>
            )}
          </motion.div>
        ))}
      </div>

      {/* Closer Card */}
      {data.closer.line && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: data.sections.length * 0.08 }}
          className="mt-10"
        >
          <p
            className="text-[10px] uppercase tracking-[0.15em] font-medium mb-3"
            style={{ color: 'rgba(168,85,247,0.55)' }}
          >
            Close with
          </p>
          <button
            onClick={() => copyPoint(data.closer.line, 'closer')}
            className="group w-full text-left relative rounded-xl border transition-all duration-200 p-4 pl-6"
            style={{
              borderColor: copiedIndex === 'closer' ? 'rgba(74,222,128,0.4)' : 'rgba(255,255,255,0.06)',
              backgroundColor: 'rgba(255,255,255,0.02)',
            }}
            onMouseEnter={(e) => {
              if (copiedIndex !== 'closer') e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)';
            }}
            onMouseLeave={(e) => {
              if (copiedIndex !== 'closer') e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
            }}
          >
            <div
              className="absolute left-0 top-3 bottom-3 w-[4px] rounded-full"
              style={{ background: 'linear-gradient(180deg, rgba(168,85,247,0.7), rgba(168,85,247,0.25))' }}
            />
            <p className="text-base leading-[1.6]" style={{ color: 'rgba(240,237,246,0.75)' }}>
              {renderPoint(data.closer.line)}
            </p>
            {data.closer.delivery_note && (
              <p className="mt-2 text-[11px] italic" style={{ color: 'rgba(240,237,246,0.2)' }}>
                {data.closer.delivery_note}
              </p>
            )}
            {copiedIndex === 'closer' && (
              <span className="absolute top-2 right-3 text-[10px] font-medium text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full">
                Copied
              </span>
            )}
          </button>
        </motion.div>
      )}
    </div>
  );
};

export default ScriptViewer;
