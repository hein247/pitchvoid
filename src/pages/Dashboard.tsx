import { useState, useEffect, useRef, useCallback } from 'react';
import { exportOnePagerPDF, exportScriptPDF } from '@/utils/generatePDF';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Mic, Plus, ArrowLeft, X, Play, Share2, Home, FileText, Upload, File, Image, ScrollText, Check, Edit2, Users, Target, Sparkles, Clock, Briefcase, Handshake, TrendingUp, Presentation, Download, Lock, MoreVertical, Copy } from 'lucide-react';
import ShareModal from '@/components/dashboard/ShareModal';
import FocusMode from '@/components/dashboard/FocusMode';
import { Progress } from '@/components/ui/progress';
import Navbar from '@/components/Navbar';
import RefinementPanel from '@/components/dashboard/RefinementPanel';
import RefinementBar from '@/components/dashboard/output/RefinementBar';
import TopBarFeedback from '@/components/dashboard/TopBarFeedback';
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
import OnboardingPrompt from '@/components/dashboard/OnboardingPrompt';
import VersionHistoryDropdown from '@/components/dashboard/VersionHistoryDropdown';
import MobileOverflowMenu from '@/components/dashboard/MobileOverflowMenu';
import DesktopOverflowMenu from '@/components/dashboard/DesktopOverflowMenu';
import { useProjects, type ProjectRecord, type DraftState } from '@/hooks/useProjects';
import { validateFiles, FILE_UPLOAD_CONFIG, formatFileSize as formatFileSizeUtil } from '@/lib/fileValidation';
import PageTransition from '@/components/ui/PageTransition';

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
  mode?: 'thinking' | 'performance' | 'clarity';
  who_confidence?: 'high' | 'medium' | 'low';
}

// Project interface is now from useProjects hook

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant' | 'system';
  content: string;
  files?: {name: string;size: number;}[];
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
    credits,
    nudgeMessage,
    showNudge,
    dismissNudge,
    checkAndTriggerPaywall,
    optimisticDecrementCredits,
    refreshCredits,
    showPaywall,
    paywallType,
    paywallMessage,
    setShowPaywall,
    isFree,
    planLimits
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
    deleteProject
  } = useProjects();

  // Dashboard state
  const [currentView, setCurrentView] = useState<'dashboard' | 'project'>('dashboard');
  const [activeProject, setActiveProject] = useState<ProjectRecord | null>(null);
  const [activeVersionId, setActiveVersionId] = useState<string | undefined>(undefined);
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [showQuickPitch, setShowQuickPitch] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [hasOnboarded, setHasOnboarded] = useState(true); // default true to avoid flash
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [emptyInputShake, setEmptyInputShake] = useState(false);

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

  // Refinement state
  const [isRefining, setIsRefining] = useState(false);
  const [previousOutput, setPreviousOutput] = useState<OnePagerData | ScriptData | null>(null);
  const [showUndo, setShowUndo] = useState(false);
  const undoTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [refineAnimationKey, setRefineAnimationKey] = useState(0);
  const [feedbackKey, setFeedbackKey] = useState(0);

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

  // Share modal - generate real URL based on active project
  const shareUrl = activeProject ?
  `https://pitchvoid.lovable.app/p/${activeProject.public_id || activeProject.id}` :
  'https://pitchvoid.lovable.app/p/demo';

  // No-credits inline state
  const hasNoCredits = credits === 0;

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const dashboardInputRef = useRef<HTMLTextAreaElement>(null);

  const quickTemplates = [
  { id: 1, label: 'Job Interview', icon: 'briefcase' as const, prefill: 'Pitch me for a [Role] at [Company]. Focus on [Key Skills].' },
  { id: 2, label: 'Client Pitch', icon: 'handshake' as const, prefill: 'Create a proposal for [Client] about [Project].' },
  { id: 3, label: 'Team Update', icon: 'trending-up' as const, prefill: 'Create an update for [Team] about [Project/Initiative].' },
  { id: 4, label: 'Conference Talk', icon: 'presentation' as const, prefill: 'Prepare a talk on [Topic] for [Event].' }];


  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  // Fetch onboarding status
  useEffect(() => {
    if (!user) return;
    supabase.
    from('profiles').
    select('has_onboarded').
    eq('id', user.id).
    single().
    then(({ data }) => {
      if (data) setHasOnboarded(data.has_onboarded ?? false);
    });
  }, [user]);

  // Online/offline detection
  useEffect(() => {
    const goOnline = () => setIsOffline(false);
    const goOffline = () => setIsOffline(true);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isGenerating]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime((prev) => {
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
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showQuickPitch) autoSaveDraft();
        setShowQuickPitch(false);
        setShowShareModal(false);
        setShowNewProjectModal(false);
        if (isPracticeMode) {
          setIsPracticeMode(false);
        }
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (currentView === 'dashboard') {
          dashboardInputRef.current?.focus();
        } else {
          setShowQuickPitch(true);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPracticeMode, scriptData]);

  // Auto-trigger generation when switching to a format that hasn't been generated yet
  useEffect(() => {
    const hasCurrentFormat = outputFormat === 'script' ? !!scriptData : !!onePagerData;
    const hasOtherFormat = outputFormat === 'script' ? !!onePagerData : !!scriptData;
    if (!hasCurrentFormat && hasOtherFormat && !isRegenerating && currentView === 'project') {
      handleRegenerateInFormat(outputFormat);
    }
  }, [outputFormat]); // eslint-disable-line react-hooks/exhaustive-deps

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
      // Restore both formats if available
      if (outputData.onePager) {
        setOnePagerData(outputData.onePager as unknown as OnePagerData);
      } else {
        setOnePagerData(null);
      }
      if (outputData.script) {
        setScriptData(outputData.script as unknown as ScriptData);
      } else {
        setScriptData(null);
      }
      // Set active format
      if (project.output_format === 'script' && outputData.script) {
        setOutputFormat('script');
      } else if (outputData.onePager) {
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
      setSelectedTone(ds.selectedTone as 'confident' | 'humble' | 'balanced' | 'bold' || 'balanced');
      setSelectedLength(ds.selectedLength as 'quick' | 'standard' | 'detailed' || 'standard');
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
      attachedFileNames: attachedFiles.map((f) => f.name)
    };

    saveDraftState(activeProject.id, draftState);
  }, [activeProject, quickPitchStep, transcribedText, parsedContext, outputFormat, selectedTone, selectedLength, highlightNotes, attachedFiles, saveDraftState]);

  const handleSubmit = () => {
    if (!inputValue.trim()) return;
    setMessages((prev) => [...prev, { id: Date.now().toString(), type: 'user', content: inputValue }]);
    setInputValue('');
    setIsGenerating(true);

    const phases = ['Analyzing...', 'Crafting narrative...', 'Building content...', 'Finalizing...'];
    let delay = 0;
    phases.forEach((phase) => {
      setTimeout(() => setGenerationPhase(phase), delay);
      delay += 1500;
    });

    setTimeout(() => {
      setIsGenerating(false);
      setGenerationPhase('');
      setMessages((prev) => [...prev, { id: Date.now().toString(), type: 'assistant', content: 'Your pitch has been updated!' }]);
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
        body: { userInput: transcribedText }
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
        audience: '',
        audience_detail: '',
        subject: 'Your pitch',
        subject_detail: transcribedText,
        goal: 'Organize thoughts',
        tone: 'balanced',
        urgency: 'not specified',
        suggested_format: 'one-pager',
        suggested_length: 'standard',
        clarifying_questions: [],
        summary: transcribedText,
        mode: 'thinking',
        who_confidence: 'low'
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
        progress: 0
      };

      setAttachedFiles((prev) => [...prev, newFile]);

      const content = await processFile(file);

      setAttachedFiles((prev) =>
      prev.map((f) => f.id === newFile.id ? { ...f, content, progress: 100 } : f)
      );
    }

    setIsProcessingFiles(false);
  };

  const handleRemoveFile = (id: string) => {
    setAttachedFiles((prev) => prev.filter((f) => f.id !== id));
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
    // Check credits before generating
    if (credits <= 0) {
      // Don't generate — the inline message will show
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
    ...attachedFiles.
    filter((f) => !f.type.startsWith('image/')).
    map((f) => f.content || `File: ${f.name}`),
    highlightNotes ? `User highlights: ${highlightNotes}` : ''].
    filter(Boolean).join('\n');

    const imageDescriptions = attachedFiles.
    filter((f) => f.type.startsWith('image/')).
    map((f) => `Uploaded image: ${f.name}`);

    const isThinkingMode = parsedContext?.mode === 'thinking' || parsedContext?.who_confidence === 'low';
    const targetAudience = isThinkingMode ? '' : (parsedContext?.audience_detail || parsedContext?.audience || '');

    // Store context for later regeneration in different formats
    setLastGenerationContext({
      scenario: transcribedText,
      targetAudience,
      tone: selectedTone,
      length: selectedLength,
      documentContext: documentContext || undefined,
      imageDescriptions: imageDescriptions.length > 0 ? imageDescriptions : undefined
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
          imageDescriptions: imageDescriptions.length > 0 ? imageDescriptions : undefined
        };
      } else {
        functionName = 'generate-one-pager';
        body = {
          scenario: transcribedText,
          targetAudience,
          visualStyle: selectedTone,
          documentContext: documentContext || undefined,
          imageDescriptions: imageDescriptions.length > 0 ? imageDescriptions : undefined
        };
      }

      // 30-second timeout
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000);

      const { data, error } = await supabase.functions.invoke(functionName, { body });

      clearTimeout(timeout);
      clearInterval(phaseInterval);

      if (error) throw error;

      setIsGenerating(false);
      setShowQuickPitch(false);
      setCurrentView('project');

      // Create or update project in DB — prefer AI-generated title from output
      const aiTitle = outputFormat === 'one-pager' ? data.onePager?.title : data.script?.title;
      const projectTitle = (aiTitle || parsedContext?.summary || 'Quick Pitch').split(/\s+/).slice(0, 8).join(' ');
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
        setMessages([]);
        outputPayload.onePager = data.onePager;
        // Preserve existing script if any
        if (scriptData) outputPayload.script = scriptData;
      } else {
        setScriptData(data.script);
        setMessages([]);
        outputPayload.script = data.script;
        // Preserve existing one-pager if any
        if (onePagerData) outputPayload.onePager = onePagerData;
      }
      setFeedbackKey((prev) => prev + 1);

      if (project) {
        setActiveProject({ ...project, title: projectTitle, status: 'complete', output_format: outputFormat, output_data: outputPayload });
        // Save to DB and create version
        await saveProjectOutput(project.id, outputFormat, outputPayload, lastGenerationContext as unknown as Record<string, unknown>);
      }

      // Optimistic credit decrement on successful generation
      optimisticDecrementCredits();

      // Mark onboarded after first generation
      if (!hasOnboarded) {
        setHasOnboarded(true);
        supabase.from('profiles').update({ has_onboarded: true }).eq('id', user!.id).then(() => {});
      }

      // Reset Quick Pitch state
      resetQuickPitchState();

    } catch (error: any) {
      clearInterval(phaseInterval);
      console.error('Generation error:', error);
      setIsGenerating(false);

      // Determine error type from the error response
      const errorBody = typeof error?.message === 'string' ? error.message : '';
      const errorContext = typeof error?.context?.body === 'string' ? error.context.body : '';
      const combinedError = `${errorBody} ${errorContext}`.toLowerCase();

      if (combinedError.includes('no_credits') || combinedError.includes('used all your credits')) {
        // Refresh credits from server to get accurate count
        refreshCredits();
        toast({
          title: 'No credits remaining',
          description: 'Get more credits to keep generating.',
          variant: 'destructive',
        });
      } else if (combinedError.includes('rate limit') || combinedError.includes('429')) {
        toast({
          title: "You're going too fast",
          description: "Wait a moment and try again.",
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Something went wrong',
          description: 'Try again.',
          variant: 'destructive',
        });
      }

      // Keep user input intact — don't reset transcribedText
      setGenerationError({
        error: combinedError.includes('rate limit') || combinedError.includes('429')
          ? "You're going too fast. Wait a moment and try again."
          : 'Something went wrong. Try again.',
        errorType: combinedError.includes('rate limit') || combinedError.includes('429') ? 'rate_limit'
          : combinedError.includes('credits') || combinedError.includes('402') ? 'credits'
          : combinedError.includes('fetch') || combinedError.includes('network') || combinedError.includes('timeout') ? 'network'
          : 'generic',
        retryCount: (generationError?.retryCount || 0) + 1
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

  // --- Refinement handlers ---
  const handleRefine = async (instruction: string) => {
    if (!activeProject) return;
    const currentData = outputFormat === 'script' ? scriptData : onePagerData;
    if (!currentData) return;

    // If undo window is still open, update previousOutput to current state
    if (showUndo) {
      setPreviousOutput(currentData);
      if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    }

    setIsRefining(true);

    try {
      const { data, error } = await supabase.functions.invoke('refine-output', {
        body: {
          project_id: activeProject.id,
          original_input: transcribedText || activeProject.scenario_description || '',
          current_output: currentData,
          refine_instruction: instruction.toLowerCase(),
          format: outputFormat
        }
      });

      if (error) throw error;

      if (data.success === false) {
        toast({ title: 'Refinement issue', description: data.message, variant: 'destructive' });
        setIsRefining(false);
        return;
      }

      const newOutput = data.new_output;

      // Store current as previous for undo
      if (!showUndo) {
        setPreviousOutput(currentData);
      }

      // Apply new output
      if (outputFormat === 'script') {
        setScriptData(newOutput as ScriptData);
      } else {
        setOnePagerData(newOutput as OnePagerData);
      }

      setRefineAnimationKey((prev) => prev + 1);
      setFeedbackKey((prev) => prev + 1);
      setShowUndo(true);

      // Start 10-second undo timer
      undoTimerRef.current = setTimeout(() => {
        setShowUndo(false);
        setPreviousOutput(null);
      }, 10000);

      // Targeted DB update — only output_data column
      const outputKey = outputFormat === 'script' ? 'script' : 'onePager';
      const existingOutput = (activeProject.output_data || {}) as Record<string, unknown>;
      await supabase.from('projects').update({
        output_data: { ...existingOutput, [outputKey]: newOutput }
      }).eq('id', activeProject.id);

    } catch (error: any) {
      console.error('Refine error:', error);
      const msg = error?.message || error?.context?.body || 'Refinement failed. Please try again.';
      const parsed = typeof msg === 'string' && msg.toLowerCase();
      toast({
        title: parsed && parsed.includes('rate limit') ? 'Limit reached' : 'Refinement failed',
        description: typeof msg === 'string' ? msg : 'Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsRefining(false);
    }
  };

  const handleUndo = () => {
    if (!previousOutput) return;
    if (outputFormat === 'script') {
      setScriptData(previousOutput as ScriptData);
    } else {
      setOnePagerData(previousOutput as OnePagerData);
    }
    setPreviousOutput(null);
    setShowUndo(false);
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
  };

  // Regenerate content in a different format
  const handleRegenerateInFormat = async (newFormat: OutputFormat) => {
    // Check credits before regenerating in new format
    if (credits <= 0) {
      toast({
        title: 'No credits remaining',
        description: 'Get more credits to generate in a new format.',
        variant: 'destructive',
      });
      return;
    }

    // Check format permission before regenerating
    if (!checkAndTriggerPaywall('use_format', { format: newFormat })) {
      return;
    }

    // Reconstruct context from project data if not available in memory
    const ctx = lastGenerationContext || (() => {
      const scenario = transcribedText || activeProject?.scenario_description || '';
      const audience = activeProject?.target_audience || '';
      if (!scenario) return null;
      return {
        scenario,
        targetAudience: audience,
        tone: selectedTone || 'balanced',
        length: selectedLength || 'standard'
      };
    })();

    if (!ctx) {
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

      const docCtx = 'documentContext' in ctx ? ctx.documentContext : undefined;
      const imgDescs = 'imageDescriptions' in ctx ? ctx.imageDescriptions : undefined;

      if (newFormat === 'script') {
        functionName = 'generate-script';
        body = {
          scenario: ctx.scenario,
          targetAudience: ctx.targetAudience,
          tone: ctx.tone,
          length: ctx.length,
          documentContext: docCtx,
          imageDescriptions: imgDescs
        };
      } else {
        functionName = 'generate-one-pager';
        body = {
          scenario: ctx.scenario,
          targetAudience: ctx.targetAudience,
          visualStyle: ctx.tone,
          documentContext: docCtx,
          imageDescriptions: imgDescs
        };
      }

      const { data, error } = await supabase.functions.invoke(functionName, { body });

      clearInterval(phaseInterval);

      if (error) throw error;

      if (newFormat === 'one-pager') {
        setOnePagerData(data.onePager);
      } else {
        setScriptData(data.script);
      }
      setFeedbackKey((prev) => prev + 1);

      // Save both formats to project
      if (activeProject) {
        const existingOutput = (activeProject.output_data || {}) as Record<string, unknown>;
        const outputKey = newFormat === 'script' ? 'script' : 'onePager';
        const mergedOutput = { ...existingOutput, [outputKey]: newFormat === 'script' ? data.script : data.onePager };
        setActiveProject({ ...activeProject, output_data: mergedOutput, output_format: newFormat });
        await supabase.from('projects').update({
          output_data: mergedOutput,
          output_format: newFormat
        }).eq('id', activeProject.id);
        // Save version
        await saveProjectOutput(activeProject.id, newFormat, mergedOutput, lastGenerationContext as unknown as Record<string, unknown>);
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

  // Handle format change - just switch the active tab
  const handleFormatChange = (newFormat: OutputFormat) => {
    if (newFormat === outputFormat) return;
    setOutputFormat(newFormat);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#0F0518' }}>
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>);

  }

  if (!user) {
    return null;
  }

  // Focus Mode (Practice) for Script format
  if (isPracticeMode && scriptData) {
    return (
      <FocusMode
        scriptData={scriptData}
        onExit={() => setIsPracticeMode(false)} />);


  }

  return (
    <PageTransition><div className="min-h-screen relative transition-colors duration-300 bg-background">
      {/* Install Banner */}
      {showInstallPrompt && currentView === 'dashboard' &&
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
      }

      {/* Dashboard View */}
      {currentView === 'dashboard' &&
      <div className={showInstallPrompt ? 'pt-14 sm:pt-16' : ''}>
          <Navbar variant="dashboard" onSignOut={handleSignOut} />
          
          <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
            {/* Header */}
            <div className="mb-6">
              <h1 className="text-xl sm:text-2xl font-bold text-foreground font-display">My Void </h1>
            </div>

            {/* Onboarding Scenario Cards */}
            {!hasOnboarded && projects.length === 0 && !projectsLoading &&
          <OnboardingPrompt onSelectScenario={(text) => {
            setTranscribedText(text);
            dashboardInputRef.current?.focus();
          }} />
          }

            {/* Inline Pitch Input */}
            <div className={`mb-6 sm:mb-8 rounded-xl border border-border/50 bg-card/40 backdrop-blur-sm p-4 sm:p-5 transition-transform ${emptyInputShake ? 'animate-shake' : ''}`}>
              <textarea
              ref={dashboardInputRef}
              value={transcribedText}
              onChange={(e) => setTranscribedText(e.target.value)}
              placeholder={emptyInputShake ? 'Drop some thoughts first' : 'Brain dump your thoughts here... meeting with CEO tomorrow, revenue down 15%, need budget approval...'}
              className={`w-full h-16 sm:h-20 bg-transparent text-foreground resize-none text-sm focus:outline-none transition-colors ${emptyInputShake ? 'placeholder:text-red-500/50' : 'placeholder:text-muted-foreground/50'}`}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  if (!transcribedText.trim()) {
                    setEmptyInputShake(true);
                    setTimeout(() => setEmptyInputShake(false), 600);
                    return;
                  }
                  setShowQuickPitch(true);
                  handleParseInput();
                }
              }} />

              <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/30">
                <div className="flex items-center gap-2">
                  <button
                  onClick={isRecording ? handleStopRecording : () => {setIsRecording(true);setRecordingTime(0);}}
                  className={`p-2 rounded-lg transition-colors ${
                  isRecording ? 'bg-red-500/20 text-red-400' : 'text-muted-foreground hover:text-foreground hover:bg-accent/10'}`
                  }
                  title="Voice input">

                    <Mic className="w-4 h-4" />
                  </button>
                  {isRecording &&
                <span className="text-xs text-red-400 font-mono">{formatTime(recordingTime)}</span>
                }
                </div>
                <button
                onClick={() => {
                  if (!transcribedText.trim()) {
                    setEmptyInputShake(true);
                    setTimeout(() => setEmptyInputShake(false), 600);
                    return;
                  }
                  setShowQuickPitch(true);
                  handleParseInput();
                }}
                disabled={isParsing || isOffline}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-primary-foreground magenta-gradient disabled:opacity-40 transition-opacity">

                  {isParsing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                  Generate
                </button>
              </div>
              {isOffline && (
                <p className="text-xs text-muted-foreground mt-2">You're offline. Reconnect to generate.</p>
              )}
            </div>

            {/* Onboarding tip */}
            {!hasOnboarded && projects.length === 0 && !projectsLoading &&
          <p className="text-[11px] -mt-4 mb-6" style={{ color: 'rgba(240,237,246,0.15)' }}>
                Tip: the messier, the better. Just dump everything — PitchVoid will sort it out.
              </p>
          }


            {/* Projects Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {projectsLoading ?
            <div className="col-span-full text-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary mb-2" />
                  <p className="text-muted-foreground text-sm">Loading projects...</p>
                </div> :
            projects.length === 0 ?
            <div className="col-span-full text-center py-16">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center bg-gradient-to-br from-accent/15 to-primary/8 border border-dashed border-accent/30">
                    <FileText className="w-7 h-7 text-accent/50" />
                  </div>
                  <p className="text-foreground font-medium mb-1">No pitches yet</p>
                  <p className="text-muted-foreground text-sm">Describe your pitch above to get started</p>
                </div> :

            projects.map((project) =>
            <ProjectCard
              key={project.id}
              id={project.id}
              title={project.title}
              status={project.status}
              scenarioDescription={project.scenario_description}
              createdAt={project.created_at}
              isPublished={project.is_published}
              outputData={project.output_data}
              onOpen={() => openProject(project)}
              onContinue={project.status === 'draft' && project.draft_state ? () => handleContinueDraft(project) : undefined}
              onDownloadPDF={project.status !== 'draft' && project.output_data ? () => {
                const od = project.output_data as Record<string, any>;
                if (od?.onePager) exportOnePagerPDF(od.onePager, !isFree);else
                if (od?.script) exportScriptPDF(od.script, !isFree);
              } : undefined}
              onDelete={() => deleteProject(project.id)} />

            )
            }
            </div>
          </main>

        </div>
      }

      {/* Project View */}
      {currentView === 'project' && activeProject &&
      <div className="min-h-screen flex flex-col bg-background">
          {/* Preview Panel — full screen */}
          <div className="grain-bg flex flex-col relative flex-1">
            <header className="px-3 sm:px-6 py-3 sm:py-4 flex items-center gap-2 sm:gap-3 justify-between border-b border-border relative z-10">
              {/* Left: Back + Title */}
              <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                <button
                onClick={() => setCurrentView('dashboard')}
                className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center">

                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="min-w-0">
                  <h2 className="font-medium font-display text-sm sm:text-base truncate max-w-[140px] sm:max-w-[300px] lg:max-w-[400px]" style={{ color: 'rgba(240,237,246,0.95)' }} title={(outputFormat === 'script' ? scriptData?.title : onePagerData?.title) || activeProject.title}>{(outputFormat === 'script' ? scriptData?.title : onePagerData?.title) || activeProject.title}</h2>
                  {isRegenerating &&
                <p className="text-xs text-primary animate-pulse">{generationPhase}</p>
                }
                  {!isRegenerating && outputFormat === 'one-pager' && onePagerData &&
                <p className="text-xs hidden sm:block" style={{ color: 'rgba(240,237,246,0.4)' }}>{onePagerData.context_line || 'One-pager'}</p>
                }
                  {!isRegenerating && outputFormat === 'script' && scriptData &&
                <p className="text-xs hidden sm:block" style={{ color: 'rgba(240,237,246,0.4)' }}>Speaking script</p>
                }
                </div>
              </div>

              {/* Right: Actions */}
              {(onePagerData || scriptData) &&
            <div className="flex items-center gap-1 sm:gap-0 flex-shrink-0">
                  {/* Desktop: Format Toggle + Versions + Overflow */}
                  <div className="hidden sm:flex items-center gap-1">
                    <div className="flex items-center rounded-xl border border-border p-1 bg-card/50 backdrop-blur-sm">
                      <FormatToggle
                    activeFormat={outputFormat}
                    onFormatChange={handleFormatChange}
                    hasOnePager={!!onePagerData}
                    hasScript={!!scriptData}
                    onRegenerate={handleRegenerateInFormat}
                    isRegenerating={isRegenerating}
                    lockedFormats={isFree ? ['script'] : []}
                    onLockedClick={(format) => checkAndTriggerPaywall('use_format', { format })} />

                      {/* Practice mode - for scripts only */}
                      {outputFormat === 'script' && scriptData && (
                        <>
                          <div className="w-px h-6 bg-border mx-1" />
                          <button
                            onClick={() => setIsPracticeMode(true)}
                            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent/10 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                            title="Practice">
                            <Play className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>

                    {/* Version History */}
                    {activeProject &&
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
                    }} />
                  }

                    {/* Desktop overflow for secondary actions */}
                    <DesktopOverflowMenu
                      onShare={() => setShowShareModal(true)}
                      onExport={async () => {
                        if (isFree) {checkAndTriggerPaywall('export');return;}
                        try {
                          if (outputFormat === 'script' && scriptData) {
                            await exportScriptPDF(scriptData as any, true);
                          } else if (onePagerData) {
                            await exportOnePagerPDF(onePagerData as any, true);
                          }
                          toast({ title: 'PDF downloaded' });
                        } catch {toast({ title: 'Failed to generate PDF', variant: 'destructive' });}
                      }}
                      onEdit={onePagerData && !isRegenerating ? () => setShowEditor((prev) => !prev) : undefined}
                      onCopyAll={() => {
                        if (outputFormat === 'one-pager' && onePagerData) {
                          const text = onePagerData.sections
                            .map((s) => `${s.title}\n${s.points.map((p) => `• ${p.replace(/\*\*/g, '')}`).join('\n')}`)
                            .join('\n\n');
                          navigator.clipboard.writeText(text);
                        } else if (outputFormat === 'script' && scriptData) {
                          const text = (scriptData as any).lines?.map((l: any) => l.text || '').join('\n\n') || '';
                          navigator.clipboard.writeText(text);
                        }
                      }}
                      isFree={isFree}
                      feedbackNode={
                        activeProject && (onePagerData || scriptData) && !isRegenerating ? (
                          <TopBarFeedback
                            projectId={activeProject.id}
                            format={outputFormat === 'script' ? 'script' : 'one-pager'}
                            generationKey={feedbackKey}
                            generatedOutput={
                              outputFormat === 'script' ?
                              scriptData as unknown as Record<string, unknown> :
                              onePagerData as unknown as Record<string, unknown>
                            }
                          />
                        ) : null
                      }
                    />
                  </div>

                  {/* Mobile: only overflow menu */}
                  <MobileOverflowMenu
                onShare={() => setShowShareModal(true)}
                onExport={async () => {
                  if (isFree) {checkAndTriggerPaywall('export');return;}
                  try {
                    if (outputFormat === 'script' && scriptData) {
                      await exportScriptPDF(scriptData as any, true);
                    } else if (onePagerData) {
                      await exportOnePagerPDF(onePagerData as any, true);
                    }
                    toast({ title: 'PDF downloaded' });
                  } catch {toast({ title: 'Failed to generate PDF', variant: 'destructive' });}
                }}
                onEdit={onePagerData && !isRegenerating ? () => setShowEditor((prev) => !prev) : undefined}
                onPractice={outputFormat === 'script' && scriptData ? () => setIsPracticeMode(true) : undefined}
                onCopyAll={() => {
                  if (outputFormat === 'one-pager' && onePagerData) {
                    const text = onePagerData.sections.
                    map((s) => `${s.title}\n${s.points.map((p) => `• ${p.replace(/\*\*/g, '')}`).join('\n')}`).
                    join('\n\n');
                    navigator.clipboard.writeText(text);
                  }
                }}
                onVersionHistory={() => {/* handled by sheet */}}
                isFree={isFree}
                activeProject={activeProject}
                activeVersionId={activeVersionId}
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
                feedbackProjectId={activeProject?.id}
                feedbackFormat={outputFormat === 'script' ? 'script' : 'one-pager'}
                feedbackOutput={
                outputFormat === 'script' ?
                scriptData as unknown as Record<string, unknown> :
                onePagerData as unknown as Record<string, unknown>
                }
                feedbackKey={feedbackKey}
                // Format toggle props for mobile
                activeFormat={outputFormat}
                onFormatChange={handleFormatChange}
                hasOnePager={!!onePagerData}
                hasScript={!!scriptData}
                onRegenerate={handleRegenerateInFormat}
                isRegenerating={isRegenerating}
                lockedFormats={isFree ? ['script'] : []}
                onLockedClick={(format) => checkAndTriggerPaywall('use_format', { format })} />

                </div>
            }
            </header>
            
            <div className={`overflow-y-auto px-5 sm:p-6 lg:p-8 py-4 relative z-10 transition-opacity duration-500 ${isRefining ? 'opacity-50' : 'opacity-100'}`} style={{ paddingBottom: onePagerData || scriptData ? '260px' : undefined }}>
              {/* Show skeleton during regeneration */}
              {isRegenerating ?
            <GenerationSkeleton format={outputFormat} /> :
            outputFormat === 'script' && scriptData ?
            <ScriptViewer
              data={scriptData}
              onUpdate={(updatedData) => setScriptData(updatedData)}
              refineAnimationKey={refineAnimationKey} /> :

            outputFormat === 'one-pager' && onePagerData ?
            <OnePager
              data={onePagerData}
              projectTitle={activeProject?.title}
              refineAnimationKey={refineAnimationKey} /> :

            (onePagerData || scriptData) && !isRegenerating ? (
            /* Format not yet generated — show loading, useEffect will trigger generation */
            <div className="py-16 flex items-center justify-center animate-fadeIn">
                  <div className="text-center">
                    <Loader2 className="w-8 h-8 mx-auto mb-4 text-primary/60 animate-spin" />
                    <p className="text-muted-foreground text-sm animate-pulse">
                      Generating your {outputFormat === 'script' ? 'script' : 'one-pager'}...
                    </p>
                  </div>
                </div>) :

            <div className="py-16 flex items-center justify-center">
                  <div className="text-center">
                    <div
                  className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 rounded-2xl flex items-center justify-center bg-gradient-to-br from-accent/15 to-primary/8 border border-dashed border-accent/30">

                      <FileText className="w-8 h-8 sm:w-9 sm:h-9 text-accent/50" />
                    </div>
                    <p className="text-muted-foreground text-sm">Your pitch will appear here</p>
                    <p className="text-muted-foreground/60 text-xs mt-1">Describe your scenario below to get started</p>
                  </div>
                </div>
            }
            </div>

            {/* Refinement Bar */}
            {(onePagerData || scriptData) && !isRegenerating &&
          <RefinementBar
            onRefine={handleRefine}
            isRefining={isRefining}
            showUndo={showUndo}
            onUndo={handleUndo} />

          }
          </div>

          {/* Edit button removed — now in top bar header */}

          {/* Editor Overlay */}
          {showEditor && onePagerData &&
        <div className="fixed inset-0 z-40 flex items-end justify-center modal-overlay" onClick={() => setShowEditor(false)}>
              <div
            className="w-full max-w-3xl max-h-[70vh] overflow-y-auto rounded-t-2xl border border-border bg-background p-4 sm:p-6 animate-slideUp"
            onClick={(e) => e.stopPropagation()}>

                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-foreground font-display">Edit One-Pager</h3>
                  <button onClick={() => setShowEditor(false)} className="text-muted-foreground hover:text-foreground">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                {isMobile ?
            <MobileEditorSheet
              data={onePagerData}
              onUpdate={(updatedData) => setOnePagerData(updatedData)}
              onRefine={(prompt) => {
                setInputValue(prompt);
                setTimeout(() => handleSubmit(), 0);
              }}
              isRefining={isGenerating} /> :


            <OnePagerEditor
              data={onePagerData}
              onUpdate={(updatedData) => setOnePagerData(updatedData)} />

            }
              </div>
            </div>
        }

        </div>
      }

      {/* Quick Pitch Modal - 5 Steps: Describe → Confirm → Context → Tune → Generate */}
      {showQuickPitch &&
      <div
        className="fixed inset-0 z-50 flex items-center justify-center modal-overlay p-4"
        onClick={() => {autoSaveDraft();setShowQuickPitch(false);resetQuickPitchState();}}>

          <div
          className="glassmorphism-dark rounded-2xl p-4 sm:p-8 w-full max-w-2xl animate-scaleIn max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}>

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
              onClick={() => {autoSaveDraft();setShowQuickPitch(false);resetQuickPitchState();}}
              className="text-muted-foreground hover:text-foreground">

                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Progress - 5 steps */}
            <div className="flex gap-2 mb-4 sm:mb-6">
              {[1, 2, 3, 4, 5].map((s) =>
            <div
              key={s}
              className={`h-1 flex-1 rounded-full transition-all ${quickPitchStep >= s ? 'magenta-gradient' : 'bg-accent/20'}`} />

            )}
            </div>

            {/* Step 1: Describe */}
            {quickPitchStep === 1 &&
          <div>
                <p className="text-sm text-muted-foreground mb-4">What do you need to pitch?</p>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-4 sm:mb-6">
                  {quickTemplates.map((t) =>
              <button
                key={t.id}
                onClick={() => setTranscribedText(t.prefill)}
                className="p-3 sm:p-4 rounded-xl text-center border border-accent/20 hover:border-accent/40 transition-colors">

                      {t.icon === 'briefcase' && <Briefcase className="w-5 h-5 sm:w-6 sm:h-6 text-primary mb-1 sm:mb-2 mx-auto" />}
                      {t.icon === 'handshake' && <Handshake className="w-5 h-5 sm:w-6 sm:h-6 text-primary mb-1 sm:mb-2 mx-auto" />}
                      {t.icon === 'trending-up' && <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-primary mb-1 sm:mb-2 mx-auto" />}
                      {t.icon === 'presentation' && <Presentation className="w-5 h-5 sm:w-6 sm:h-6 text-primary mb-1 sm:mb-2 mx-auto" />}
                      <span className="text-xs text-muted-foreground">{t.label}</span>
                    </button>
              )}
                </div>
                
                <div className="flex items-center gap-4 sm:gap-6 mb-4 sm:mb-6">
                  <button
                onClick={isRecording ? handleStopRecording : () => {setIsRecording(true);setRecordingTime(0);}}
                className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center flex-shrink-0 ${
                isRecording ? 'bg-red-500 recording-pulse' : 'magenta-gradient'}`
                }>

                    {isRecording ?
                <span className="w-5 h-5 sm:w-6 sm:h-6 bg-white rounded" /> :

                <Mic className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                }
                  </button>
                  <div>
                    {isRecording ?
                <>
                        <p className="text-foreground text-base sm:text-lg font-mono">{formatTime(recordingTime)}</p>
                        <p className="text-destructive text-xs sm:text-sm">Recording...</p>
                      </> :

                <>
                        <p className="text-foreground text-sm sm:text-base">Click to record</p>
                        <p className="text-muted-foreground text-xs sm:text-sm">Up to 60s</p>
                      </>
                }
                  </div>
                </div>
                
                <textarea
              value={transcribedText}
              onChange={(e) => setTranscribedText(e.target.value)}
              placeholder="Describe your pitch in your own words..."
              className="w-full h-24 sm:h-28 p-3 sm:p-4 rounded-xl text-foreground input-field resize-none mb-4 sm:mb-6 text-sm" />

                
                <div className="flex gap-3">
                  <button
                onClick={() => setShowQuickPitch(false)}
                className="flex-1 py-2.5 sm:py-3 rounded-xl text-muted-foreground border border-border text-sm">

                    Cancel
                  </button>
                  <button
                onClick={handleParseInput}
                disabled={!transcribedText.trim() || isParsing}
                className="flex-1 py-2.5 sm:py-3 rounded-xl text-white font-medium magenta-gradient disabled:opacity-50 text-sm flex items-center justify-center gap-2">

                    {isParsing ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    {isParsing ? 'Analyzing...' : 'Next →'}
                  </button>
                </div>
              </div>
          }

            {/* Step 2: AI Confirmation */}
            {quickPitchStep === 2 && parsedContext &&
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
                  outputFormat === 'one-pager' ?
                  'border-primary bg-primary/10 text-foreground' :
                  'border-accent/20 text-muted-foreground hover:border-accent/40'}`
                  }>

                      <FileText className="w-5 h-5" />
                      <span className="text-xs font-medium">One-Pager</span>
                    </button>
                    <button
                  onClick={() => setOutputFormat('script')}
                  className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all relative ${
                  outputFormat === 'script' ?
                  'border-primary bg-primary/10 text-foreground' :
                  'border-accent/20 text-muted-foreground hover:border-accent/40'}`
                  }>

                      <ScrollText className="w-5 h-5" />
                      <span className="text-xs font-medium">Script</span>
                      {isFree &&
                  <span className="absolute -top-1 -right-1 text-[8px] font-bold px-1 py-0.5 rounded bg-primary text-primary-foreground">
                          PRO
                        </span>
                  }
                    </button>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <button
                onClick={() => setQuickPitchStep(1)}
                className="flex-1 py-2.5 sm:py-3 rounded-xl text-muted-foreground border border-border text-sm flex items-center justify-center gap-2">

                    <Edit2 className="w-4 h-4" /> Edit
                  </button>
                  <button
                onClick={() => setQuickPitchStep(3)}
                className="flex-1 py-2.5 sm:py-3 rounded-xl text-white font-medium magenta-gradient text-sm">

                    Looks good →
                  </button>
                </div>
              </div>
          }

            {/* Step 3: Context / Files */}
            {quickPitchStep === 3 &&
          <div>
                <p className="text-sm text-muted-foreground mb-4">Anything to help me help you? (optional)</p>
                
                {/* Hidden file input */}
                <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={FILE_UPLOAD_CONFIG.acceptString}
              onChange={(e) => handleFileSelect(e.target.files)}
              className="hidden" />

                
                {/* Drag and drop zone */}
                <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative mb-4 p-6 rounded-xl border-2 border-dashed cursor-pointer transition-all text-center ${
              isDragging ?
              'border-primary bg-primary/10' :
              'border-accent/30 hover:border-accent/50 hover:bg-accent/5'}`
              }>

                  <Upload className={`w-7 h-7 mx-auto mb-2 ${isDragging ? 'text-primary' : 'text-muted-foreground'}`} />
                  <p className="text-foreground text-sm mb-1">
                    {isDragging ? 'Drop files here' : 'Drop files here or click to browse'}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {FILE_UPLOAD_CONFIG.formatLabels} up to {FILE_UPLOAD_CONFIG.maxSizeLabel}
                  </p>
                </div>
                
                {/* Attached files list */}
                {attachedFiles.length > 0 &&
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
                      className="flex items-center gap-3 p-2 rounded-lg border border-accent/20 bg-accent/5">

                            <FileIcon className="w-4 h-4 text-accent flex-shrink-0" />
                            <span className="text-foreground text-xs truncate flex-1">{file.name}</span>
                            <span className="text-muted-foreground text-xs">{formatFileSize(file.size)}</span>
                            <button
                        onClick={(e) => {e.stopPropagation();handleRemoveFile(file.id);}}
                        className="p-1 hover:bg-accent/20 rounded">

                              <X className="w-3 h-3 text-muted-foreground" />
                            </button>
                          </div>);

                })}
                    </div>
                  </div>
            }
                
                {/* Highlight notes */}
                <div className="mb-4">
                  <p className="text-xs text-muted-foreground mb-2">Specific points to highlight (optional)</p>
                  <textarea
                value={highlightNotes}
                onChange={(e) => setHighlightNotes(e.target.value)}
                placeholder="e.g., Emphasize my leadership experience..."
                className="w-full h-16 p-3 rounded-xl text-foreground input-field resize-none text-sm" />

                </div>
                
                <div className="flex gap-3">
                  <button
                onClick={() => setQuickPitchStep(2)}
                className="flex-1 py-2.5 sm:py-3 rounded-xl text-muted-foreground border border-border text-sm">

                    ← Back
                  </button>
                  <button
                onClick={() => setQuickPitchStep(4)}
                disabled={isProcessingFiles}
                className="flex-1 py-2.5 sm:py-3 rounded-xl text-white font-medium magenta-gradient text-sm disabled:opacity-50">

                    {attachedFiles.length > 0 ? 'Next →' : 'Skip & Continue →'}
                  </button>
                </div>
              </div>
          }

            {/* Step 4: Quick Tune */}
            {quickPitchStep === 4 &&
          <div>
                <p className="text-sm text-muted-foreground mb-4">Any preferences? (or use smart defaults)</p>
                
                {/* Length */}
                <div className="mb-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Length</p>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                { id: 'quick', label: 'Quick', desc: 'Brief summary' },
                { id: 'standard', label: 'Standard', desc: 'Full content' },
                { id: 'detailed', label: 'Detailed', desc: 'Comprehensive' }].
                map((opt) =>
                <button
                  key={opt.id}
                  onClick={() => setSelectedLength(opt.id as 'quick' | 'standard' | 'detailed')}
                  className={`p-3 rounded-xl border text-center transition-all ${
                  selectedLength === opt.id ?
                  'border-primary bg-primary/10 text-foreground' :
                  'border-accent/20 text-muted-foreground hover:border-accent/40'}`
                  }>

                        <p className="text-sm font-medium">{opt.label}</p>
                        <p className="text-xs opacity-70">{opt.desc}</p>
                      </button>
                )}
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
                { id: 'bold', label: 'Bold' }].
                map((opt) =>
                <button
                  key={opt.id}
                  onClick={() => setSelectedTone(opt.id as 'confident' | 'humble' | 'balanced' | 'bold')}
                  className={`p-3 rounded-xl border text-center transition-all ${
                  selectedTone === opt.id ?
                  'border-primary bg-primary/10 text-foreground' :
                  'border-accent/20 text-muted-foreground hover:border-accent/40'}`
                  }>

                        <p className="text-xs font-medium">{opt.label}</p>
                      </button>
                )}
                  </div>
                </div>
                
                {/* Inline no-credits message */}
                {hasNoCredits && (
                  <div className="mb-4 p-4 rounded-xl bg-accent/5 border border-accent/10 text-center">
                    <p className="text-sm text-foreground/60 mb-2">
                      You've used all your free credits. Get more to keep going.
                    </p>
                    <button
                      onClick={() => navigate('/pricing')}
                      className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                    >
                      Get credits →
                    </button>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                onClick={() => setQuickPitchStep(3)}
                className="flex-1 py-2.5 sm:py-3 rounded-xl text-muted-foreground border border-border text-sm">

                    ← Back
                  </button>
                  <button
                onClick={handleQuickGenerate}
                disabled={hasNoCredits}
                className={`flex-1 py-2.5 sm:py-3 rounded-xl text-primary-foreground font-medium text-sm flex items-center justify-center gap-2 ${
                  hasNoCredits ? 'opacity-40 cursor-not-allowed bg-muted' : 'magenta-gradient'
                }`}>

                    <Sparkles className="w-4 h-4" /> Generate
                  </button>
                </div>
              </div>
          }

            {/* Step 5: Generating / Error */}
            {quickPitchStep === 5 &&
          <>
                {generationError && !isGenerating ?
            <GenerationError
              error={generationError.error}
              errorType={generationError.errorType}
              retryCount={generationError.retryCount}
              onRetry={() => {
                setGenerationError(null);
                handleQuickGenerate();
              }} /> :


            <div className="py-8 sm:py-12 text-center">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-6 relative flex items-center justify-center">
                      <div
                  className="absolute inset-0 rounded-full opacity-30 blur-xl"
                  style={{ background: 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--accent)) 100%)' }} />

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
            }
              </>
          }
          </div>
        </div>
      }

      {/* Share Modal */}
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        projectTitle={activeProject?.title || 'My Pitch'}
        publicUrl={shareUrl} />

      
      {/* Paywall Modal */}
      <PaywallModal
        open={showPaywall}
        onOpenChange={setShowPaywall}
        type={paywallType}
        message={paywallMessage} />

      
      {/* Upgrade Nudge */}
      <UpgradeNudge
        message={nudgeMessage || ''}
        show={showNudge}
        onDismiss={dismissNudge} />

    </div></PageTransition>);

};

export default Dashboard;