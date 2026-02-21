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
        className="group w-full text-left relative rounded-xl border transition-all duration-200 p-3 sm:p-4 pl-4 sm:pl-5 min-h-[44px]"
        style={{
          borderColor: isCopied ? 'rgba(74,222,128,0.4)' : 'rgba(255,255,255,0.06)',
          backgroundColor: 'rgba(255,255,255,0.02)',
          transform: `translateX(${offsetX}px)`,
          transition: startXRef.current !== null ? 'none' : 'transform 0.2s ease-out',
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
          className="text-[13px] sm:text-sm leading-[1.65]"
          style={{ color: 'rgba(240,237,246,0.65)' }}
        >
          {renderPoint(point)}
        </p>

        {/* Copied badge — centered on mobile, top-right on desktop */}
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

  // Migrate old schema (headline/subheadline/bullets) to new (title/context_line/points)
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
      className="max-w-[680px] sm:max-w-[600px] lg:max-w-[680px] mx-auto py-2"
    >
      {/* Copy All button — hidden on mobile (moved to overflow) */}
      <div className="hidden sm:flex justify-end mb-6">
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
      <div className="space-y-8 sm:space-y-10">
        {data.sections.map((section, sIdx) => (
          <motion.div
            key={sIdx}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: sIdx * 0.08 }}
          >
            {/* Section label */}
            <p
              className="text-[10px] sm:text-[11px] uppercase tracking-[0.15em] font-medium mb-3 sm:mb-4"
              style={{ color: 'rgba(168,85,247,0.45)' }}
            >
              {section.title}
            </p>

            {/* Points */}
            <div className="space-y-2 sm:space-y-3">
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
