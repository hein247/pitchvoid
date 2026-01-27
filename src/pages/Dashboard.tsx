import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Mic, Plus, ArrowLeft, X, Play, Share2, Home, ChevronLeft, ChevronRight } from 'lucide-react';
import Navbar from '@/components/Navbar';
import SlideGrid from '@/components/dashboard/SlideGrid';
import RefinementPanel from '@/components/dashboard/RefinementPanel';
import { useSwipeGesture } from '@/hooks/useSwipeGesture';

interface Project {
  id: string;
  title: string;
  tags: string[];
  lastEdited: string;
  slides: number;
  views: number;
}

interface Slide {
  id: number;
  title: string;
  content: string;
  speakerNotes: string;
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
  
  // Slides state
  const [showSlides, setShowSlides] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);
  const [showRefinements, setShowRefinements] = useState(false);
  
  // Quick pitch state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [transcribedText, setTranscribedText] = useState('');
  const [quickPitchStep, setQuickPitchStep] = useState(1);
  
  // Practice mode
  const [isPracticeMode, setIsPracticeMode] = useState(false);
  const [practiceSlide, setPracticeSlide] = useState(0);
  const [practiceTimer, setPracticeTimer] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Share modal
  const [shareLink] = useState('pitchvoid.com/p/my-pitch');
  const [copied, setCopied] = useState(false);
  const [shareSettings, setShareSettings] = useState({ password: false, expiry: false });
  
  // Credits
  const credits = { used: 48, total: 50 };
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Mock data
  const [projects, setProjects] = useState<Project[]>([
    { id: '1', title: 'Senior PM Interview - Google', tags: ['Job interview'], lastEdited: '2 hours ago', slides: 6, views: 47 },
    { id: '2', title: 'Marketing Proposal - Acme Corp', tags: ['Client pitch'], lastEdited: 'Yesterday', slides: 8, views: 23 },
    { id: '3', title: 'Series A Investor Deck', tags: ['Fundraising'], lastEdited: '3 days ago', slides: 12, views: 156 },
  ]);

  const generatedSlides: Slide[] = [
    { id: 1, title: 'About Me', content: 'Product leader with 8+ years scaling consumer apps from 0→1M+ users.', speakerNotes: 'Start with confidence. 15 seconds max.' },
    { id: 2, title: 'Understanding the Challenge', content: 'Google Search faces evolving user expectations: AI-native experiences.', speakerNotes: 'Pause here for emphasis.' },
    { id: 3, title: 'My Approach', content: 'User-centric discovery → Data validation → Rapid prototyping.', speakerNotes: 'Use hand gestures. 20 seconds.' },
    { id: 4, title: 'Key Achievement', content: 'Led mobile app redesign: +47% DAU, -23% churn.', speakerNotes: 'Emphasize the numbers.' },
    { id: 5, title: 'Why Google, Why Now', content: 'Your mission aligns with my passion for building products at scale.', speakerNotes: 'Be genuine. Show enthusiasm.' },
    { id: 6, title: "Let's Build Together", content: 'Ready to bring my experience to Google\'s next chapter.', speakerNotes: 'Strong close. Smile.' }
  ];

  // Refinement state
  const [isApplyingRefinements, setIsApplyingRefinements] = useState(false);
  const [slidesHistory, setSlidesHistory] = useState<typeof generatedSlides[]>([]);

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
      if (isPracticeMode) {
        if (e.key === 'ArrowRight') setPracticeSlide(prev => Math.min(generatedSlides.length - 1, prev + 1));
        if (e.key === 'ArrowLeft') setPracticeSlide(prev => Math.max(0, prev - 1));
        if (e.key === ' ') { e.preventDefault(); setIsPlaying(prev => !prev); }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPracticeMode]);

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  const handleCreateProject = () => {
    if (newProjectName.trim()) {
      const newProject: Project = {
        id: Date.now().toString(),
        title: newProjectName,
        tags: newProjectTags.split(',').map(t => t.trim()).filter(Boolean),
        lastEdited: 'Just now',
        slides: 0,
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
    setShowSlides(project.slides > 0);
    setShowRefinements(project.slides > 0);
    setCurrentView('project');
  };

  const handleSubmit = () => {
    if (!inputValue.trim()) return;
    setMessages(prev => [...prev, { id: Date.now().toString(), type: 'user', content: inputValue }]);
    setInputValue('');
    setIsGenerating(true);
    setShowSlides(false);
    
    const phases = ['Analyzing...', 'Crafting narrative...', 'Designing slides...', 'Finalizing...'];
    let delay = 0;
    phases.forEach(phase => { 
      setTimeout(() => setGenerationPhase(phase), delay); 
      delay += 1500; 
    });
    
    setTimeout(() => {
      setIsGenerating(false);
      setGenerationPhase('');
      setShowSlides(true);
      setShowRefinements(true);
      setMessages(prev => [...prev, { id: Date.now().toString(), type: 'assistant', content: 'Your pitch is ready! 6 slides created.' }]);
    }, delay);
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    setTimeout(() => {
      setTranscribedText("Pitch me for a Senior Product Manager role at Google. Focus on my experience scaling mobile apps.");
      setQuickPitchStep(2);
    }, 1000);
  };

  const handleQuickGenerate = () => {
    setQuickPitchStep(3);
    setIsGenerating(true);
    const phases = ['Analyzing input...', 'Processing files...', 'Crafting narrative...', 'Designing slides...', 'Finalizing...'];
    let i = 0;
    const interval = setInterval(() => {
      if (i < phases.length) { 
        setGenerationPhase(phases[i]); 
        i++; 
      } else {
        clearInterval(interval);
        setIsGenerating(false);
        setShowSlides(true);
        setShowQuickPitch(false);
        setShowRefinements(true);
        setCurrentView('project');
        setActiveProject({ id: Date.now().toString(), title: 'Quick Pitch - Google PM', tags: ['Interview'], lastEdited: 'Just now', slides: 6, views: 0 });
        setMessages([{ id: '1', type: 'system', content: 'Your pitch is ready! 6 slides created.' }]);
      }
    }, 1500);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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

  // Practice Mode View
  if (isPracticeMode) {
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
              Slide {practiceSlide + 1}/{generatedSlides.length}
            </span>
            <h2 className="text-3xl sm:text-5xl lg:teleprompter-text text-foreground mb-4 sm:mb-8 font-display">
              {generatedSlides[practiceSlide].title}
            </h2>
            <p className="text-lg sm:text-2xl text-muted-foreground mb-8 sm:mb-12">
              {generatedSlides[practiceSlide].content}
            </p>
            <div className="p-4 sm:p-6 rounded-2xl bg-accent/10 border border-accent/20 max-w-2xl mx-auto">
              <p className="text-xs text-accent uppercase mb-2">Speaker Notes</p>
              <p className="text-sm sm:text-base text-muted-foreground">{generatedSlides[practiceSlide].speakerNotes}</p>
            </div>
          </div>
        </div>
        
        <div className="p-4 sm:p-8 flex items-center justify-center gap-4 sm:gap-8">
          <button 
            onClick={() => setPracticeSlide(Math.max(0, practiceSlide - 1))} 
            disabled={practiceSlide === 0} 
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
            onClick={() => setPracticeSlide(Math.min(generatedSlides.length - 1, practiceSlide + 1))} 
            disabled={practiceSlide === generatedSlides.length - 1} 
            className="w-12 h-12 sm:w-14 sm:h-14 rounded-full border border-border flex items-center justify-center text-muted-foreground disabled:opacity-30"
          >
            →
          </button>
        </div>
      </div>
    );
  }

  // Swipe gesture for slide navigation
  const { containerRef: swipeRef } = useSwipeGesture({
    onSwipeLeft: () => setActiveSlide(prev => Math.min(generatedSlides.length - 1, prev + 1)),
    onSwipeRight: () => setActiveSlide(prev => Math.max(0, prev - 1)),
    enabled: showSlides && currentView === 'project',
  });

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
              <button onClick={() => setShowInstallPrompt(false)} className="px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm text-muted-foreground">Later</button>
              <button className="px-3 sm:px-5 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm text-white font-medium magenta-gradient">Install</button>
            </div>
          </div>
        </div>
      )}

      {/* Dashboard View */}
      {currentView === 'dashboard' && (
        <div className={`min-h-screen grain-bg ${showInstallPrompt ? 'pt-16' : ''}`}>
          {/* Nav */}
          <Navbar 
            variant="dashboard" 
            credits={credits}
            onQuickPitch={() => setShowQuickPitch(true)}
            onSignOut={handleSignOut}
          />

          {/* Projects Grid */}
          <main className="px-4 sm:px-6 lg:px-8 py-8 sm:py-10 max-w-7xl mx-auto relative z-10">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 sm:mb-10">
              <div className="space-y-1">
                <h2 className="text-2xl sm:text-3xl text-foreground font-display">Your Pitches</h2>
                <p className="text-sm sm:text-base text-muted-foreground">{projects.length} projects</p>
              </div>
              <button 
                onClick={() => setShowNewProjectModal(true)} 
                className="flex items-center gap-2 px-5 py-3 rounded-xl text-foreground font-medium border border-accent/30 hover:bg-accent/10 transition-colors w-full sm:w-auto justify-center"
              >
                <Plus className="w-5 h-5" />
                New Project
              </button>
            </div>
            
            {/* Single column on mobile for reduced cognitive load, 2-3 columns on larger screens */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 sm:gap-6">
              {projects.map((project, i) => (
                <div 
                  key={project.id} 
                  onClick={() => openProject(project)} 
                  className="project-card rounded-2xl overflow-hidden cursor-pointer group"
                >
                  <div className={`h-28 sm:h-32 thumbnail-gradient-${(i % 3) + 1} relative`}>
                    <div className="absolute bottom-3 left-3">
                      <span className="text-xs px-3 py-1 rounded-full bg-background/60 backdrop-blur-sm text-foreground/90 font-medium">
                        {project.tags[0] || 'Pitch'}
                      </span>
                    </div>
                  </div>
                  <div className="p-5 sm:p-6 space-y-2">
                    <h3 className="text-foreground font-medium text-base sm:text-lg group-hover:text-primary transition-colors leading-tight">
                      {project.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {project.lastEdited} · {project.slides} slides
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </main>

          {/* New Project Modal */}
          {showNewProjectModal && (
            <div 
              className="fixed inset-0 z-50 flex items-center justify-center modal-overlay" 
              onClick={() => setShowNewProjectModal(false)}
            >
              <div 
                className="glassmorphism-dark rounded-2xl p-8 w-full max-w-md animate-scaleIn" 
                onClick={e => e.stopPropagation()}
              >
                <h3 className="text-xl text-foreground mb-6 font-display">Create New Pitch</h3>
                <input 
                  type="text" 
                  value={newProjectName} 
                  onChange={e => setNewProjectName(e.target.value)} 
                  placeholder="Project name..." 
                  className="input-field w-full px-4 py-3 rounded-xl text-foreground placeholder-muted-foreground mb-4" 
                />
                <input 
                  type="text" 
                  value={newProjectTags} 
                  onChange={e => setNewProjectTags(e.target.value)} 
                  placeholder="Tags (comma separated)" 
                  className="input-field w-full px-4 py-3 rounded-xl text-foreground placeholder-muted-foreground mb-6" 
                />
                <div className="flex gap-3">
                  <button 
                    onClick={() => setShowNewProjectModal(false)} 
                    className="flex-1 py-3 rounded-xl text-muted-foreground border border-border"
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
            
            {/* Refinements Panel */}
            {showRefinements && (
              <div className="p-3 sm:p-4 border-t border-accent/10 max-h-[50vh] overflow-y-auto">
                <RefinementPanel
                  slides={generatedSlides}
                  projectTitle={activeProject?.title}
                  onApplyRefinements={(selectedIds) => {
                    // Save current state for undo
                    setSlidesHistory(prev => [...prev, generatedSlides]);
                    setIsApplyingRefinements(true);
                    
                    // Simulate applying refinements
                    setTimeout(() => {
                      setIsApplyingRefinements(false);
                      setMessages(prev => [...prev, { 
                        id: Date.now().toString(), 
                        type: 'assistant', 
                        content: `Applied refinements: ${selectedIds.join(', ')}` 
                      }]);
                    }, 2000);
                  }}
                  onUndo={() => {
                    if (slidesHistory.length > 0) {
                      // Could restore slides here if we had actual slide state management
                      setSlidesHistory(prev => prev.slice(0, -1));
                    }
                  }}
                  isApplying={isApplyingRefinements}
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
          <div 
            ref={swipeRef as React.RefObject<HTMLDivElement>}
            className="flex-1 grain-bg flex flex-col relative min-h-[50vh] lg:min-h-0"
          >
            <header className="px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between border-b border-border relative z-10">
              <div>
                <h2 className="text-foreground font-medium font-display text-sm sm:text-base">Preview</h2>
                {showSlides && (
                  <p className="text-xs text-muted-foreground hidden sm:block">Swipe or use ← → to navigate</p>
                )}
              </div>
              {showSlides && (
                <div className="flex items-center gap-2 sm:gap-3">
                  {/* Mobile navigation arrows */}
                  <div className="flex items-center gap-1 sm:hidden">
                    <button 
                      onClick={() => setActiveSlide(prev => Math.max(0, prev - 1))}
                      disabled={activeSlide === 0}
                      className="p-2 rounded-lg border border-accent/20 disabled:opacity-30 hover:bg-accent/10 transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-xs font-medium text-foreground min-w-[40px] text-center">
                      {activeSlide + 1}/{generatedSlides.length}
                    </span>
                    <button 
                      onClick={() => setActiveSlide(prev => Math.min(generatedSlides.length - 1, prev + 1))}
                      disabled={activeSlide === generatedSlides.length - 1}
                      className="p-2 rounded-lg border border-accent/20 disabled:opacity-30 hover:bg-accent/10 transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                  <button 
                    onClick={() => setIsPracticeMode(true)} 
                    className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm text-accent border border-accent/30 flex items-center gap-1 sm:gap-2 hover:bg-accent/10 transition-colors"
                  >
                    <Play className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">Practice</span>
                  </button>
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
              {showSlides ? (
                <SlideGrid 
                  slides={generatedSlides}
                  activeSlide={activeSlide}
                  onSlideSelect={setActiveSlide}
                />
              ) : (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <div 
                      className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 rounded-2xl flex items-center justify-center bg-gradient-to-br from-accent/15 to-primary/8 border border-dashed border-accent/30"
                    >
                      <span className="text-3xl sm:text-4xl text-accent/50">📊</span>
                    </div>
                    <p className="text-muted-foreground text-sm">Your pitch will appear here</p>
                  </div>
                </div>
              )}
            </div>
            
            {/* Progress dots for quick navigation */}
            {showSlides && (
              <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-border flex justify-center gap-2 relative z-10 bg-card/50 backdrop-blur-sm">
                {generatedSlides.map((_, i) => (
                  <button 
                    key={i} 
                    onClick={() => setActiveSlide(i)} 
                    className={`h-2 rounded-full transition-all duration-300 ${
                      activeSlide === i 
                        ? 'w-8 bg-gradient-to-r from-primary to-accent shadow-[0_0_10px_hsl(var(--primary)/0.5)]' 
                        : 'w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50'
                    }`} 
                    aria-label={`Go to slide ${i + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Quick Pitch Modal */}
      {showQuickPitch && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center modal-overlay p-4" 
          onClick={() => { setShowQuickPitch(false); setQuickPitchStep(1); setTranscribedText(''); }}
        >
          <div 
            className="glassmorphism-dark rounded-2xl p-4 sm:p-8 w-full max-w-2xl animate-scaleIn max-h-[90vh] overflow-y-auto" 
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <div>
                <h3 className="text-lg sm:text-xl text-foreground font-display">Quick Pitch</h3>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {quickPitchStep === 1 ? 'Speak or type' : quickPitchStep === 2 ? 'Attach files' : 'Generating...'}
                </p>
              </div>
              <button 
                onClick={() => { setShowQuickPitch(false); setQuickPitchStep(1); }} 
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Progress */}
            <div className="flex gap-2 mb-4 sm:mb-6">
              {[1, 2, 3].map(s => (
                <div 
                  key={s} 
                  className={`h-1 flex-1 rounded-full ${quickPitchStep >= s ? 'magenta-gradient' : 'bg-accent/20'}`} 
                />
              ))}
            </div>

            {/* Step 1: Input */}
            {quickPitchStep === 1 && (
              <div>
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
                  placeholder="Or type your pitch scenario..." 
                  className="w-full h-20 sm:h-24 p-3 sm:p-4 rounded-xl text-foreground input-field resize-none mb-4 sm:mb-6 text-sm" 
                />
                
                <div className="flex gap-3">
                  <button 
                    onClick={() => setShowQuickPitch(false)} 
                    className="flex-1 py-2.5 sm:py-3 rounded-xl text-muted-foreground border border-border text-sm"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={() => setQuickPitchStep(2)} 
                    disabled={!transcribedText.trim()} 
                    className="flex-1 py-2.5 sm:py-3 rounded-xl text-white font-medium magenta-gradient disabled:opacity-50 text-sm"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Files */}
            {quickPitchStep === 2 && (
              <div>
                <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
                  {[
                    { id: 1, name: 'Resume_2026.pdf', type: 'PDF', size: '142 KB' },
                    { id: 2, name: 'Portfolio_Case_Study.pdf', type: 'PDF', size: '2.1 MB' },
                  ].map(f => (
                    <label 
                      key={f.id} 
                      className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl border border-accent/20 cursor-pointer hover:border-accent/40 transition-colors"
                    >
                      <input type="checkbox" defaultChecked className="w-4 h-4 sm:w-5 sm:h-5 accent-primary" />
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-accent/20 flex items-center justify-center text-xs text-accent flex-shrink-0">
                        {f.type}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-foreground text-sm truncate">{f.name}</p>
                        <p className="text-muted-foreground text-xs">{f.size}</p>
                      </div>
                    </label>
                  ))}
                </div>
                
                <div className="flex gap-3">
                  <button 
                    onClick={() => setQuickPitchStep(1)} 
                    className="flex-1 py-2.5 sm:py-3 rounded-xl text-muted-foreground border border-border text-sm"
                  >
                    Back
                  </button>
                  <button 
                    onClick={handleQuickGenerate} 
                    className="flex-1 py-2.5 sm:py-3 rounded-xl text-white font-medium magenta-gradient text-sm"
                  >
                    Generate ⚡
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Generating */}
            {quickPitchStep === 3 && (
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
              </div>
            )}
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center modal-overlay p-4" 
          onClick={() => setShowShareModal(false)}
        >
          <div 
            className="glassmorphism-dark rounded-2xl p-4 sm:p-8 w-full max-w-lg animate-scaleIn max-h-[90vh] overflow-y-auto" 
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h3 className="text-lg sm:text-xl text-foreground font-display">Share Pitch</h3>
              <button onClick={() => setShowShareModal(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 mb-4 sm:mb-6">
              <div className="w-24 h-24 sm:w-32 sm:h-32 bg-card rounded-lg flex items-center justify-center flex-shrink-0 mx-auto sm:mx-0 border border-border">
                <span className="text-muted-foreground text-xs">QR Code</span>
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground mb-2 sm:mb-3">Share link</p>
                <div className="flex items-center gap-2 p-2 sm:p-3 rounded-xl bg-accent/10 border border-accent/20">
                  <input 
                    type="text" 
                    value={shareLink} 
                    readOnly 
                    className="flex-1 bg-transparent text-foreground text-xs sm:text-sm focus:outline-none min-w-0" 
                  />
                  <button 
                    onClick={handleCopyLink} 
                    className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium flex-shrink-0 ${
                      copied ? 'bg-green-500 text-white' : 'magenta-gradient text-white'
                    }`}
                  >
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-4 gap-2 sm:gap-3 mb-4 sm:mb-6">
              {[
                { name: 'WhatsApp', icon: '💬' },
                { name: 'LinkedIn', icon: '💼' },
                { name: 'Email', icon: '✉️' },
                { name: 'Twitter', icon: '🐦' }
              ].map(p => (
                <button 
                  key={p.name} 
                  className="flex flex-col items-center gap-1 sm:gap-2 p-2 sm:p-3 rounded-xl border border-accent/20 hover:border-accent/40 transition-colors"
                >
                  <span className="text-xl sm:text-2xl">{p.icon}</span>
                  <span className="text-[10px] sm:text-xs text-muted-foreground">{p.name}</span>
                </button>
              ))}
            </div>
            
            <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
              <label className="flex items-center justify-between p-3 sm:p-4 rounded-xl border border-accent/20">
                <p className="text-xs sm:text-sm text-foreground">Password protect</p>
                <button 
                  onClick={() => setShareSettings({ ...shareSettings, password: !shareSettings.password })} 
                  className={`w-10 h-5 sm:w-12 sm:h-6 rounded-full relative ${shareSettings.password ? 'magenta-gradient' : 'bg-muted'}`}
                >
                  <div 
                    className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-white absolute top-0.5 transition-all ${
                      shareSettings.password ? 'right-0.5' : 'left-0.5'
                    }`} 
                  />
                </button>
              </label>
              <label className="flex items-center justify-between p-3 sm:p-4 rounded-xl border border-accent/20">
                <p className="text-xs sm:text-sm text-foreground">Set expiry</p>
                <button 
                  onClick={() => setShareSettings({ ...shareSettings, expiry: !shareSettings.expiry })} 
                  className={`w-10 h-5 sm:w-12 sm:h-6 rounded-full relative ${shareSettings.expiry ? 'magenta-gradient' : 'bg-muted'}`}
                >
                  <div 
                    className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-white absolute top-0.5 transition-all ${
                      shareSettings.expiry ? 'right-0.5' : 'left-0.5'
                    }`} 
                  />
                </button>
              </label>
            </div>
            
            <button 
              onClick={() => setShowShareModal(false)} 
              className="w-full py-2.5 sm:py-3 rounded-xl text-white font-medium magenta-gradient text-sm"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
