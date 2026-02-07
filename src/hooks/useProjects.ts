import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Json } from '@/integrations/supabase/types';

export type ProjectStatus = 'draft' | 'complete' | 'shared';

export interface DraftState {
  step: number;
  transcribedText: string;
  parsedContext: Record<string, unknown> | null;
  outputFormat: 'one-pager' | 'script';
  selectedTone: string;
  selectedLength: string;
  highlightNotes: string;
  attachedFileNames: string[];
}

export interface ProjectRecord {
  id: string;
  title: string;
  status: ProjectStatus;
  scenario_description: string | null;
  target_audience: string | null;
  is_published: boolean;
  public_id: string | null;
  draft_state: DraftState | null;
  output_format: string | null;
  output_data: Record<string, unknown> | null;
  created_at: string;
}

export interface ProjectVersion {
  id: string;
  project_id: string;
  version_number: number;
  output_format: string;
  output_data: Record<string, unknown>;
  generation_context: Record<string, unknown> | null;
  created_at: string;
}

export function useProjects() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProjects = useCallback(async () => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('projects')
        .select('id, title, status, scenario_description, target_audience, is_published, public_id, draft_state, output_format, output_data, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setProjects(
        (data || []).map((p) => ({
          ...p,
          status: computeStatus(p),
          draft_state: p.draft_state as unknown as DraftState | null,
          output_data: p.output_data as unknown as Record<string, unknown> | null,
        }))
      );
    } catch (err) {
      console.error('Error fetching projects:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const computeStatus = (p: { is_published: boolean | null; public_id: string | null; output_data: Json | null; status: string | null }): ProjectStatus => {
    if (p.is_published && p.public_id) return 'shared';
    if (p.output_data) return 'complete';
    return 'draft';
  };

  const createProject = useCallback(async (title: string, scenarioDescription?: string): Promise<ProjectRecord | null> => {
    if (!user?.id) return null;

    try {
      const { data, error } = await supabase
        .from('projects')
        .insert({
          title,
          user_id: user.id,
          scenario_description: scenarioDescription || null,
          status: 'draft',
        })
        .select()
        .single();

      if (error) throw error;

      const newProject: ProjectRecord = {
        ...data,
        status: 'draft' as ProjectStatus,
        draft_state: null,
        output_data: null,
      };

      setProjects((prev) => [newProject, ...prev]);
      return newProject;
    } catch (err) {
      console.error('Error creating project:', err);
      toast({ title: 'Failed to create project', variant: 'destructive' });
      return null;
    }
  }, [user?.id, toast]);

  const saveDraftState = useCallback(async (projectId: string, draftState: DraftState) => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from('projects')
        .update({ draft_state: draftState as unknown as Json, status: 'draft' })
        .eq('id', projectId)
        .eq('user_id', user.id);

      if (error) throw error;

      setProjects((prev) =>
        prev.map((p) => (p.id === projectId ? { ...p, draft_state: draftState, status: 'draft' as ProjectStatus } : p))
      );
    } catch (err) {
      console.error('Error saving draft:', err);
    }
  }, [user?.id]);

  const saveProjectOutput = useCallback(async (
    projectId: string,
    outputFormat: string,
    outputData: Record<string, unknown>,
    generationContext?: Record<string, unknown>
  ) => {
    if (!user?.id) return;

    try {
      // Update the project with completed output
      const { error: updateError } = await supabase
        .from('projects')
        .update({
          output_format: outputFormat,
          output_data: outputData as unknown as Json,
          status: 'complete',
          draft_state: null, // Clear draft state on completion
        })
        .eq('id', projectId)
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      // Count existing versions to determine version number
      const { count } = await supabase
        .from('project_versions')
        .select('*', { count: 'exact', head: true })
        .eq('project_id', projectId);

      // Save version snapshot
      const { error: versionError } = await supabase
        .from('project_versions')
        .insert({
          project_id: projectId,
          version_number: (count || 0) + 1,
          output_format: outputFormat,
          output_data: outputData as unknown as Json,
          generation_context: (generationContext || null) as unknown as Json,
        });

      if (versionError) console.error('Error saving version:', versionError);

      setProjects((prev) =>
        prev.map((p) =>
          p.id === projectId
            ? { ...p, output_format: outputFormat, output_data: outputData, status: 'complete' as ProjectStatus, draft_state: null }
            : p
        )
      );
    } catch (err) {
      console.error('Error saving output:', err);
    }
  }, [user?.id]);

  const duplicateProject = useCallback(async (projectId: string): Promise<ProjectRecord | null> => {
    if (!user?.id) return null;

    const original = projects.find((p) => p.id === projectId);
    if (!original) return null;

    try {
      const { data, error } = await supabase
        .from('projects')
        .insert({
          title: `${original.title} (copy)`,
          user_id: user.id,
          scenario_description: original.scenario_description,
          target_audience: original.target_audience,
          status: 'draft',
        })
        .select()
        .single();

      if (error) throw error;

      const newProject: ProjectRecord = {
        ...data,
        status: 'draft' as ProjectStatus,
        draft_state: null,
        output_data: null,
      };

      setProjects((prev) => [newProject, ...prev]);
      toast({ title: 'Project duplicated', description: 'You can modify and regenerate.' });
      return newProject;
    } catch (err) {
      console.error('Error duplicating project:', err);
      toast({ title: 'Failed to duplicate', variant: 'destructive' });
      return null;
    }
  }, [user?.id, projects, toast]);

  const fetchVersions = useCallback(async (projectId: string): Promise<ProjectVersion[]> => {
    try {
      const { data, error } = await supabase
        .from('project_versions')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(3);

      if (error) throw error;

      return (data || []).map((v) => ({
        ...v,
        output_data: v.output_data as unknown as Record<string, unknown>,
        generation_context: v.generation_context as unknown as Record<string, unknown> | null,
      }));
    } catch (err) {
      console.error('Error fetching versions:', err);
      return [];
    }
  }, []);

  const deleteProject = useCallback(async (projectId: string) => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId)
        .eq('user_id', user.id);

      if (error) throw error;

      setProjects((prev) => prev.filter((p) => p.id !== projectId));
      toast({ title: 'Project deleted' });
    } catch (err) {
      console.error('Error deleting project:', err);
      toast({ title: 'Failed to delete', variant: 'destructive' });
    }
  }, [user?.id, toast]);

  return {
    projects,
    isLoading,
    fetchProjects,
    createProject,
    saveDraftState,
    saveProjectOutput,
    duplicateProject,
    fetchVersions,
    deleteProject,
  };
}
