import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Check, Copy, Trash2 } from 'lucide-react';

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
  onDeletePoint?: (sectionIdx: number, pointIdx: number) => void;
}

/** Render markdown **bold** as <strong> — numbers/stats get full white */
const renderPoint = (text: string) => {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      const inner = part.slice(2, -2);
      // If it looks like a stat/number (contains digits, $, %, x), make it pop white
      const isNumeric = /[\d$%x×]/.test(inner);
      return (
        <strong
          key={i}
          style={{
            fontWeight: 700,
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

/** Swipeable point card with delete action */
const SwipeablePointCard = ({
  point,
  isCopied,
  onCopy,
  onDelete,
}: {
  point: string;
  isCopied: boolean;
  onCopy: () => void;
  onDelete?: () => void;
}) => {
  const startXRef = useRef<number | null>(null);
  const [offsetX, setOffsetX] = useState(0);
  const [showDelete, setShowDelete] = useState(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    startXRef.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (startXRef.current === null) return;
    const diff = e.touches[0].clientX - startXRef.current;
    if (diff < 0) {
      setOffsetX(Math.max(diff, -80));
    }
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

  const handleDelete = () => {
    setShowDelete(false);
    setOffsetX(0);
    onDelete?.();
  };

  return (
    <div className="relative overflow-hidden rounded-xl">
      {/* Delete button revealed on swipe */}
      {showDelete && onDelete && (
        <button
          onClick={handleDelete}
          className="absolute right-0 top-0 bottom-0 w-20 bg-destructive flex items-center justify-center z-10 rounded-r-xl"
        >
          <Trash2 className="w-4 h-4 text-destructive-foreground" />
        </button>
      )}

      <button
        onClick={() => { if (!showDelete) onCopy(); }}
        onTouchStart={onDelete ? handleTouchStart : undefined}
        onTouchMove={onDelete ? handleTouchMove : undefined}
        onTouchEnd={onDelete ? handleTouchEnd : undefined}
        className="group w-full text-left relative rounded-xl border transition-all duration-200 min-h-[44px]"
        style={{
          borderColor: isCopied ? 'rgba(74,222,128,0.4)' : 'rgba(240,237,246,0.08)',
          backgroundColor: 'rgba(240,237,246,0.05)',
          padding: '20px 24px 20px 24px',
          transform: `translateX(${offsetX}px)`,
          transition: startXRef.current !== null ? 'none' : 'transform 0.2s ease-out',
        }}
        onMouseEnter={(e) => {
          if (!isCopied) (e.currentTarget.style.borderColor = 'rgba(240,237,246,0.14)');
        }}
        onMouseLeave={(e) => {
          if (!isCopied) (e.currentTarget.style.borderColor = 'rgba(240,237,246,0.08)');
        }}
      >
        {/* Purple left accent bar */}
        <div
          className="absolute left-0 top-4 bottom-4 w-[3px] rounded-full"
          style={{
            background: 'linear-gradient(180deg, rgba(168,85,247,0.6), rgba(168,85,247,0.2))',
          }}
        />

        <p
          className="text-sm sm:text-base leading-[1.7]"
          style={{ color: 'rgba(240,237,246,0.92)' }}
        >
          {renderPoint(point)}
        </p>

        {/* Copied badge */}
        {isCopied && (
          <span className="absolute inset-0 flex items-center justify-center sm:inset-auto sm:top-2 sm:right-3 text-[10px] font-medium text-green-400 bg-green-400/10 sm:bg-green-400/10 px-2 py-0.5 rounded-full pointer-events-none">
            Copied
          </span>
        )}
      </button>
    </div>
  );
};

const OnePager = ({ data: rawData, refineAnimationKey, onDeletePoint }: OnePagerProps) => {
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
      className="max-w-[680px] mx-auto py-2 relative"
    >
      {/* Subtle radial glow behind content */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, hsl(25 75% 65% / 0.04) 0%, transparent 70%)',
        }}
      />

      {/* Copy All button — hidden on mobile */}
      <div className="hidden sm:flex justify-end mb-6 relative z-10">
        <button
          onClick={copyAll}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors"
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

      {/* Sections */}
      <div className="relative z-10" style={{ display: 'flex', flexDirection: 'column', gap: 56 }}>
        {data.sections.map((section, sIdx) => (
          <motion.div
            key={sIdx}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: sIdx * 0.08 }}
          >
            {/* Section label — Level 2 */}
            <p
              className="text-[13px] uppercase tracking-[0.15em] font-medium mb-8"
              style={{ color: 'hsl(25 75% 65% / 0.9)' }}
            >
              {section.title}
            </p>

            {/* Points — Level 1 */}
            <div className="space-y-4">
              {section.points.map((point, pIdx) => {
                const key = `${sIdx}-${pIdx}`;
                const isCopied = copiedIndex === key;
                return (
                  <SwipeablePointCard
                    key={key}
                    point={point}
                    isCopied={isCopied}
                    onCopy={() => copyPoint(point, key)}
                    onDelete={onDeletePoint ? () => onDeletePoint(sIdx, pIdx) : undefined}
                  />
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
