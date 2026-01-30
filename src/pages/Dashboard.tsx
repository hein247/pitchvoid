import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Mic, Plus, ArrowLeft, X, Play, Share2, Home, FileText, Upload, File, Image, ScrollText, Check, Edit2, Users, Target, Sparkles, Clock } from 'lucide-react';
import ShareModal from '@/components/dashboard/ShareModal';
import { Progress } from '@/components/ui/progress';
import Navbar from '@/components/Navbar';
import RefinementPanel from '@/components/dashboard/RefinementPanel';
import OnePager, { OnePagerData } from '@/components/dashboard/OnePager';
import OnePagerEditor from '@/components/dashboard/OnePagerEditor';
import ScriptViewer, { ScriptData } from '@/components/dashboard/ScriptViewer';
import FormatToggle from '@/components/dashboard/FormatToggle';
import { usePricing } from '@/hooks/usePricing';
import { PaywallModal } from '@/components/pricing/PaywallModal';
import { UpgradeNudge } from '@/components/pricing/UpgradeNudge';

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

interface Project {
  id: string;
  title: string;
  tags: string[];
  lastEdited: string;
  views: number;
}

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
  
  // Dashboard state
  const [currentView, setCurrentView] = useState<'dashboard' | 'project'>('dashboard');
  const [activeProject, setActiveProject] = useState<Project | null>(null);
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
    ? `https://pitchvoid.lovable.app/p/${activeProject.id}` 
    : 'https://pitchvoid.lovable.app/p/demo';
  
  // Credits
  const credits = { used: 48, total: 50 };
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Mock data
  const [projects, setProjects] = useState<Project[]>([
    { id: '1', title: 'Senior PM Interview - Google', tags: ['Job interview'], lastEdited: '2 hours ago', views: 47 },
    { id: '2', title: 'Marketing Proposal - Acme Corp', tags: ['Client pitch'], lastEdited: 'Yesterday', views: 23 },
    { id: '3', title: 'Series A Investor Deck', tags: ['Fundraising'], lastEdited: '3 days ago', views: 156 },
  ]);

  const quickTemplates = [
    { id: 1, label: 'Job Interview', icon: '💼', prefill: 'Pitch me for a [Role] at [Company]. Focus on [Key Skills].' },
    { id: 2, label: 'Client Pitch', icon: '🤝', prefill: 'Create a proposal for [Client] about [Project].' },
    { id: 3, label: 'Investor Deck', icon: '📈', prefill: 'Build a Series [X] pitch for [Startup].' },
    { id: 4, label: 'Conference Talk', icon: '🎤', prefill: 'Prepare a talk on [Topic] for [Event].' },
  ];

  useEffect(() => {
    if (!loading && !user) {
      // Allow guest access for now
    }
  }, [user, loading]);

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

  const handleCreateProject = () => {
    if (newProjectName.trim()) {
      const newProject: Project = {
        id: Date.now().toString(),
        title: newProjectName,
        tags: newProjectTags.split(',').map(t => t.trim()).filter(Boolean),
        lastEdited: 'Just now',
        views: 0
      };
      setProjects([newProject, ...projects]);
      setNewProjectName('');
      setNewProjectTags('');
      setShowNewProjectModal(false);
      openProject(newProject);
    }
  };

  const openProject = (project: Project) => {
    setActiveProject(project);
    setMessages([{ id: '1', type: 'system', content: `Welcome to "${project.title}". Describe your scenario to get started.` }]);
    setCurrentView('project');
  };

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
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  const MAX_FILES = 5;
  const ACCEPTED_TYPES = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/png', 'image/jpeg', 'image/webp'];
  
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

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
    const validFiles = fileArray.filter(file => {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        toast({ title: 'Invalid file type', description: `${file.name} is not supported`, variant: 'destructive' });
        return false;
      }
      if (file.size > MAX_FILE_SIZE) {
        toast({ title: 'File too large', description: `${file.name} exceeds 10MB limit`, variant: 'destructive' });
        return false;
      }
      return true;
    });

    if (attachedFiles.length + validFiles.length > MAX_FILES) {
      toast({ title: 'Too many files', description: `Maximum ${MAX_FILES} files allowed`, variant: 'destructive' });
      return;
    }

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
      
      const formatLabels: Record<OutputFormat, string> = {
        'one-pager': 'One-Pager',
        'script': 'Script'
      };
      
      setActiveProject({ 
        id: Date.now().toString(), 
        title: parsedContext?.summary || 'Quick Pitch', 
        tags: [formatLabels[outputFormat]], 
        lastEdited: 'Just now', 
        views: 0 
      });

      if (outputFormat === 'one-pager') {
        setOnePagerData(data.onePager);
        setScriptData(null);
        setMessages([{ id: '1', type: 'system', content: 'Your one-pager is ready!' }]);
      } else {
        setScriptData(data.script);
        setOnePagerData(null);
        setMessages([{ id: '1', type: 'system', content: `Your script is ready! ${data.script?.sections?.length || 5} sections created.` }]);
      }
      
      // Increment pitch count on successful generation
      await incrementPitchCount();
      
      // Reset Quick Pitch state
      resetQuickPitchState();
      
    } catch (error) {
      clearInterval(phaseInterval);
      console.error('Generation error:', error);
      setIsGenerating(false);
      
      // Fallback to mock data
      setShowQuickPitch(false);
      setCurrentView('project');
      setActiveProject({ id: Date.now().toString(), title: parsedContext?.summary || 'Quick Pitch', tags: [outputFormat], lastEdited: 'Just now', views: 0 });
      
      if (outputFormat === 'one-pager') {
        setOnePagerData({
          headline: "Senior Product Manager Ready to Scale",
          subheadline: "8+ years leading consumer products from 0 to 1M+ users with proven expertise in AI-powered features",
          sections: [
            { type: 'key-points', title: 'Key Achievements', content: 'Proven track record of shipping products that scale', bullets: ['Led mobile app redesign: +47% DAU, -23% churn', 'Launched AI features to 50M+ users', 'Managed cross-functional teams of 15+'] },
            { type: 'value-prop', title: 'Why Me', content: 'Unique blend of technical depth and product intuition', bullets: ['User-centric discovery methodology', 'Data-driven decision making', 'Rapid prototyping expertise'] },
            { type: 'cta', title: "Let's Connect", content: 'Ready to bring my experience to your next chapter. Schedule a conversation today.' }
          ]
        });
        setScriptData(null);
        setMessages([{ id: '1', type: 'system', content: 'Your one-pager is ready!' }]);
      } else {
        setScriptData({
          title: parsedContext?.summary || 'Interview Script',
          total_duration: '2-3 minutes',
          sections: [
            { name: 'Opening', duration: '15 seconds', content: 'Thank you for having me. I\'m excited to share why I believe I\'m the right fit for this role.', cue: 'Make eye contact, smile, project confidence.' },
            { name: 'Background', duration: '30 seconds', content: 'I\'ve spent the last 8 years scaling consumer products from zero to millions of users. Most recently, I led a mobile redesign that increased daily active users by 47%.', cue: 'Lean in slightly, emphasize the numbers.' },
            { name: 'Value', duration: '45 seconds', content: 'What sets me apart is my approach: I combine deep user research with rapid experimentation. I don\'t just build features—I validate them with data first.', cue: 'Use hand gestures to illustrate points.' },
            { name: 'Close', duration: '20 seconds', content: 'I\'m ready to bring this experience to your team. I\'d love to discuss how I can contribute to your next chapter.', cue: 'End with genuine enthusiasm. Pause for effect.' }
          ],
          key_phrases: ['47% increase in DAU', 'Zero to millions', 'Data-driven decisions']
        });
        setOnePagerData(null);
        setMessages([{ id: '1', type: 'system', content: 'Your script is ready!' }]);
      }
      
      resetQuickPitchState();
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

    } catch (error) {
      clearInterval(phaseInterval);
      console.error('Regeneration error:', error);
      toast({ 
        title: 'Regeneration failed', 
        description: 'Using fallback content', 
        variant: 'destructive' 
      });
      
      // Fallback content
      if (newFormat === 'one-pager') {
        setOnePagerData({
          headline: "Your Pitch, Reimagined",
          subheadline: "A concise executive summary based on your original content",
          sections: [
            { type: 'key-points', title: 'Key Points', content: 'Your main strengths and value proposition', bullets: ['Point 1', 'Point 2', 'Point 3'] },
            { type: 'cta', title: 'Next Steps', content: 'Ready to discuss further.' }
          ]
        });
      } else {
        setScriptData({
          title: 'Speaking Script',
          total_duration: '2-3 minutes',
          sections: [
            { name: 'Opening', duration: '20 seconds', content: 'Your opening hook goes here.', cue: 'Make eye contact.' },
            { name: 'Close', duration: '15 seconds', content: 'Your closing statement.', cue: 'Pause for effect.' }
          ],
          key_phrases: ['Key phrase 1', 'Key phrase 2']
        });
      }
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
    <div className="min-h-screen bg-background transition-colors duration-300">
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
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

            {/* Projects Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {projects.map(project => (
                <button
                  key={project.id}
                  onClick={() => openProject(project)}
                  className="project-card p-4 sm:p-6 text-left group"
                >
                  <h3 className="text-foreground font-medium text-base sm:text-lg mb-2 group-hover:text-primary transition-colors">
                    {project.title}
                  </h3>
                  <div className="flex flex-wrap gap-2 mb-3 sm:mb-4">
                    {project.tags.map((tag, i) => (
                      <span key={i} className="px-2 py-1 rounded-full text-xs bg-accent/10 text-accent">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                    <span>{project.lastEdited}</span>
                    <span>•</span>
                    <span>{project.views} views</span>
                  </div>
                </button>
              ))}
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
        <div className="min-h-screen flex flex-col lg:flex-row">
          {/* Chat Panel */}
          <div className="w-full lg:w-[40%] flex flex-col border-b lg:border-b-0 lg:border-r border-accent/10 max-h-[50vh] lg:max-h-none">
            <header className="glassmorphism px-4 sm:px-5 py-3 sm:py-4 flex items-center gap-3 sm:gap-4">
              <button 
                onClick={() => setCurrentView('dashboard')} 
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex-1 min-w-0">
                <h1 className="text-foreground font-medium text-sm sm:text-base truncate">{activeProject.title}</h1>
              </div>
              <span className="text-xs text-muted-foreground whitespace-nowrap">{credits.total - credits.used} credits</span>
            </header>
            
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
            
            {/* One-Pager Editor - for one-pagers */}
            {onePagerData && (
              <div className="p-3 sm:p-4 border-t border-accent/10 max-h-[50vh] overflow-y-auto">
                <OnePagerEditor
                  data={onePagerData}
                  onUpdate={(updatedData) => setOnePagerData(updatedData)}
                />
              </div>
            )}
            
            {/* Input */}
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
          </div>

          {/* Preview Panel */}
          <div className="flex-1 grain-bg flex flex-col relative min-h-[50vh] lg:min-h-0">
            <header className="px-4 sm:px-6 py-3 sm:py-4 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:justify-between border-b border-border relative z-10">
              <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
                <div>
                  <h2 className="text-foreground font-medium font-display text-sm sm:text-base">Preview</h2>
                  {isRegenerating && (
                    <p className="text-xs text-primary animate-pulse">{generationPhase}</p>
                  )}
                  {!isRegenerating && outputFormat === 'one-pager' && onePagerData && (
                    <p className="text-xs text-muted-foreground hidden sm:block">One-pager executive summary</p>
                  )}
                  {!isRegenerating && outputFormat === 'script' && scriptData && (
                    <p className="text-xs text-muted-foreground hidden sm:block">Speaking script with delivery cues</p>
                  )}
                </div>
                
                {/* Format Toggle - Only show when content exists */}
                {(onePagerData || scriptData) && (
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
                )}
              </div>
              
              {(onePagerData || scriptData) && (
                <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-end">
                  {/* Practice mode - for scripts only */}
                  {outputFormat === 'script' && scriptData && (
                    <button 
                      onClick={() => setIsPracticeMode(true)} 
                      className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm text-accent border border-accent/30 flex items-center gap-1 sm:gap-2 hover:bg-accent/10 transition-colors"
                    >
                      <Play className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="hidden sm:inline">Practice</span>
                    </button>
                  )}
                  <button 
                    onClick={() => setShowShareModal(true)} 
                    className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm text-white magenta-gradient flex items-center gap-1 sm:gap-2"
                  >
                    <Share2 className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">Share</span>
                  </button>
                </div>
              )}
            </header>
            
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 relative z-10">
              {/* Render based on active outputFormat */}
              {outputFormat === 'script' && scriptData ? (
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
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <div 
                      className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 rounded-2xl flex items-center justify-center bg-gradient-to-br from-accent/15 to-primary/8 border border-dashed border-accent/30"
                    >
                      <span className="text-3xl sm:text-4xl text-accent/50">📄</span>
                    </div>
                    <p className="text-muted-foreground text-sm">Your pitch will appear here</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Quick Pitch Modal - 5 Steps: Describe → Confirm → Context → Tune → Generate */}
      {showQuickPitch && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center modal-overlay p-4" 
          onClick={() => { setShowQuickPitch(false); resetQuickPitchState(); }}
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
                onClick={() => { setShowQuickPitch(false); resetQuickPitchState(); }} 
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
                <p className="text-sm text-muted-foreground mb-4">🎯 What do you need to pitch?</p>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-4 sm:mb-6">
                  {quickTemplates.map(t => (
                    <button 
                      key={t.id} 
                      onClick={() => setTranscribedText(t.prefill)} 
                      className="p-3 sm:p-4 rounded-xl text-center border border-accent/20 hover:border-accent/40 transition-colors"
                    >
                      <span className="text-xl sm:text-2xl mb-1 sm:mb-2 block">{t.icon}</span>
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
                  <Check className="w-5 h-5 text-green-500" />
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
                      {parsedContext.suggested_format === 'one-pager' ? '📄 One-Pager' : '📝 Script'}
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
                <p className="text-sm text-muted-foreground mb-4">📎 Anything to help me help you? (optional)</p>
                
                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.docx,.doc,.png,.jpg,.jpeg,.webp"
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
                    PDF, DOCX, PNG, JPG up to 10MB
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
                  <p className="text-xs text-muted-foreground mb-2">💡 Specific points to highlight (optional)</p>
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
                <p className="text-sm text-muted-foreground mb-4">⚙️ Any preferences? (or use smart defaults)</p>
                
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

            {/* Step 5: Generating */}
            {quickPitchStep === 5 && (
              <div className="py-8 sm:py-12 text-center">
                <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-6 relative">
                  <div className="absolute inset-0 rounded-full magenta-gradient opacity-20 animate-ping" />
                  <div 
                    className="absolute inset-2 rounded-full flex items-center justify-center"
                    style={{ background: 'rgba(15, 5, 24, 0.9)', border: '2px solid rgba(217, 70, 239, 0.4)' }}
                  >
                    <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 text-primary animate-spin" />
                  </div>
                </div>
                <p className="text-foreground font-medium text-sm sm:text-base">{generationPhase}</p>
                <p className="text-muted-foreground text-xs mt-2">This usually takes 10-15 seconds</p>
              </div>
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
