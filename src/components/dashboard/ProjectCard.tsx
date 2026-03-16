import { useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Download, Trash2, MoreVertical, FileText, ScrollText } from 'lucide-react';
import { GlowingEffect } from '@/components/ui/glowing-effect';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { ProjectStatus } from '@/hooks/useProjects';
import { useIsMobile } from '@/hooks/use-mobile';

interface ProjectCardProps {
  id: string;
  title: string;
  status: ProjectStatus;
  scenarioDescription?: string | null;
  createdAt: string;
  isPublished: boolean;
  outputData?: Record<string, unknown> | null;
  onOpen: () => void;
  onContinue?: () => void;
  onDownloadPDF?: () => void;
  onDelete?: () => void;
}

const ProjectCard = ({
  id,
  title,
  status,
  scenarioDescription,
  createdAt,
  isPublished,
  outputData,
  onOpen,
  onContinue,
  onDownloadPDF,
  onDelete,
}: ProjectCardProps) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const isMobile = useIsMobile();
  const reduceMotion = useReducedMotion();
  const enableMotion = useMemo(() => !isMobile && !reduceMotion, [isMobile, reduceMotion]);

  const timeAgo = getTimeAgo(createdAt);

  // Pull AI-generated title from output data
  const aiTitle =
    (outputData?.onePager as any)?.title ||
    (outputData?.script as any)?.title ||
    null;
  const displayTitle = aiTitle || title;

  // Determine which formats have been generated
  const hasOnePager = !!(outputData?.onePager);
  const hasScript = !!(outputData?.script);

  return (
    <div className="group/glow relative rounded-[10px]">
      <GlowingEffect
        spread={40}
        glow={!isMobile}
        disabled={isMobile}
        proximity={64}
        inactiveZone={0.01}
        borderWidth={2}
      />
      <motion.button
        onClick={status === 'draft' && onContinue ? onContinue : onOpen}
        initial={enableMotion ? { opacity: 0, y: 8 } : false}
        animate={enableMotion ? { opacity: 1, y: 0 } : undefined}
        whileHover={enableMotion ? { y: -2 } : undefined}
        transition={enableMotion ? { duration: 0.25 } : undefined}
        className={`relative w-full text-left rounded-[10px] border border-border/50 bg-[hsl(260_20%_8%/0.85)] backdrop-blur-sm hover:border-[hsl(270_60%_60%/0.3)] hover:bg-[hsl(260_20%_10%/0.9)] transition-all ${enableMotion ? 'duration-200 hover:transform-gpu hover:will-change-transform' : 'duration-150'} p-4 sm:p-5 cursor-pointer`}
      >
      {/* Title */}
      <h3 className="text-[15px] font-semibold text-white/90 group-hover/glow:text-primary transition-colors truncate font-display leading-snug">
        {displayTitle}
      </h3>

      {/* Description */}
      {scenarioDescription && (
        <p className="mt-1.5 text-xs text-white/50 line-clamp-2 leading-relaxed">
          {scenarioDescription}
        </p>
      )}

      {/* Bottom row: format pills + timestamp + menu */}
      <div className="mt-3 flex items-center gap-2">
        {/* Format pills */}
        {hasOnePager && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-accent/10 border border-accent/20 text-[10px] text-white/60">
            <FileText className="w-2.5 h-2.5" />
            One-Pager
          </span>
        )}
        {hasScript && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary/10 border border-primary/20 text-[10px] text-white/60">
            <ScrollText className="w-2.5 h-2.5" />
            Script
          </span>
        )}
        {status === 'draft' && !hasOnePager && !hasScript && (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-muted/30 border border-border/40 text-[10px] text-white/40">
            Draft
          </span>
        )}

        {/* Spacer */}
        <span className="flex-1" />

        {/* Timestamp */}
        <span className="text-[11px] text-white/35 flex-shrink-0">{timeAgo}</span>

        {/* Overflow menu */}
        <div onClick={e => e.stopPropagation()}>
          <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
            <DropdownMenuTrigger asChild>
              <button
                className="p-1 rounded-md opacity-0 group-hover/glow:opacity-100 focus:opacity-100 hover:bg-accent/10 transition-all"
                aria-label="Project actions"
              >
                <MoreVertical className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40 bg-popover border-border z-50">
              {status !== 'draft' && onDownloadPDF && (
                <DropdownMenuItem onClick={onDownloadPDF}>
                  <Download className="w-4 h-4 mr-2" />
                  Download PDF
                </DropdownMenuItem>
              )}
              {onDelete && (
                <>
                  {status !== 'draft' && onDownloadPDF && <DropdownMenuSeparator />}
                  <DropdownMenuItem onClick={onDelete} className="text-destructive focus:text-destructive">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      </motion.button>
    </div>
  );
};

function getTimeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export default ProjectCard;
