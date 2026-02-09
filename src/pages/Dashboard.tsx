import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Mic, Plus, ArrowLeft, X, Play, Share2, Home, FileText, Upload, File, Image, ScrollText, Check, Edit2, Users, Target, Sparkles, Clock, Briefcase, Handshake, TrendingUp, Presentation } from 'lucide-react';
import ShareModal from '@/components/dashboard/ShareModal';
import { Progress } from '@/components/ui/progress';
import Navbar from '@/components/Navbar';
import RefinementPanel from '@/components/dashboard/RefinementPanel';
import OnePager, { OnePagerData } from '@/components/dashboard/OnePager';
import OnePagerEditor from '@/components/dashboard/OnePagerEditor';
import MobileEditorSheet from '@/components/dashboard/MobileEditorSheet';
import ScriptViewer, { ScriptData } from '@/components/dashboard/ScriptViewer';
import FormatToggle from '@/components/dashboard/FormatToggle';
import { usePricing } from '@/hooks/usePricing';
import { PaywallModal } from '@/components/pricing/PaywallModal';
import { UpgradeNudge } from '@/components/pricing/UpgradeNudge';
import TypewriterText from '@/components/ui/TypewriterText';
import { useIsMobile } from '@/hooks/use-mobile';
import GenerationError from '@/components/dashboard/GenerationError';
import GenerationSkeleton from '@/components/dashboard/GenerationSkeleton';
import PitchUsageBanner from '@/components/dashboard/PitchUsageBanner';
import ProjectCard from '@/components/dashboard/ProjectCard';
import VersionHistoryDropdown from '@/components/dashboard/VersionHistoryDropdown';
import { useProjects, type ProjectRecord, type DraftState } from '@/hooks/useProjects';
import { validateFiles, FILE_UPLOAD_CONFIG, formatFileSize as formatFileSizeUtil } from '@/lib/fileValidation';

type OutputFormat = 'one-pager' | 'script';

interface ParsedContext {
  audience: string;
  audience_detail: string;
  subject: string;
  subject_detail: string;
  goal: string;
  tone: string;
  urgency: string;
  suggested_format: OutputFormat;
  suggested_length: 'quick' | 'standard' | 'detailed';
  clarifying_questions: string[];
  summary: string;
}

// Project interface is now from useProjects hook

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant' | 'system';
  content: string;
  files?: { name: string; size: number }[];
}

const Dashboard = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  
  // Pricing & paywall state
  const {
    userPlan,
    pitchCount,
    remainingPitches,
    nudgeMessage,
    showNudge,
    dismissNudge,
    checkAndTriggerPaywall,
    incrementPitchCount,
    showPaywall,
    paywallType,
    paywallMessage,
    setShowPaywall,
    isFree,
    planLimits,
  } = usePricing();
  
  // Projects hook
  const {
    projects,
    isLoading: projectsLoading,
    createProject,
    saveDraftState,
    saveProjectOutput,
    duplicateProject,
    fetchVersions,
    deleteProject,
  } = useProjects();
  
  // Dashboard state
  const [currentView, setCurrentView] = useState<'dashboard' | 'project'>('dashboard');
  const [activeProject, setActiveProject] = useState<ProjectRecord | null>(null);
  const [activeVersionId, setActiveVersionId] = useState<string | undefined>(undefined);
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [showQuickPitch, setShowQuickPitch] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  
  // Form state
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectTags, setNewProjectTags] = useState('');
  
  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationPhase, setGenerationPhase] = useState('');
  
  // Output format state
  const [outputFormat, setOutputFormat] = useState<OutputFormat>('one-pager');
  const [onePagerData, setOnePagerData] = useState<OnePagerData | null>(null);
  const [scriptData, setScriptData] = useState<ScriptData | null>(null);
  const [isRegenerating, setIsRegenerating] = useState(false);
  
  // Generation error state
  const [generationError, setGenerationError] = useState<{
    error: string;
    errorType: 'rate_limit' | 'credits' | 'network' | 'generic';
    retryCount: number;
  } | null>(null);
  
  // Store last generation context for regenerating in different formats
  const [lastGenerationContext, setLastGenerationContext] = useState<{
    scenario: string;
    targetAudience: string;
    tone: string;
    length: string;
    documentContext?: string;
    imageDescriptions?: string[];
  } | null>(null);
  
  // Quick pitch state - 4 steps: 1=Describe, 2=Context, 3=Tune, 4=Generate
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [transcribedText, setTranscribedText] = useState('');
  const [quickPitchStep, setQuickPitchStep] = useState(1);
  const [parsedContext, setParsedContext] = useState<ParsedContext | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  
  // Tune preferences
  const [selectedLength, setSelectedLength] = useState<'quick' | 'standard' | 'detailed'>('standard');
  const [selectedTone, setSelectedTone] = useState<'confident' | 'humble' | 'balanced' | 'bold'>('balanced');
  const [highlightNotes, setHighlightNotes] = useState('');
  
  // File attachment state
  interface AttachedFile {
    id: string;
    file: File;
    name: string;
    size: number;
    type: string;
    content?: string;
    progress: number;
  }
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessingFiles, setIsProcessingFiles] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Practice mode
  const [isPracticeMode, setIsPracticeMode] = useState(false);
  const [practiceSection, setPracticeSection] = useState(0);
  const [practiceTimer, setPracticeTimer] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Share modal - generate real URL based on active project
  const shareUrl = activeProject 
    ? `https://pitchvoid.lovable.app/p/${activeProject.public_id || activeProject.id}` 
    : 'https://pitchvoid.lovable.app/p/demo';
  
  // Credits
  const credits = { used: 48, total: 50 };
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const quickTemplates = [
    { id: 1, label: 'Job Interview', icon: 'briefcase' as const, prefill: 'Pitch me for a [Role] at [Company]. Focus on [Key Skills].' },
    { id: 2, label: 'Client Pitch', icon: 'handshake' as const, prefill: 'Create a proposal for [Client] about [Project].' },
    { id: 3, label: 'Team Update', icon: 'trending-up' as const, prefill: 'Create an update for [Team] about [Project/Initiative].' },
    { id: 4, label: 'Conference Talk', icon: 'presentation' as const, prefill: 'Prepare a talk on [Topic] for [Event].' },
  ];

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isGenerating]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime(prev => {
          if (prev >= 60) {
            setIsRecording(false);
            return 60;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && isPracticeMode) {
      interval = setInterval(() => setPracticeTimer(prev => prev + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, isPracticeMode]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showQuickPitch) autoSaveDraft();
        setShowQuickPitch(false);
        setShowShareModal(false);
        setShowNewProjectModal(false);
        if (isPracticeMode) {
          setIsPracticeMode(false);
          setIsPlaying(false);
        }
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowQuickPitch(true);
      }
      if (isPracticeMode && scriptData) {
        const totalSections = scriptData.sections.length;
        if (e.key === 'ArrowRight') setPracticeSection(prev => Math.min(totalSections - 1, prev + 1));
        if (e.key === 'ArrowLeft') setPracticeSection(prev => Math.max(0, prev - 1));
        if (e.key === ' ') { e.preventDefault(); setIsPlaying(prev => !prev); }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPracticeMode, scriptData]);

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  const handleCreateProject = async () => {
    if (newProjectName.trim()) {
      const newProject = await createProject(newProjectName, newProjectTags || undefined);
      setNewProjectName('');
      setNewProjectTags('');
      setShowNewProjectModal(false);
      if (newProject) openProject(newProject);
    }
  };

  const openProject = (project: ProjectRecord) => {
    setActiveProject(project);
    setActiveVersionId(undefined);
    
    // If project has output, restore it
    if (project.output_data) {
      const outputData = project.output_data;
      if (project.output_format === 'script' && outputData.script) {
        setScriptData(outputData.script as unknown as ScriptData);
        setOnePagerData(null);
        setOutputFormat('script');
      } else if (outputData.onePager) {
        setOnePagerData(outputData.onePager as unknown as OnePagerData);
        setScriptData(null);
        setOutputFormat('one-pager');
      }
      setMessages([{ id: '1', type: 'system', content: `Opened "${project.title}".` }]);
    } else {
      setOnePagerData(null);
      setScriptData(null);
      setMessages([{ id: '1', type: 'system', content: `Welcome to "${project.title}". Describe your scenario to get started.` }]);
    }
    setCurrentView('project');
  };

  const handleContinueDraft = (project: ProjectRecord) => {
    if (project.draft_state) {
      const ds = project.draft_state;
      setTranscribedText(ds.transcribedText || '');
      setParsedContext(ds.parsedContext as unknown as ParsedContext | null);
      setOutputFormat(ds.outputFormat || 'one-pager');
      setSelectedTone((ds.selectedTone as 'confident' | 'humble' | 'balanced' | 'bold') || 'balanced');
      setSelectedLength((ds.selectedLength as 'quick' | 'standard' | 'detailed') || 'standard');
      setHighlightNotes(ds.highlightNotes || '');
      setQuickPitchStep(ds.step || 1);
      setActiveProject(project);
      setShowQuickPitch(true);
    } else {
      openProject(project);
    }
  };

  // Auto-save draft state when user exits quick pitch mid-flow
  const autoSaveDraft = useCallback(() => {
    if (!activeProject || quickPitchStep < 1 || quickPitchStep >= 5) return;
    if (!transcribedText.trim()) return;

    const draftState: DraftState = {
      step: quickPitchStep,
      transcribedText,
      parsedContext: parsedContext as unknown as Record<string, unknown> | null,
      outputFormat,
      selectedTone,
      selectedLength,
      highlightNotes,
      attachedFileNames: attachedFiles.map(f => f.name),
    };

    saveDraftState(activeProject.id, draftState);
  }, [activeProject, quickPitchStep, transcribedText, parsedContext, outputFormat, selectedTone, selectedLength, highlightNotes, attachedFiles, saveDraftState]);

  const handleSubmit = () => {
    if (!inputValue.trim()) return;
    setMessages(prev => [...prev, { id: Date.now().toString(), type: 'user', content: inputValue }]);
    setInputValue('');
    setIsGenerating(true);
    
    const phases = ['Analyzing...', 'Crafting narrative...', 'Building content...', 'Finalizing...'];
    let delay = 0;
    phases.forEach(phase => { 
      setTimeout(() => setGenerationPhase(phase), delay); 
      delay += 1500; 
    });
    
    setTimeout(() => {
      setIsGenerating(false);
      setGenerationPhase('');
      setMessages(prev => [...prev, { id: Date.now().toString(), type: 'assistant', content: 'Your pitch has been updated!' }]);
    }, delay);
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    setTimeout(() => {
      setTranscribedText("Pitch me for a Senior Product Manager role at Google. Focus on my experience scaling mobile apps.");
    }, 1000);
  };

  // Parse user input with AI to understand context
  const handleParseInput = async () => {
    if (!transcribedText.trim()) return;
    
    setIsParsing(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('parse-pitch-input', {
        body: { userInput: transcribedText },
      });

      if (error) throw error;

      const parsed = data.parsedContext as ParsedContext;
      setParsedContext(parsed);
      setOutputFormat(parsed.suggested_format);
      setSelectedLength(parsed.suggested_length);
      setSelectedTone(parsed.tone as 'confident' | 'humble' | 'balanced' | 'bold' || 'balanced');
      
      // Create project early so auto-save works
      if (!activeProject) {
        const newProject = await createProject(parsed.summary || 'Quick Pitch', transcribedText);
        if (newProject) setActiveProject(newProject);
      }
      
      setQuickPitchStep(2); // Move to confirmation step
    } catch (error) {
      console.error('Parse error:', error);
      toast({ 
        title: 'Could not parse input', 
        description: 'Moving forward with defaults', 
        variant: 'destructive' 
      });
      // Fallback - set defaults and continue
      setParsedContext({
        audience: 'Decision makers',
        audience_detail: '',
        subject: 'Your pitch',
        subject_detail: transcribedText,
        goal: 'Persuade',
        tone: 'confident',
        urgency: 'not specified',
        suggested_format: 'one-pager',
        suggested_length: 'standard',
        clarifying_questions: [],
        summary: transcribedText
      });
      setQuickPitchStep(2);
    } finally {
      setIsParsing(false);
    }
  };

  // File upload handlers
  const MAX_FILES = FILE_UPLOAD_CONFIG.maxFiles;
  const ACCEPTED_TYPES_LIST = Object.keys(FILE_UPLOAD_CONFIG.acceptedTypes);
  
  const formatFileSize = formatFileSizeUtil;

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return Image;
    return File;
  };

  const processFile = async (file: File): Promise<string | undefined> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (file.type.startsWith('image/')) {
          resolve(reader.result as string);
        } else {
          resolve(`Document: ${file.name} (${formatFileSize(file.size)})`);
        }
      };
      reader.onerror = () => resolve(undefined);
      
      if (file.type.startsWith('image/')) {
        reader.readAsDataURL(file);
      } else {
        reader.readAsText(file);
      }
    });
  };

  const handleFileSelect = async (files: FileList | null) => {
    if (!files) return;
    
    const fileArray = Array.from(files);
    const { validFiles, errors, overLimit } = validateFiles(fileArray, attachedFiles.length);

    // Show each validation error as a toast
    for (const err of errors) {
      toast({ title: 'File rejected', description: err.message, variant: 'destructive' });
    }

    if (overLimit) {
      toast({ title: 'Too many files', description: `Maximum ${FILE_UPLOAD_CONFIG.maxFiles} files allowed`, variant: 'destructive' });
      return;
    }

    if (validFiles.length === 0) return;

    setIsProcessingFiles(true);
    
    for (const file of validFiles) {
      const newFile: AttachedFile = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        file,
        name: file.name,
        size: file.size,
        type: file.type,
        progress: 0,
      };
      
      setAttachedFiles(prev => [...prev, newFile]);
      
      const content = await processFile(file);
      
      setAttachedFiles(prev => 
        prev.map(f => f.id === newFile.id ? { ...f, content, progress: 100 } : f)
      );
    }
    
    setIsProcessingFiles(false);
  };

  const handleRemoveFile = (id: string) => {
    setAttachedFiles(prev => prev.filter(f => f.id !== id));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleQuickGenerate = async () => {
    // Check paywall before generating
    if (!checkAndTriggerPaywall('create_pitch')) {
      return;
    }
    
    // Check format permission
    if (!checkAndTriggerPaywall('use_format', { format: outputFormat })) {
      return;
    }
    
    setQuickPitchStep(5); // Generation step
    setIsGenerating(true);
    setGenerationError(null);
    
    const phasesByFormat: Record<OutputFormat, string[]> = {
      'one-pager': ['Understanding your pitch...', 'Analyzing materials...', 'Crafting narrative...', 'Building one-pager...', 'Finalizing...'],
      'script': ['Understanding your pitch...', 'Analyzing materials...', 'Writing script...', 'Adding delivery cues...', 'Finalizing...']
    };
    
    const phases = phasesByFormat[outputFormat];
    
    let phaseIndex = 0;
    const phaseInterval = setInterval(() => {
      if (phaseIndex < phases.length) { 
        setGenerationPhase(phases[phaseIndex]); 
        phaseIndex++; 
      }
    }, 1200);

    // Prepare file context for AI
    const documentContext = [
      ...(attachedFiles
        .filter(f => !f.type.startsWith('image/'))
        .map(f => f.content || `File: ${f.name}`)),
      highlightNotes ? `User highlights: ${highlightNotes}` : ''
    ].filter(Boolean).join('\n');
    
    const imageDescriptions = attachedFiles
      .filter(f => f.type.startsWith('image/'))
      .map(f => `Uploaded image: ${f.name}`);

    const targetAudience = parsedContext?.audience_detail || parsedContext?.audience || 'Decision makers';

    // Store context for later regeneration in different formats
    setLastGenerationContext({
      scenario: transcribedText,
      targetAudience,
      tone: selectedTone,
      length: selectedLength,
      documentContext: documentContext || undefined,
      imageDescriptions: imageDescriptions.length > 0 ? imageDescriptions : undefined,
    });

    try {
      let functionName: string;
      let body: Record<string, unknown>;

      if (outputFormat === 'script') {
        functionName = 'generate-script';
        body = {
          scenario: transcribedText,
          targetAudience,
          tone: selectedTone,
          length: selectedLength,
          documentContext: documentContext || undefined,
          imageDescriptions: imageDescriptions.length > 0 ? imageDescriptions : undefined,
        };
      } else {
        functionName = 'generate-one-pager';
        body = {
          scenario: transcribedText,
          targetAudience,
          visualStyle: selectedTone,
          documentContext: documentContext || undefined,
          imageDescriptions: imageDescriptions.length > 0 ? imageDescriptions : undefined,
        };
      }
      
      const { data, error } = await supabase.functions.invoke(functionName, { body });

      clearInterval(phaseInterval);

      if (error) throw error;

      setIsGenerating(false);
      setShowQuickPitch(false);
      setCurrentView('project');

      // Create or update project in DB
      const projectTitle = (parsedContext?.summary || 'Quick Pitch').split(/\s+/).slice(0, 5).join(' ');
      let project = activeProject;
      
      if (!project || project.status === 'draft') {
        // Create new project if none exists
        if (!project) {
          project = await createProject(projectTitle, transcribedText);
        }
      }

      const outputPayload: Record<string, unknown> = {};
      if (outputFormat === 'one-pager') {
        setOnePagerData(data.onePager);
        setScriptData(null);
        setMessages([{ id: '1', type: 'system', content: 'Your one-pager is ready!' }]);
        outputPayload.onePager = data.onePager;
      } else {
        setScriptData(data.script);
        setOnePagerData(null);
        setMessages([{ id: '1', type: 'system', content: `Your script is ready! ${data.script?.sections?.length || 5} sections created.` }]);
        outputPayload.script = data.script;
      }

      if (project) {
        setActiveProject({ ...project, title: projectTitle, status: 'complete', output_format: outputFormat, output_data: outputPayload });
        // Save to DB and create version
        await saveProjectOutput(project.id, outputFormat, outputPayload, lastGenerationContext as unknown as Record<string, unknown>);
      }
      
      // Increment pitch count on successful generation
      await incrementPitchCount();
      
      // Reset Quick Pitch state
      resetQuickPitchState();
      
    } catch (error: any) {
      clearInterval(phaseInterval);
      console.error('Generation error:', error);
      setIsGenerating(false);
      
      // Determine error type from the error response
      let errorType: 'rate_limit' | 'credits' | 'network' | 'generic' = 'generic';
      let errorMessage = 'Generation failed. Please try again.';
      
      const errorBody = typeof error?.message === 'string' ? error.message : '';
      const errorContext = typeof error?.context?.body === 'string' ? error.context.body : '';
      const combinedError = `${errorBody} ${errorContext}`.toLowerCase();
      
      if (combinedError.includes('rate limit') || combinedError.includes('429')) {
        errorType = 'rate_limit';
        errorMessage = 'You\'re sending requests too quickly. Please wait a moment before trying again.';
      } else if (combinedError.includes('credits') || combinedError.includes('402')) {
        errorType = 'credits';
        errorMessage = 'AI credits have been exhausted. Please add credits or upgrade your plan.';
      } else if (combinedError.includes('fetch') || combinedError.includes('network') || combinedError.includes('timeout')) {
        errorType = 'network';
        errorMessage = 'Couldn\'t reach the server. Check your connection and try again.';
      }
      
      setGenerationError({
        error: errorMessage,
        errorType,
        retryCount: (generationError?.retryCount || 0) + 1,
      });
      
      // Stay on step 5 to show the error UI
      setQuickPitchStep(5);
    }
  };

  const resetQuickPitchState = () => {
    setQuickPitchStep(1);
    setTranscribedText('');
    setParsedContext(null);
    setAttachedFiles([]);
    setHighlightNotes('');
    setSelectedLength('standard');
    setSelectedTone('balanced');
  };

  // Regenerate content in a different format
  const handleRegenerateInFormat = async (newFormat: OutputFormat) => {
    // Check format permission before regenerating
    if (!checkAndTriggerPaywall('use_format', { format: newFormat })) {
      return;
    }
    
    if (!lastGenerationContext) {
      toast({ 
        title: 'No context available', 
        description: 'Please generate content first using Quick Pitch', 
        variant: 'destructive' 
      });
      return;
    }

    setIsRegenerating(true);
    setOutputFormat(newFormat);
    
    const phasesByFormat: Record<OutputFormat, string[]> = {
      'one-pager': ['Converting to one-pager...', 'Crafting summary...', 'Finalizing...'],
      'script': ['Converting to script...', 'Adding delivery cues...', 'Finalizing...']
    };
    
    let phaseIndex = 0;
    const phaseInterval = setInterval(() => {
      if (phaseIndex < phasesByFormat[newFormat].length) { 
        setGenerationPhase(phasesByFormat[newFormat][phaseIndex]); 
        phaseIndex++; 
      }
    }, 800);

    try {
      let functionName: string;
      let body: Record<string, unknown>;
      const ctx = lastGenerationContext;

      if (newFormat === 'script') {
        functionName = 'generate-script';
        body = {
          scenario: ctx.scenario,
          targetAudience: ctx.targetAudience,
          tone: ctx.tone,
          length: ctx.length,
          documentContext: ctx.documentContext,
          imageDescriptions: ctx.imageDescriptions,
        };
      } else {
        functionName = 'generate-one-pager';
        body = {
          scenario: ctx.scenario,
          targetAudience: ctx.targetAudience,
          visualStyle: ctx.tone,
          documentContext: ctx.documentContext,
          imageDescriptions: ctx.imageDescriptions,
        };
      }
      
      const { data, error } = await supabase.functions.invoke(functionName, { body });

      clearInterval(phaseInterval);

      if (error) throw error;

      if (newFormat === 'one-pager') {
        setOnePagerData(data.onePager);
        setMessages(prev => [...prev, { id: Date.now().toString(), type: 'assistant', content: 'Regenerated as one-pager!' }]);
      } else {
        setScriptData(data.script);
        setMessages(prev => [...prev, { id: Date.now().toString(), type: 'assistant', content: `Regenerated as script with ${data.script?.sections?.length || 5} sections!` }]);
      }

    } catch (error: any) {
      clearInterval(phaseInterval);
      console.error('Regeneration error:', error);
      
      // Determine error type
      let errorType: 'rate_limit' | 'credits' | 'network' | 'generic' = 'generic';
      let errorMessage = 'Regeneration failed. Please try again.';
      
      const combinedError = `${error?.message || ''} ${error?.context?.body || ''}`.toLowerCase();
      
      if (combinedError.includes('rate limit') || combinedError.includes('429')) {
        errorType = 'rate_limit';
        errorMessage = 'Too many requests. Please wait a moment.';
      } else if (combinedError.includes('credits') || combinedError.includes('402')) {
        errorType = 'credits';
        errorMessage = 'AI credits exhausted.';
      } else if (combinedError.includes('fetch') || combinedError.includes('network')) {
        errorType = 'network';
        errorMessage = 'Connection issue. Check your network.';
      }
      
      toast({ 
        title: errorType === 'rate_limit' ? 'Slow down' : errorType === 'credits' ? 'Credits exhausted' : 'Regeneration failed', 
        description: errorMessage, 
        variant: 'destructive' 
      });
    } finally {
      setIsRegenerating(false);
      setGenerationPhase('');
    }
  };

  // Handle format change - switch view or regenerate
  const handleFormatChange = (newFormat: OutputFormat) => {
    if (newFormat === outputFormat) return;
    
    // If content exists for the format, just switch view
    if (
      (newFormat === 'one-pager' && onePagerData) ||
      (newFormat === 'script' && scriptData)
    ) {
      setOutputFormat(newFormat);
    } else {
      // Regenerate in new format
      handleRegenerateInFormat(newFormat);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#0F0518' }}>
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Practice Mode View (for Script format)
  if (isPracticeMode && scriptData) {
    const totalSections = scriptData.sections.length;
    const currentSection = scriptData.sections[practiceSection];
    
    return (
      <div className="min-h-screen flex flex-col bg-black">
        <header className="p-4 sm:p-6 flex items-center justify-between">
          <button 
            onClick={() => { setIsPracticeMode(false); setIsPlaying(false); setPracticeTimer(0); }} 
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            ✕ Exit
          </button>
          <div className="text-center">
            <p className="text-primary text-sm">Practice Mode</p>
            <p className="text-foreground text-2xl sm:text-3xl font-mono">{formatTime(practiceTimer)}</p>
          </div>
          <div className="text-xs text-muted-foreground hidden sm:block">
            <p><span className="kbd">Space</span> Play/Pause</p>
            <p><span className="kbd">←</span> <span className="kbd">→</span> Navigate</p>
          </div>
        </header>
        
        <div className="flex-1 flex items-center justify-center p-4 sm:p-12">
          <div className="max-w-4xl text-center">
            <span className="text-sm text-accent uppercase mb-4 block">
              Section {practiceSection + 1}/{totalSections} — {currentSection.name}
            </span>
            <h2 className="text-3xl sm:text-5xl lg:text-6xl text-foreground mb-4 sm:mb-8 font-display leading-tight">
              {currentSection.content}
            </h2>
            <div className="p-4 sm:p-6 rounded-2xl bg-accent/10 border border-accent/20 max-w-2xl mx-auto">
              <p className="text-xs text-accent uppercase mb-2">Delivery Cue</p>
              <p className="text-sm sm:text-base text-muted-foreground">{currentSection.cue}</p>
              <p className="text-xs text-primary mt-2">{currentSection.duration}</p>
            </div>
          </div>
        </div>
        
        <div className="p-4 sm:p-8 flex items-center justify-center gap-4 sm:gap-8">
          <button 
            onClick={() => setPracticeSection(Math.max(0, practiceSection - 1))} 
            disabled={practiceSection === 0} 
            className="w-12 h-12 sm:w-14 sm:h-14 rounded-full border border-border flex items-center justify-center text-muted-foreground disabled:opacity-30"
          >
            ←
          </button>
          <button 
            onClick={() => setIsPlaying(!isPlaying)} 
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-full magenta-gradient flex items-center justify-center text-xl sm:text-2xl"
          >
            {isPlaying ? '⏸' : '▶'}
          </button>
          <button 
            onClick={() => setPracticeSection(Math.min(totalSections - 1, practiceSection + 1))} 
            disabled={practiceSection === totalSections - 1} 
            className="w-12 h-12 sm:w-14 sm:h-14 rounded-full border border-border flex items-center justify-center text-muted-foreground disabled:opacity-30"
          >
            →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative transition-colors duration-300" style={{ background: 'linear-gradient(180deg, hsl(270 12% 4%) 0%, hsl(270 12% 4%) 55%, hsl(260 35% 12%) 75%, hsl(25 60% 18%) 90%, hsl(25 75% 45% / 0.6) 100%)' }}>
      {/* Install Banner */}
      {showInstallPrompt && currentView === 'dashboard' && (
        <div className="fixed top-0 left-0 right-0 z-50 p-2 sm:p-3 install-banner animate-slideDown">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl magenta-gradient flex items-center justify-center flex-shrink-0">
                <span className="text-white font-semibold text-sm sm:text-base">P</span>
              </div>
              <div className="min-w-0">
                <p className="text-foreground text-xs sm:text-sm font-medium truncate">Install PitchVoid for faster access</p>
                <p className="text-muted-foreground text-xs hidden sm:block">Works offline • Add to dock</p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              <button onClick={() => setShowInstallPrompt(false)} className="text-muted-foreground text-sm hidden sm:block">
                Not now
              </button>
              <button className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-white text-xs sm:text-sm font-medium magenta-gradient">
                Install
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dashboard View */}
      {currentView === 'dashboard' && (
        <div className={showInstallPrompt ? 'pt-14 sm:pt-16' : ''}>
          <Navbar variant="dashboard" onSignOut={handleSignOut} />
          
          <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-foreground font-display">Your Pitches</h1>
                <p className="text-muted-foreground text-sm">
                  {remainingPitches !== null 
                    ? `${remainingPitches} free pitches remaining` 
                    : 'Unlimited pitches'
                  }
                </p>
              </div>
              <div className="flex gap-2 sm:gap-3">
                <button
                  onClick={() => setShowQuickPitch(true)}
                  className="flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl text-white text-sm font-medium magenta-gradient"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Quick Pitch</span>
                  <span className="text-white/60 text-xs hidden sm:inline">⌘K</span>
                </button>
                <button
                  onClick={() => setShowNewProjectModal(true)}
                  className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl border border-accent/30 text-foreground text-sm hover:bg-accent/10 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">New Project</span>
                </button>
              </div>
            </div>

            {/* Pitch Usage Banner */}
            <div className="mb-6 sm:mb-8">
              <PitchUsageBanner 
                pitchCount={pitchCount} 
                maxPitches={planLimits.totalPitches} 
                plan={userPlan} 
              />
            </div>

            {/* Projects Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {projectsLoading ? (
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
                  <p className="text-muted-foreground text-sm">Create your first pitch with Quick Pitch</p>
                </div>
              ) : (
                projects.map(project => (
                  <ProjectCard
                    key={project.id}
                    id={project.id}
                    title={project.title}
                    status={project.status}
                    scenarioDescription={project.scenario_description}
                    createdAt={project.created_at}
                    isPublished={project.is_published}
                    onOpen={() => openProject(project)}
                    onContinue={project.status === 'draft' && project.draft_state ? () => handleContinueDraft(project) : undefined}
                    onDuplicate={project.status !== 'draft' ? () => duplicateProject(project.id) : undefined}
                    onDelete={() => deleteProject(project.id)}
                  />
                ))
              )}
            </div>
          </main>

          {/* New Project Modal */}
          {showNewProjectModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center modal-overlay p-4" onClick={() => setShowNewProjectModal(false)}>
              <div className="glassmorphism-dark rounded-2xl p-5 sm:p-8 w-full max-w-md animate-scaleIn" onClick={e => e.stopPropagation()}>
                <h3 className="text-lg sm:text-xl text-foreground font-display mb-4 sm:mb-6">New Project</h3>
                <input 
                  type="text" 
                  value={newProjectName} 
                  onChange={e => setNewProjectName(e.target.value)} 
                  placeholder="Project name" 
                  className="w-full mb-3 sm:mb-4 p-3 rounded-xl text-foreground input-field text-sm" 
                />
                <input 
                  type="text" 
                  value={newProjectTags} 
                  onChange={e => setNewProjectTags(e.target.value)} 
                  placeholder="Tags (comma separated)" 
                  className="w-full mb-4 sm:mb-6 p-3 rounded-xl text-foreground input-field text-sm" 
                />
                <div className="flex gap-3">
                  <button 
                    onClick={() => setShowNewProjectModal(false)} 
                    className="flex-1 py-2.5 sm:py-3 rounded-xl text-muted-foreground border border-border"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleCreateProject} 
                    disabled={!newProjectName.trim()} 
                    className="flex-1 py-3 rounded-xl text-white font-medium magenta-gradient disabled:opacity-50"
                  >
                    Create
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Project View */}
      {currentView === 'project' && activeProject && (
        <div className="min-h-screen flex flex-col">
          {/* Preview Panel — on top */}
          <div className="grain-bg flex flex-col relative">
            <header className="px-4 sm:px-6 py-3 sm:py-4 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:justify-between border-b border-border relative z-10">
              <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setCurrentView('dashboard')} 
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <div>
                    <h2 className="text-foreground font-medium font-display text-sm sm:text-base truncate max-w-[200px] sm:max-w-[300px] lg:max-w-[400px]" title={activeProject.title}>{activeProject.title}</h2>
                    {isRegenerating && (
                      <p className="text-xs text-primary animate-pulse">{generationPhase}</p>
                    )}
                    {!isRegenerating && outputFormat === 'one-pager' && onePagerData && (
                      <p className="text-xs text-muted-foreground hidden sm:block">One-pager summary</p>
                    )}
                    {!isRegenerating && outputFormat === 'script' && scriptData && (
                      <p className="text-xs text-muted-foreground hidden sm:block">Speaking script</p>
                    )}
                  </div>
                </div>
                
                {/* Format Toggle - Only show when content exists */}
                {(onePagerData || scriptData) && (
                  <div className="flex items-center rounded-xl border border-border p-1 bg-card/50 backdrop-blur-sm">
                    <FormatToggle
                      activeFormat={outputFormat}
                      onFormatChange={handleFormatChange}
                      hasOnePager={!!onePagerData}
                      hasScript={!!scriptData}
                      onRegenerate={handleRegenerateInFormat}
                      isRegenerating={isRegenerating}
                      lockedFormats={isFree ? ['script'] : []}
                      onLockedClick={(format) => checkAndTriggerPaywall('use_format', { format })}
                    />
                    
                    {/* Divider */}
                    <div className="w-px h-6 bg-border mx-1" />
                    
                    {/* Practice mode - for scripts only */}
                    {outputFormat === 'script' && scriptData && (
                      <button 
                        onClick={() => setIsPracticeMode(true)} 
                        className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent/10 transition-colors"
                        title="Practice"
                      >
                        <Play className="w-4 h-4" />
                      </button>
                    )}
                    
                    {/* Share button */}
                    <button 
                      onClick={() => setShowShareModal(true)} 
                      className="p-2 rounded-lg text-primary hover:bg-primary/10 transition-colors"
                      title="Share"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                    
                    {/* Version History */}
                    {activeProject && (
                      <VersionHistoryDropdown
                        projectId={activeProject.id}
                        currentVersionId={activeVersionId}
                        fetchVersions={fetchVersions}
                        onSelectVersion={(version) => {
                          setActiveVersionId(version.id);
                          const vData = version.output_data;
                          if (version.output_format === 'script' && vData.script) {
                            setScriptData(vData.script as unknown as ScriptData);
                            setOutputFormat('script');
                          } else if (vData.onePager) {
                            setOnePagerData(vData.onePager as unknown as OnePagerData);
                            setOutputFormat('one-pager');
                          }
                        }}
                      />
                    )}
                  </div>
                )}
              </div>
            </header>
            
            <div className="overflow-y-auto p-4 sm:p-6 lg:p-8 relative z-10">
              {/* Show skeleton during regeneration */}
              {isRegenerating ? (
                <GenerationSkeleton format={outputFormat} />
              ) : outputFormat === 'script' && scriptData ? (
                <ScriptViewer 
                  data={scriptData}
                  onUpdate={(updatedData) => setScriptData(updatedData)}
                />
              ) : outputFormat === 'one-pager' && onePagerData ? (
                <OnePager 
                  data={onePagerData}
                  projectTitle={activeProject?.title}
                />
              ) : (
                <div className="py-16 flex items-center justify-center">
                  <div className="text-center">
                    <div 
                      className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 rounded-2xl flex items-center justify-center bg-gradient-to-br from-accent/15 to-primary/8 border border-dashed border-accent/30"
                    >
                      <FileText className="w-8 h-8 sm:w-9 sm:h-9 text-accent/50" />
                    </div>
                    <p className="text-muted-foreground text-sm">Your pitch will appear here</p>
                    <p className="text-muted-foreground/60 text-xs mt-1">Describe your scenario below to get started</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Chat + Editor Panel — below */}
          <div className="w-full flex flex-col border-t border-accent/10">
            {/* Credits indicator */}
            <div className="px-4 sm:px-5 py-2 flex items-center justify-end">
              <span className="text-xs text-muted-foreground whitespace-nowrap">{credits.total - credits.used} credits</span>
            </div>
            
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 sm:space-y-4 scrollbar-thin">
              {messages.map(m => (
                <div 
                  key={m.id} 
                  className={`rounded-xl p-3 sm:p-4 ${
                    m.type === 'user' ? 'message-user ml-4 sm:ml-8' : 
                    m.type === 'assistant' ? 'message-assistant mr-4 sm:mr-8' : 
                    'message-system'
                  }`}
                >
                  <p className="text-sm text-foreground/80">{m.content}</p>
                </div>
              ))}
              
              {isGenerating && (
                <div className="message-assistant mr-4 sm:mr-8 rounded-xl p-3 sm:p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full magenta-gradient flex items-center justify-center">
                      <Loader2 className="w-4 h-4 text-white animate-spin" />
                    </div>
                    <p className="text-sm text-foreground animate-pulse">{generationPhase}</p>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
            
            {/* One-Pager Editor - Desktop only */}
            {onePagerData && !isMobile && (
              <div className="p-3 sm:p-4 border-t border-accent/10 max-h-[50vh] overflow-y-auto">
                <OnePagerEditor
                  data={onePagerData}
                  onUpdate={(updatedData) => setOnePagerData(updatedData)}
                />
              </div>
            )}
            
            {/* Mobile Editor Sheet - Floating button + bottom sheet */}
            {onePagerData && isMobile && (
              <MobileEditorSheet
                data={onePagerData}
                onUpdate={(updatedData) => setOnePagerData(updatedData)}
                onRefine={(prompt) => {
                  setInputValue(prompt);
                  setTimeout(() => handleSubmit(), 0);
                }}
                isRefining={isGenerating}
              />
            )}
            
            {/* Input - Hidden on mobile when onePagerData exists (refinement is in MobileEditorSheet) */}
            {!(onePagerData && isMobile) && (
              <div className="p-3 sm:p-4 border-t border-accent/10">
                <div className="input-area rounded-xl p-2 sm:p-3">
                  <textarea 
                    value={inputValue} 
                    onChange={e => setInputValue(e.target.value)} 
                    onKeyDown={e => { 
                      if (e.key === 'Enter' && !e.shiftKey) { 
                        e.preventDefault(); 
                        handleSubmit(); 
                      }
                    }} 
                    placeholder="Refine your pitch..." 
                    className="w-full bg-transparent text-foreground placeholder-muted-foreground text-sm resize-none focus:outline-none min-h-[50px] sm:min-h-[60px]" 
                  />
                  <div className="flex items-center justify-end mt-2 pt-2 border-t border-accent/10">
                    <button 
                      onClick={handleSubmit} 
                      disabled={isGenerating || !inputValue.trim()} 
                      className="px-4 py-2 rounded-lg text-white text-sm font-medium magenta-gradient disabled:opacity-50"
                    >
                      Send
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>
      )}

      {/* Quick Pitch Modal - 5 Steps: Describe → Confirm → Context → Tune → Generate */}
      {showQuickPitch && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center modal-overlay p-4" 
          onClick={() => { autoSaveDraft(); setShowQuickPitch(false); resetQuickPitchState(); }}
        >
          <div 
            className="glassmorphism-dark rounded-2xl p-4 sm:p-8 w-full max-w-2xl animate-scaleIn max-h-[90vh] overflow-y-auto" 
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <div>
                <h3 className="text-lg sm:text-xl text-foreground font-display">Quick Pitch</h3>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {quickPitchStep === 1 ? 'Step 1: Describe your pitch' : 
                   quickPitchStep === 2 ? 'Step 2: Confirm understanding' :
                   quickPitchStep === 3 ? 'Step 3: Add context (optional)' :
                   quickPitchStep === 4 ? 'Step 4: Quick tune' : 'Generating...'}
                </p>
              </div>
              <button 
                onClick={() => { autoSaveDraft(); setShowQuickPitch(false); resetQuickPitchState(); }} 
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Progress - 5 steps */}
            <div className="flex gap-2 mb-4 sm:mb-6">
              {[1, 2, 3, 4, 5].map(s => (
                <div 
                  key={s} 
                  className={`h-1 flex-1 rounded-full transition-all ${quickPitchStep >= s ? 'magenta-gradient' : 'bg-accent/20'}`} 
                />
              ))}
            </div>

            {/* Step 1: Describe */}
            {quickPitchStep === 1 && (
              <div>
                <p className="text-sm text-muted-foreground mb-4">What do you need to pitch?</p>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-4 sm:mb-6">
                  {quickTemplates.map(t => (
                    <button 
                      key={t.id} 
                      onClick={() => setTranscribedText(t.prefill)} 
                      className="p-3 sm:p-4 rounded-xl text-center border border-accent/20 hover:border-accent/40 transition-colors"
                    >
                      {t.icon === 'briefcase' && <Briefcase className="w-5 h-5 sm:w-6 sm:h-6 text-primary mb-1 sm:mb-2 mx-auto" />}
                      {t.icon === 'handshake' && <Handshake className="w-5 h-5 sm:w-6 sm:h-6 text-primary mb-1 sm:mb-2 mx-auto" />}
                      {t.icon === 'trending-up' && <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-primary mb-1 sm:mb-2 mx-auto" />}
                      {t.icon === 'presentation' && <Presentation className="w-5 h-5 sm:w-6 sm:h-6 text-primary mb-1 sm:mb-2 mx-auto" />}
                      <span className="text-xs text-muted-foreground">{t.label}</span>
                    </button>
                  ))}
                </div>
                
                <div className="flex items-center gap-4 sm:gap-6 mb-4 sm:mb-6">
                  <button 
                    onClick={isRecording ? handleStopRecording : () => { setIsRecording(true); setRecordingTime(0); }} 
                    className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center flex-shrink-0 ${
                      isRecording ? 'bg-red-500 recording-pulse' : 'magenta-gradient'
                    }`}
                  >
                    {isRecording ? (
                      <span className="w-5 h-5 sm:w-6 sm:h-6 bg-white rounded" />
                    ) : (
                      <Mic className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                    )}
                  </button>
                  <div>
                    {isRecording ? (
                      <>
                        <p className="text-foreground text-base sm:text-lg font-mono">{formatTime(recordingTime)}</p>
                        <p className="text-destructive text-xs sm:text-sm">Recording...</p>
                      </>
                    ) : (
                      <>
                        <p className="text-foreground text-sm sm:text-base">Click to record</p>
                        <p className="text-muted-foreground text-xs sm:text-sm">Up to 60s</p>
                      </>
                    )}
                  </div>
                </div>
                
                <textarea 
                  value={transcribedText} 
                  onChange={e => setTranscribedText(e.target.value)} 
                  placeholder="Describe your pitch in your own words..." 
                  className="w-full h-24 sm:h-28 p-3 sm:p-4 rounded-xl text-foreground input-field resize-none mb-4 sm:mb-6 text-sm" 
                />
                
                <div className="flex gap-3">
                  <button 
                    onClick={() => setShowQuickPitch(false)} 
                    className="flex-1 py-2.5 sm:py-3 rounded-xl text-muted-foreground border border-border text-sm"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleParseInput} 
                    disabled={!transcribedText.trim() || isParsing} 
                    className="flex-1 py-2.5 sm:py-3 rounded-xl text-white font-medium magenta-gradient disabled:opacity-50 text-sm flex items-center justify-center gap-2"
                  >
                    {isParsing ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    {isParsing ? 'Analyzing...' : 'Next →'}
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: AI Confirmation */}
            {quickPitchStep === 2 && parsedContext && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Check className="w-5 h-5 text-primary" />
                  <p className="text-sm text-foreground">Here's what I understood:</p>
                </div>
                
                <div className="p-4 sm:p-5 rounded-xl border border-accent/20 bg-accent/5 mb-4 sm:mb-6 space-y-3">
                  <div className="flex items-start gap-3">
                    <Sparkles className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-foreground font-medium">{parsedContext.summary}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-accent" />
                      <span className="text-muted-foreground">Audience:</span>
                      <span className="text-foreground">{parsedContext.audience}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4 text-accent" />
                      <span className="text-muted-foreground">Goal:</span>
                      <span className="text-foreground">{parsedContext.goal}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm pt-2 border-t border-accent/10">
                    <span className="text-muted-foreground">Suggested:</span>
                    <span className="px-2 py-1 rounded bg-primary/10 text-primary text-xs font-medium">
                      {parsedContext.suggested_format === 'one-pager' ? 'One-Pager' : 'Script'}
                    </span>
                    <span className="px-2 py-1 rounded bg-accent/10 text-accent text-xs font-medium">
                      {parsedContext.suggested_length === 'quick' ? 'Quick' : 
                       parsedContext.suggested_length === 'standard' ? 'Standard' : 'Detailed'}
                    </span>
                  </div>
                </div>
                
                {/* Format override */}
                <div className="mb-4 sm:mb-6">
                  <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider">Output Format</p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setOutputFormat('one-pager')}
                      className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${
                        outputFormat === 'one-pager' 
                          ? 'border-primary bg-primary/10 text-foreground' 
                          : 'border-accent/20 text-muted-foreground hover:border-accent/40'
                      }`}
                    >
                      <FileText className="w-5 h-5" />
                      <span className="text-xs font-medium">One-Pager</span>
                    </button>
                    <button
                      onClick={() => setOutputFormat('script')}
                      className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all relative ${
                        outputFormat === 'script' 
                          ? 'border-primary bg-primary/10 text-foreground' 
                          : 'border-accent/20 text-muted-foreground hover:border-accent/40'
                      }`}
                    >
                      <ScrollText className="w-5 h-5" />
                      <span className="text-xs font-medium">Script</span>
                      {isFree && (
                        <span className="absolute -top-1 -right-1 text-[8px] font-bold px-1 py-0.5 rounded bg-primary text-primary-foreground">
                          PRO
                        </span>
                      )}
                    </button>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <button 
                    onClick={() => setQuickPitchStep(1)} 
                    className="flex-1 py-2.5 sm:py-3 rounded-xl text-muted-foreground border border-border text-sm flex items-center justify-center gap-2"
                  >
                    <Edit2 className="w-4 h-4" /> Edit
                  </button>
                  <button 
                    onClick={() => setQuickPitchStep(3)} 
                    className="flex-1 py-2.5 sm:py-3 rounded-xl text-white font-medium magenta-gradient text-sm"
                  >
                    Looks good →
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Context / Files */}
            {quickPitchStep === 3 && (
              <div>
                <p className="text-sm text-muted-foreground mb-4">Anything to help me help you? (optional)</p>
                
                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept={FILE_UPLOAD_CONFIG.acceptString}
                  onChange={(e) => handleFileSelect(e.target.files)}
                  className="hidden"
                />
                
                {/* Drag and drop zone */}
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`relative mb-4 p-6 rounded-xl border-2 border-dashed cursor-pointer transition-all text-center ${
                    isDragging 
                      ? 'border-primary bg-primary/10' 
                      : 'border-accent/30 hover:border-accent/50 hover:bg-accent/5'
                  }`}
                >
                  <Upload className={`w-7 h-7 mx-auto mb-2 ${isDragging ? 'text-primary' : 'text-muted-foreground'}`} />
                  <p className="text-foreground text-sm mb-1">
                    {isDragging ? 'Drop files here' : 'Drop files here or click to browse'}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {FILE_UPLOAD_CONFIG.formatLabels} up to {FILE_UPLOAD_CONFIG.maxSizeLabel}
                  </p>
                </div>
                
                {/* Attached files list */}
                {attachedFiles.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
                      Attached ({attachedFiles.length})
                    </p>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {attachedFiles.map((file) => {
                        const FileIcon = getFileIcon(file.type);
                        return (
                          <div
                            key={file.id}
                            className="flex items-center gap-3 p-2 rounded-lg border border-accent/20 bg-accent/5"
                          >
                            <FileIcon className="w-4 h-4 text-accent flex-shrink-0" />
                            <span className="text-foreground text-xs truncate flex-1">{file.name}</span>
                            <span className="text-muted-foreground text-xs">{formatFileSize(file.size)}</span>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleRemoveFile(file.id); }}
                              className="p-1 hover:bg-accent/20 rounded"
                            >
                              <X className="w-3 h-3 text-muted-foreground" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                
                {/* Highlight notes */}
                <div className="mb-4">
                  <p className="text-xs text-muted-foreground mb-2">Specific points to highlight (optional)</p>
                  <textarea
                    value={highlightNotes}
                    onChange={(e) => setHighlightNotes(e.target.value)}
                    placeholder="e.g., Emphasize my leadership experience..."
                    className="w-full h-16 p-3 rounded-xl text-foreground input-field resize-none text-sm"
                  />
                </div>
                
                <div className="flex gap-3">
                  <button 
                    onClick={() => setQuickPitchStep(2)} 
                    className="flex-1 py-2.5 sm:py-3 rounded-xl text-muted-foreground border border-border text-sm"
                  >
                    ← Back
                  </button>
                  <button 
                    onClick={() => setQuickPitchStep(4)}
                    disabled={isProcessingFiles}
                    className="flex-1 py-2.5 sm:py-3 rounded-xl text-white font-medium magenta-gradient text-sm disabled:opacity-50"
                  >
                    {attachedFiles.length > 0 ? 'Next →' : 'Skip & Continue →'}
                  </button>
                </div>
              </div>
            )}

            {/* Step 4: Quick Tune */}
            {quickPitchStep === 4 && (
              <div>
                <p className="text-sm text-muted-foreground mb-4">Any preferences? (or use smart defaults)</p>
                
                {/* Length */}
                <div className="mb-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Length</p>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'quick', label: 'Quick', desc: 'Brief summary' },
                      { id: 'standard', label: 'Standard', desc: 'Full content' },
                      { id: 'detailed', label: 'Detailed', desc: 'Comprehensive' }
                    ].map(opt => (
                      <button
                        key={opt.id}
                        onClick={() => setSelectedLength(opt.id as 'quick' | 'standard' | 'detailed')}
                        className={`p-3 rounded-xl border text-center transition-all ${
                          selectedLength === opt.id
                            ? 'border-primary bg-primary/10 text-foreground'
                            : 'border-accent/20 text-muted-foreground hover:border-accent/40'
                        }`}
                      >
                        <p className="text-sm font-medium">{opt.label}</p>
                        <p className="text-xs opacity-70">{opt.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Tone */}
                <div className="mb-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Tone</p>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { id: 'confident', label: 'Confident' },
                      { id: 'humble', label: 'Humble' },
                      { id: 'balanced', label: 'Balanced' },
                      { id: 'bold', label: 'Bold' }
                    ].map(opt => (
                      <button
                        key={opt.id}
                        onClick={() => setSelectedTone(opt.id as 'confident' | 'humble' | 'balanced' | 'bold')}
                        className={`p-3 rounded-xl border text-center transition-all ${
                          selectedTone === opt.id
                            ? 'border-primary bg-primary/10 text-foreground'
                            : 'border-accent/20 text-muted-foreground hover:border-accent/40'
                        }`}
                      >
                        <p className="text-xs font-medium">{opt.label}</p>
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <button 
                    onClick={() => setQuickPitchStep(3)} 
                    className="flex-1 py-2.5 sm:py-3 rounded-xl text-muted-foreground border border-border text-sm"
                  >
                    ← Back
                  </button>
                  <button 
                    onClick={handleQuickGenerate}
                    className="flex-1 py-2.5 sm:py-3 rounded-xl text-white font-medium magenta-gradient text-sm flex items-center justify-center gap-2"
                  >
                    <Sparkles className="w-4 h-4" /> Generate
                  </button>
                </div>
              </div>
            )}

            {/* Step 5: Generating / Error */}
            {quickPitchStep === 5 && (
              <>
                {generationError && !isGenerating ? (
                  <GenerationError
                    error={generationError.error}
                    errorType={generationError.errorType}
                    retryCount={generationError.retryCount}
                    onRetry={() => {
                      setGenerationError(null);
                      handleQuickGenerate();
                    }}
                  />
                ) : (
                  <div className="py-8 sm:py-12 text-center">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-6 relative flex items-center justify-center">
                      <div 
                        className="absolute inset-0 rounded-full opacity-30 blur-xl"
                        style={{ background: 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--accent)) 100%)' }}
                      />
                      <Sparkles className="w-8 h-8 sm:w-10 sm:h-10 text-primary relative z-10" />
                    </div>
                    <p className="text-foreground font-medium text-sm sm:text-base">
                      <TypewriterText text={generationPhase} speed={40} />
                    </p>
                    <p className="text-muted-foreground text-xs mt-2">This usually takes 10-15 seconds</p>
                    
                    {/* Generation skeleton preview */}
                    <div className="mt-8 max-w-lg mx-auto text-left">
                      <GenerationSkeleton format={outputFormat} />
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Share Modal */}
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        projectTitle={activeProject?.title || 'My Pitch'}
        publicUrl={shareUrl}
      />
      
      {/* Paywall Modal */}
      <PaywallModal
        open={showPaywall}
        onOpenChange={setShowPaywall}
        type={paywallType}
        message={paywallMessage}
      />
      
      {/* Upgrade Nudge */}
      <UpgradeNudge
        message={nudgeMessage || ''}
        show={showNudge}
        onDismiss={dismissNudge}
      />
    </div>
  );
};

export default Dashboard;
