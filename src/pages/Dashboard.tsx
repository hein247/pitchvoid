import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { 
  Sparkles, 
  Upload, 
  FileText, 
  Send, 
  LogOut, 
  Loader2,
  Coins,
  FolderOpen,
  MessageSquare,
  Trash2,
  Layers,
  MessageCircle
} from 'lucide-react';
import GridBackground from '@/components/ui/GridBackground';
import GlassCard from '@/components/ui/GlassCard';
import ShimmerButton from '@/components/ui/ShimmerButton';
import LiveSlideEditor from '@/components/dashboard/LiveSlideEditor';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface UploadedFile {
  name: string;
  size: number;
  type: string;
  file: File;
}

type DashboardView = 'chat' | 'editor';

const Dashboard = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [credits, setCredits] = useState<number>(10);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [currentView, setCurrentView] = useState<DashboardView>('chat');
  const [currentProjectId, setCurrentProjectId] = useState<string | undefined>();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Welcome to PitchVoid! 👋 I'm here to help you create stunning pitch presentations. Start by uploading your PDF or DOCX files, then describe your pitch scenario. What are you pitching today?"
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchCredits();
    }
  }, [user]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchCredits = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('profiles')
      .select('credits')
      .eq('id', user.id)
      .maybeSingle();
    
    if (data) {
      setCredits(data.credits ?? 10);
    }
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
    
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      handleFiles(files);
    }
  };

  const handleFiles = (files: File[]) => {
    const validFiles = files.filter(file => {
      const validDocTypes = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];
      const validImageTypes = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp'
      ];
      const isValidType = validDocTypes.includes(file.type) || validImageTypes.includes(file.type);
      
      if (!isValidType) {
        toast({
          variant: 'destructive',
          title: 'Invalid file type',
          description: `${file.name} is not a supported file type (PDF, DOCX, JPG, PNG, GIF, WebP).`,
        });
        return false;
      }
      
      if (file.size > 10 * 1024 * 1024) {
        toast({
          variant: 'destructive',
          title: 'File too large',
          description: `${file.name} exceeds 10MB limit.`,
        });
        return false;
      }
      
      return true;
    });

    const newFiles: UploadedFile[] = validFiles.map(file => ({
      name: file.name,
      size: file.size,
      type: file.type,
      file
    }));

    setUploadedFiles(prev => [...prev, ...newFiles]);
    
    if (newFiles.length > 0) {
      toast({
        title: 'Files uploaded',
        description: `${newFiles.length} file(s) ready for processing.`,
      });
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isSending) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = inputMessage;
    setInputMessage('');
    setIsSending(true);

    try {
      // Check if user wants to generate slides
      const generateKeywords = ['generate', 'create', 'make', 'build', 'slides', 'presentation', 'pitch deck'];
      const shouldGenerate = generateKeywords.some(kw => currentInput.toLowerCase().includes(kw)) && uploadedFiles.length > 0;

      if (shouldGenerate) {
        // Call the AI edge function to generate pitch
        const response = await supabase.functions.invoke('generate-pitch', {
          body: {
            scenario: currentInput,
            targetAudience: extractAudience(currentInput),
            documentContext: `User has uploaded ${uploadedFiles.length} document(s): ${uploadedFiles.map(f => f.name).join(', ')}`,
          },
        });

        if (response.error) {
          throw new Error(response.error.message || 'Failed to generate pitch');
        }

        const { slides } = response.data;
        
        // Format slides for display
        const slideContent = slides.map((slide: any, idx: number) => 
          `**Slide ${idx + 1}: ${slide.content.title}**\n${slide.content.description}${slide.content.bullets ? '\n• ' + slide.content.bullets.join('\n• ') : ''}\n_Animation: ${slide.animation.type} (${slide.animation.speed})_`
        ).join('\n\n---\n\n');

        const aiResponse: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `🎯 **Your Anti-Gravity Pitch Deck is Ready!**\n\nI've analyzed your documents and created a 5-slide presentation:\n\n${slideContent}\n\n---\n\n✨ Would you like me to:\n• Adjust the tone or style?\n• Add more detail to specific slides?\n• Generate alternative versions?`,
        };
        setMessages(prev => [...prev, aiResponse]);
      } else {
        // Regular conversational response
        const aiResponse: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: generateAIResponse(currentInput, uploadedFiles.length),
        };
        setMessages(prev => [...prev, aiResponse]);
      }
    } catch (error) {
      console.error('Error:', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `I encountered an issue while generating your pitch. ${error instanceof Error ? error.message : 'Please try again.'}`,
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsSending(false);
    }
  };

  const extractAudience = (input: string): string => {
    const audiencePatterns = [
      { pattern: /investor/i, audience: 'Investors and VCs' },
      { pattern: /client/i, audience: 'Potential clients' },
      { pattern: /partner/i, audience: 'Business partners' },
      { pattern: /board/i, audience: 'Board of directors' },
      { pattern: /team/i, audience: 'Internal team' },
      { pattern: /sales/i, audience: 'Sales prospects' },
    ];
    
    for (const { pattern, audience } of audiencePatterns) {
      if (pattern.test(input)) return audience;
    }
    return 'General business audience';
  };

  const generateAIResponse = (input: string, fileCount: number): string => {
    if (fileCount === 0) {
      return "I'd love to help you create a pitch! Please upload your PDF or DOCX files first so I can understand your content. You can drag and drop files into the upload area on the left, or click to browse.";
    }
    
    const lowerInput = input.toLowerCase();
    
    if (lowerInput.includes('investor') || lowerInput.includes('funding')) {
      return "Great! For an investor pitch, I'll focus on:\n\n• **Problem & Solution** - Clear value proposition\n• **Market Size** - TAM, SAM, SOM analysis\n• **Business Model** - Revenue streams\n• **Traction** - Key metrics and growth\n• **Team** - Founder backgrounds\n• **Ask** - Funding amount and use of funds\n\nWould you like me to generate slides based on your uploaded documents?";
    }
    
    if (lowerInput.includes('client') || lowerInput.includes('sales')) {
      return "Perfect! For a client pitch, I'll emphasize:\n\n• **Your Understanding** of their challenges\n• **Your Solution** and unique approach\n• **Case Studies** - Similar success stories\n• **Process** - How you work together\n• **Pricing** - Clear and transparent\n\nShall I analyze your documents and create a tailored pitch deck?";
    }
    
    return `I see you've uploaded ${fileCount} file(s). Tell me more about your pitch:\n\n• **Who is your audience?** (investors, clients, partners)\n• **What's the main goal?** (funding, sales, partnership)\n• **What tone do you want?** (professional, casual, bold)\n\nThis will help me create the perfect Anti-Gravity animated slides for you!`;
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">

      {/* Header */}
      <header className="border-b border-[rgba(255,255,255,0.08)] bg-[rgba(5,1,13,0.8)] backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            {/* Logo with Magenta Glow */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/30 blur-xl rounded-full" />
                <div className="relative w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center shadow-[0_0_25px_hsl(var(--primary)/0.5)]">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
              </div>
              <span className="font-display text-xl font-medium tracking-wide">PitchVoid</span>
            </div>

            {/* View Tabs with Smooth Transitions */}
            <div className="flex items-center gap-1 bg-[rgba(255,255,255,0.03)] p-1.5 border border-[rgba(255,255,255,0.08)] rounded-lg">
              <button
                onClick={() => setCurrentView('chat')}
                className={`
                  flex items-center gap-2 px-5 py-2.5 text-sm font-sans tracking-wide transition-all duration-300 rounded-md
                  ${currentView === 'chat'
                    ? 'bg-gradient-to-r from-primary/20 to-accent/20 text-foreground shadow-[0_0_15px_hsl(var(--primary)/0.3)]'
                    : 'text-muted-foreground hover:text-foreground hover:bg-[rgba(255,255,255,0.05)]'
                  }
                `}
              >
                <MessageCircle className="w-4 h-4" />
                <span className="tracking-[0.08em]">Chat</span>
              </button>
              <button
                onClick={() => setCurrentView('editor')}
                className={`
                  flex items-center gap-2 px-5 py-2.5 text-sm font-sans tracking-wide transition-all duration-300 rounded-md
                  ${currentView === 'editor'
                    ? 'bg-gradient-to-r from-primary/20 to-accent/20 text-foreground shadow-[0_0_15px_hsl(var(--primary)/0.3)]'
                    : 'text-muted-foreground hover:text-foreground hover:bg-[rgba(255,255,255,0.05)]'
                  }
                `}
              >
                <Layers className="w-4 h-4" />
                <span className="tracking-[0.08em]">Slide Editor</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-5">
            <div className="flex items-center gap-2 px-4 py-2 bg-[rgba(255,255,255,0.03)] border border-gold/20 rounded-lg backdrop-blur-sm">
              <Coins className="w-4 h-4 text-gold" />
              <span className="text-sm font-medium font-sans tracking-wide">{credits} credits</span>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleSignOut} 
              className="gap-2 text-muted-foreground hover:text-foreground hover:bg-[rgba(255,255,255,0.05)] font-sans tracking-wide"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content with Smooth Tab Transitions */}
      <main className="flex-1 relative z-10">
        <AnimatePresence mode="wait">
          {currentView === 'chat' ? (
            <motion.div
              key="chat"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.35, ease: "easeInOut" }}
              className="max-w-7xl mx-auto w-full p-6 h-[calc(100vh-5rem)]"
            >
              <div className="grid lg:grid-cols-2 gap-6 h-full">
          {/* File Upload Section */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col"
          >
            <div className="mb-4">
              <h2 className="font-display text-2xl mb-1 tracking-wide">Upload Documents</h2>
              <p className="text-sm text-muted-foreground">
                Drop your PDF, DOCX, or image files to analyze
              </p>
            </div>

            {/* Dropzone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`
                flex-1 min-h-[200px] cursor-pointer
                flex flex-col items-center justify-center gap-4 p-8
                transition-all duration-300
                bg-[rgba(255,255,255,0.03)] backdrop-blur-[10px]
                border-2 border-dashed
                ${isDragging 
                  ? 'border-[hsl(263,70%,58%)] bg-[rgba(139,92,246,0.1)] shadow-[0_0_30px_rgba(139,92,246,0.2)]' 
                  : 'border-[rgba(255,255,255,0.15)] hover:border-[rgba(255,255,255,0.25)] hover:bg-[rgba(255,255,255,0.05)]'
                }
              `}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.jpg,.jpeg,.png,.gif,.webp"
                multiple
                onChange={handleFileInput}
                className="hidden"
              />
              
              <motion.div
                animate={{ y: isDragging ? -5 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <Upload className={`w-12 h-12 ${isDragging ? 'text-[hsl(263,70%,58%)]' : 'text-muted-foreground'}`} />
              </motion.div>
              
              <div className="text-center">
                <p className="font-medium">
                  {isDragging ? 'Drop files here' : 'Drag & drop files here'}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  or click to browse (PDF, DOCX, images up to 10MB)
                </p>
              </div>
            </div>

            {/* Uploaded Files List */}
            <AnimatePresence>
              {uploadedFiles.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <FolderOpen className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">
                      {uploadedFiles.length} file{uploadedFiles.length > 1 ? 's' : ''} uploaded
                    </span>
                  </div>
                  
                  <div className="space-y-2 max-h-[200px] overflow-y-auto">
                    {uploadedFiles.map((file, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        className="flex items-center justify-between p-3 bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] backdrop-blur-sm"
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="w-5 h-5 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium truncate max-w-[200px]">
                              {file.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatFileSize(file.size)}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(index)}
                          className="h-8 w-8 p-0 hover:bg-destructive/10"
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Chat Section */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <GlassCard hover={false} glow={false} className="flex flex-col h-full p-0">
              <div className="p-4 border-b border-[rgba(255,255,255,0.1)]">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-[hsl(263,70%,58%)]" />
                  <h2 className="font-display text-lg tracking-wide">Pitch Assistant</h2>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`
                        max-w-[85%] p-4 
                        ${message.role === 'user' 
                          ? 'bg-gradient-to-r from-[hsl(263,70%,58%)] to-[hsl(217,91%,60%)] text-white' 
                          : 'bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)]'
                        }
                      `}
                    >
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    </div>
                  </motion.div>
                ))}
                
                {isSending && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-start"
                  >
                    <div className="bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] p-4">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-[hsl(263,70%,58%)] rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-[hsl(263,70%,58%)] rounded-full animate-bounce [animation-delay:0.1s]" />
                        <div className="w-2 h-2 bg-[hsl(263,70%,58%)] rounded-full animate-bounce [animation-delay:0.2s]" />
                      </div>
                    </div>
                  </motion.div>
                )}
                
                <div ref={chatEndRef} />
              </div>

              {/* Input */}
              <form onSubmit={handleSendMessage} className="p-4 border-t border-[rgba(255,255,255,0.1)]">
                <div className="flex gap-2">
                  <Input
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder="Describe your pitch scenario..."
                    className="flex-1 bg-[rgba(255,255,255,0.03)] border-[rgba(255,255,255,0.1)] focus:border-[rgba(139,92,246,0.5)] focus:ring-[rgba(139,92,246,0.3)]"
                    disabled={isSending}
                  />
                  <ShimmerButton 
                    onClick={() => {}} 
                    className="h-10 w-10 px-0"
                  >
                    <Send className="w-4 h-4" />
                  </ShimmerButton>
                </div>
              </form>
            </GlassCard>
          </motion.div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="editor"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.35, ease: "easeInOut" }}
              className="h-[calc(100vh-5rem)]"
            >
              <LiveSlideEditor projectId={currentProjectId} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default Dashboard;
