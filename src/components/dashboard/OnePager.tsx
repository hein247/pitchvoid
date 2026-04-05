import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Copy } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import pitchvoidOrbital from '@/assets/pitchvoid-orbital.png';

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
  refined_label?: string;
}

interface OnePagerProps {
  data: OnePagerData;
  projectTitle?: string;
  refineAnimationKey?: number;
  onDeletePoint?: (sectionIdx: number, pointIdx: number) => void;
}

/** Render markdown **bold** as <strong> — numbers/stats get full white */
const renderPoint = (text: string) => {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      const inner = part.slice(2, -2);
      const isNumeric = /[\d$%x×]/.test(inner);
      return (
        <strong
          key={i}
          style={{
            fontWeight: 600,
            color: isNumeric ? 'rgba(255,255,255,1)' : 'rgba(240,237,246,0.92)',
          }}
        >
          {inner}
        </strong>
      );
    }
    return <span key={i}>{part}</span>;
  });
};

const OnePager = ({ data: rawData, refineAnimationKey }: OnePagerProps) => {
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  // Migrate old schema
  const data: OnePagerData = (() => {
    const d = rawData as any;
    if (d.title && d.context_line && Array.isArray(d.sections)) {
      return {
        ...d,
        sections: (d.sections || []).map((s: any) => ({
          title: s.title || '',
          points: s.points || s.bullets || [],
        })),
      };
    }
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
    const clean = point.replace(/\*\*/g, '');
    navigator.clipboard.writeText(clean);
    setCopiedIndex(key);
    toast('Copied to clipboard');
    setTimeout(() => setCopiedIndex(null), 1500);
  };

  const copyAll = () => {
    const text = data.sections
      .map(s => `${s.title}\n${s.points.map(p => `• ${p.replace(/\*\*/g, '')}`).join('\n')}`)
      .join('\n\n');
    navigator.clipboard.writeText(text);
    setCopiedAll(true);
    toast('All points copied');
    setTimeout(() => setCopiedAll(false), 1500);
  };

  return (
    <motion.div
      key={refineAnimationKey}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-[680px] mx-auto py-2 relative"
    >
      {/* Main container card */}
      <div
        className="relative overflow-hidden rounded-[20px] p-7 sm:p-12"
        style={{
          background: 'linear-gradient(180deg, rgba(88,40,180,0.15) 0%, rgba(20,18,26,0.95) 40%, rgba(14,12,20,0.98) 100%)',
          border: '1px solid rgba(168,85,247,0.15)',
        }}
        >
          {/* Orbital watermark */}
          <img
            src={pitchvoidOrbital}
            alt=""
            className="absolute w-[280px] sm:w-[400px] pointer-events-none select-none"
            style={{
              top: '-20px',
              right: '-50px',
              opacity: 0.04,
              transform: 'rotate(15deg)',
            }}
          />

          {/* Title + Copy All row */}
        <div className="flex items-start justify-between gap-4 mb-3 relative z-10">
          <h1
            className="text-[28px] sm:text-[42px] font-normal font-sans"
            style={{
              color: 'rgba(240,237,246,0.95)',
              letterSpacing: '-0.01em',
            }}
          >
            {data.title}
          </h1>
          <button
            onClick={copyAll}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors shrink-0 mt-2"
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

        {/* Context line + Refined tag */}
        <div className="flex items-center gap-3 flex-wrap">
          <p
            className="text-[13px] font-sans"
            style={{ color: 'rgba(240,237,246,0.4)' }}
          >
            {data.context_line}
          </p>
          {data.refined_label && (
            <span
              className="text-xs font-sans shrink-0"
              style={{
                background: 'rgba(168,85,247,0.15)',
                border: '1px solid rgba(168,85,247,0.3)',
                color: 'rgba(168,85,247,0.8)',
                borderRadius: '20px',
                padding: '4px 12px',
              }}
            >
              {data.refined_label}
            </span>
          )}
        </div>

        {/* Divider */}
        <div
          className="my-4 sm:my-0"
          style={{
            height: '1px',
            background: 'rgba(168,85,247,0.2)',
            margin: '16px 0 28px 0',
          }}
        />

        {/* Sections */}
        <div className="flex flex-col gap-7 sm:gap-9">
          {data.sections.map((section, sIdx) => (
            <motion.div
              key={sIdx}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: sIdx * 0.08 }}
            >
              {/* Section label */}
              <p
                className="text-[13px] uppercase tracking-[0.15em] font-medium mb-4 font-sans"
                style={{ color: 'rgba(168,85,247,0.7)' }}
              >
                {section.title}
              </p>

              {/* Points */}
              <div className="flex flex-col gap-4">
                {section.points.map((point, pIdx) => {
                  const key = `${sIdx}-${pIdx}`;
                  const isCopied = copiedIndex === key;
                  return (
                    <button
                      key={key}
                      onClick={() => copyPoint(point, key)}
                      className="flex items-start gap-3.5 text-left w-full cursor-pointer relative group"
                    >
                      {/* Purple bullet dot */}
                      <div
                        className="w-1.5 h-1.5 rounded-full shrink-0 mt-[9px]"
                        style={{ background: 'rgba(168,85,247,0.6)' }}
                      />
                      <p
                        className="text-sm sm:text-base leading-[1.7] font-sans font-normal"
                        style={{ color: 'rgba(240,237,246,0.85)' }}
                      >
                        {renderPoint(point)}
                      </p>
                      {isCopied && (
                        <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-medium text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full pointer-events-none whitespace-nowrap">
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
      </div>
    </motion.div>
  );
};

export default OnePager;
