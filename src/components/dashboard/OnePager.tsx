import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Copy } from 'lucide-react';

export interface OnePagerSection {
  title: string;
  points: string[];
}

export interface OnePagerData {
  title: string;
  context_line: string;
  sections: OnePagerSection[];
  generated_at?: string;
  format?: string;
  version?: number;
}

interface OnePagerProps {
  data: OnePagerData;
  projectTitle?: string;
  refineAnimationKey?: number;
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

const OnePager = ({ data: rawData, refineAnimationKey }: OnePagerProps) => {
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  // Migrate old schema (headline/subheadline/bullets) to new (title/context_line/points)
  const data: OnePagerData = (() => {
    const d = rawData as any;
    if (d.title && d.context_line && Array.isArray(d.sections)) {
      // New schema — ensure points arrays exist
      return {
        ...d,
        sections: (d.sections || []).map((s: any) => ({
          title: s.title || '',
          points: s.points || s.bullets || [],
        })),
      };
    }
    // Old schema migration
    return {
      title: d.headline || d.title || 'Untitled',
      context_line: d.subheadline || d.context_line || '',
      sections: (d.sections || []).map((s: any) => ({
        title: s.title || '',
        points: s.points || s.bullets || (s.content ? [s.content] : []),
      })),
    };
  })();

  const copyPoint = (point: string, key: string) => {
    // Strip markdown bold for clipboard
    const clean = point.replace(/\*\*/g, '');
    navigator.clipboard.writeText(clean);
    setCopiedIndex(key);
    setTimeout(() => setCopiedIndex(null), 1500);
  };

  const copyAll = () => {
    const text = data.sections
      .map(s => `${s.title}\n${s.points.map(p => `• ${p.replace(/\*\*/g, '')}`).join('\n')}`)
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
      className="max-w-[680px] mx-auto py-2"
    >
      {/* Context line */}
      {data.context_line && (
        <p className="text-xs mb-8" style={{ color: 'rgba(240,237,246,0.25)' }}>
          {data.context_line}
        </p>
      )}

      {/* Copy All button */}
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

      {/* Sections */}
      <div className="space-y-10">
        {data.sections.map((section, sIdx) => (
          <motion.div
            key={sIdx}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: sIdx * 0.08 }}
          >
            {/* Section label */}
            <p
              className="text-[11px] uppercase tracking-[0.15em] font-medium mb-4"
              style={{ color: 'rgba(168,85,247,0.45)' }}
            >
              {section.title}
            </p>

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
                      if (!isCopied) (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)');
                    }}
                    onMouseLeave={(e) => {
                      if (!isCopied) (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)');
                    }}
                  >
                    {/* Purple left accent bar */}
                    <div
                      className="absolute left-0 top-3 bottom-3 w-[3px] rounded-full"
                      style={{
                        background: 'linear-gradient(180deg, rgba(168,85,247,0.6), rgba(168,85,247,0.15))',
                      }}
                    />

                    <p
                      className="text-sm leading-[1.65]"
                      style={{ color: 'rgba(240,237,246,0.65)' }}
                    >
                      {renderPoint(point)}
                    </p>

                    {/* Copied badge */}
                    {isCopied && (
                      <span className="absolute top-2 right-3 text-[10px] font-medium text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full">
                        Copied
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default OnePager;
