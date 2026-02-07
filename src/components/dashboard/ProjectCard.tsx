import { useState } from 'react';
import { motion } from 'framer-motion';
import { Copy, Trash2, ArrowRight, Globe, FileEdit, CheckCircle2, MoreVertical } from 'lucide-react';
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

const ProjectCard = ({
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="project-card p-4 sm:p-5 group relative"
    >
      {/* Top row: status + menu */}
      <div className="flex items-start justify-between mb-3">
        <Badge variant={config.variant} className="text-[10px] gap-1">
          <StatusIcon className="w-3 h-3" />
          {config.label}
        </Badge>

        <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
          <DropdownMenuTrigger asChild>
            <button
              className="p-1 rounded-md opacity-0 group-hover:opacity-100 focus:opacity-100 hover:bg-accent/10 transition-all"
              aria-label="Project actions"
            >
              <MoreVertical className="w-4 h-4 text-muted-foreground" />
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

      {/* Title */}
      <button onClick={onOpen} className="text-left w-full">
        <h3 className="text-foreground font-medium text-base sm:text-lg mb-1.5 group-hover:text-primary transition-colors line-clamp-2">
          {title}
        </h3>
        {scenarioDescription && (
          <p className="text-muted-foreground text-xs line-clamp-2 mb-3">{scenarioDescription}</p>
        )}
      </button>

      {/* Footer */}
      <div className="flex items-center justify-between mt-auto pt-3 border-t border-border/50">
        <span className="text-xs text-muted-foreground">{timeAgo}</span>

        {status === 'draft' && onContinue ? (
          <button
            onClick={onContinue}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
          >
            Continue
            <ArrowRight className="w-3 h-3" />
          </button>
        ) : (
          <button
            onClick={onOpen}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-accent/10 transition-colors"
          >
            Open
            <ArrowRight className="w-3 h-3" />
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
