import { Loader2 } from 'lucide-react';
import ProjectCard from '@/components/dashboard/ProjectCard';
import type { ProjectRecord } from '@/hooks/useProjects';
import pitchvoidOrbital from '@/assets/pitchvoid-orbital.png';

interface ProjectsListProps {
  projects: ProjectRecord[];
  isLoading: boolean;
  isFree: boolean;
  onOpen: (project: ProjectRecord) => void;
  onContinueDraft: (project: ProjectRecord) => void;
  onDownloadPDF: (project: ProjectRecord) => void;
  onDelete: (id: string) => void;
}

const ProjectsList = ({ projects, isLoading, isFree, onOpen, onContinueDraft, onDownloadPDF, onDelete }: ProjectsListProps) => {
  return (
    <>
      {/* Separator between prompt and projects */}
      <div className="flex items-center gap-3 mb-6 mt-2">
        <div className="flex-1 h-px bg-border/30" />
        <span className="text-[11px] uppercase tracking-widest text-muted-foreground/30 font-medium">Projects</span>
        <div className="flex-1 h-px bg-border/30" />
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {isLoading ? (
          <div className="col-span-full text-center py-12">
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary mb-2" />
            <p className="text-muted-foreground text-sm">Loading projects...</p>
          </div>
        ) : projects.length === 0 ? (
          <div className="col-span-full text-center py-16">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center bg-gradient-to-br from-accent/15 to-primary/8 border border-dashed border-accent/30">
              <FileText className="w-7 h-7 text-accent/50" />
            </div>
            <p className="text-foreground font-medium mb-1">No pitches yet</p>
            <p className="text-muted-foreground text-sm">Describe your pitch above to get started</p>
          </div>
        ) : (
          projects.map((project) => (
            <ProjectCard
              key={project.id}
              id={project.id}
              title={project.title}
              status={project.status}
              scenarioDescription={project.scenario_description}
              createdAt={project.created_at}
              isPublished={project.is_published}
              outputData={project.output_data}
              onOpen={() => onOpen(project)}
              onContinue={project.status === 'draft' && project.draft_state ? () => onContinueDraft(project) : undefined}
              onDownloadPDF={project.status !== 'draft' && project.output_data ? () => onDownloadPDF(project) : undefined}
              onDelete={() => onDelete(project.id)}
            />
          ))
        )}
      </div>
    </>
  );
};

export default ProjectsList;
