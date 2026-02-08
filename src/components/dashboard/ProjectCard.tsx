import { useState } from 'react';
import { motion } from 'framer-motion';
import { Copy, Trash2, ArrowRight, Globe, FileEdit, CheckCircle2, MoreVertical, FileText, ScrollText, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { ProjectStatus } from '@/hooks/useProjects';

interface ProjectCardProps {
  id: string;
  title: string;
  status: ProjectStatus;
  scenarioDescription?: string | null;
  createdAt: string;
  isPublished: boolean;
  onOpen: () => void;
  onContinue?: () => void;
  onDuplicate?: () => void;
  onDelete?: () => void;
}

const statusConfig: Record<ProjectStatus, { label: string; icon: typeof FileEdit; variant: 'default' | 'secondary' | 'outline' }> = {
  draft: { label: 'Draft', icon: FileEdit, variant: 'outline' },
  complete: { label: 'Complete', icon: CheckCircle2, variant: 'secondary' },
  shared: { label: 'Shared', icon: Globe, variant: 'default' },
};

// Deterministic gradient based on card id
const gradientVariants = [
  'from-primary/30 via-accent/20 to-transparent',
  'from-accent/30 via-primary/15 to-transparent',
  'from-primary/20 via-secondary/25 to-transparent',
];

const ProjectCard = ({
  id,
  title,
  status,
  scenarioDescription,
  createdAt,
  isPublished,
  onOpen,
  onContinue,
  onDuplicate,
  onDelete,
}: ProjectCardProps) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const config = statusConfig[status];
  const StatusIcon = config.icon;
  const timeAgo = getTimeAgo(createdAt);

  // Pick gradient based on id hash
  const gradientIndex = id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % gradientVariants.length;
  const gradient = gradientVariants[gradientIndex];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3 }}
      className="group relative rounded-2xl overflow-hidden border border-border/60 bg-card/80 backdrop-blur-sm hover:border-primary/40 hover:shadow-[0_16px_48px_rgba(200,150,100,0.08)] transition-all duration-400"
    >
      {/* Thumbnail area */}
      <button onClick={onOpen} className="block w-full">
        <div className={`relative w-full aspect-[16/10] bg-gradient-to-br ${gradient} overflow-hidden`}>
          {/* Decorative icon */}
          <div className="absolute inset-0 flex items-center justify-center">
            {status === 'complete' ? (
              <FileText className="w-10 h-10 text-foreground/10" />
            ) : status === 'shared' ? (
              <Globe className="w-10 h-10 text-foreground/10" />
            ) : (
              <Sparkles className="w-10 h-10 text-foreground/10" />
            )}
          </div>
          {/* Noise grain overlay */}
          <div className="absolute inset-0 grain-bg opacity-40" />
          {/* Status badge overlay */}
          <div className="absolute top-3 left-3">
            <Badge variant={config.variant} className="text-[10px] gap-1 backdrop-blur-sm">
              <StatusIcon className="w-3 h-3" />
              {config.label}
            </Badge>
          </div>
          {/* Menu overlay */}
          <div className="absolute top-3 right-3" onClick={e => e.stopPropagation()}>
            <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
              <DropdownMenuTrigger asChild>
                <button
                  className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 focus:opacity-100 bg-background/40 backdrop-blur-sm hover:bg-background/60 transition-all"
                  aria-label="Project actions"
                >
                  <MoreVertical className="w-3.5 h-3.5 text-foreground/70" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                {status !== 'draft' && onDuplicate && (
                  <DropdownMenuItem onClick={onDuplicate}>
                    <Copy className="w-4 h-4 mr-2" />
                    Duplicate
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <>
                    <DropdownMenuSeparator />
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
      </button>

      {/* Content area */}
      <div className="p-4 sm:p-5 space-y-4">
        {/* Title + Description + Time */}
        <button onClick={onOpen} className="text-left w-full space-y-1.5">
          <h3 className="text-foreground font-semibold text-base sm:text-lg group-hover:text-primary transition-colors truncate font-display">
            {title}
          </h3>
          {scenarioDescription && (
            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
              {scenarioDescription}
            </p>
          )}
          <span className="text-[11px] text-muted-foreground/60 block">{timeAgo}</span>
        </button>

        {/* CTA Button */}
        {status === 'draft' && onContinue ? (
          <button
            onClick={onContinue}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium border border-primary/30 bg-primary/5 text-primary hover:bg-primary/10 hover:border-primary/50 backdrop-blur-sm transition-all"
          >
            Continue
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        ) : (
          <button
            onClick={onOpen}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm border border-border/60 bg-background/30 text-muted-foreground hover:text-foreground hover:border-border hover:bg-background/50 backdrop-blur-sm transition-all"
          >
            Open
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </motion.div>
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
