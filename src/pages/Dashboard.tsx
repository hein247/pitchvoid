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
  X,
  Coins,
  FolderOpen,
  MessageSquare,
  Trash2
} from 'lucide-react';

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

const Dashboard = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [credits, setCredits] = useState<number>(10);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
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
      const isValidType = file.type === 'application/pdf' || 
        file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      
      if (!isValidType) {
        toast({
          variant: 'destructive',
          title: 'Invalid file type',
          description: `${file.name} is not a PDF or DOCX file.`,
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
    setInputMessage('');
    setIsSending(true);

    // Simulate AI response (in production, this would call your AI edge function)
    setTimeout(() => {
      const aiResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: generateAIResponse(inputMessage, uploadedFiles.length),
      };
      setMessages(prev => [...prev, aiResponse]);
      setIsSending(false);
    }, 1500);
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
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-foreground rounded-full flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-background" />
            </div>
            <span className="font-display text-xl font-medium">PitchVoid</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-4 py-2 bg-muted">
              <Coins className="w-4 h-4 text-gold" />
              <span className="text-sm font-medium">{credits} credits</span>
            </div>
            <Button variant="ghost" size="sm" onClick={handleSignOut} className="gap-2">
              <LogOut className="w-4 h-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-6">
        <div className="grid lg:grid-cols-2 gap-6 h-[calc(100vh-8rem)]">
          {/* File Upload Section */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col"
          >
            <div className="mb-4">
              <h2 className="font-display text-2xl mb-1">Upload Documents</h2>
              <p className="text-sm text-muted-foreground">
                Drop your PDF or DOCX files to analyze
              </p>
            </div>

            {/* Dropzone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`
                flex-1 min-h-[200px] border-2 border-dashed cursor-pointer
                flex flex-col items-center justify-center gap-4 p-8
                transition-all duration-300
                ${isDragging 
                  ? 'border-foreground bg-muted/50' 
                  : 'border-border hover:border-muted-foreground hover:bg-muted/30'
                }
              `}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx"
                multiple
                onChange={handleFileInput}
                className="hidden"
              />
              
              <motion.div
                animate={{ y: isDragging ? -5 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <Upload className={`w-12 h-12 ${isDragging ? 'text-foreground' : 'text-muted-foreground'}`} />
              </motion.div>
              
              <div className="text-center">
                <p className="font-medium">
                  {isDragging ? 'Drop files here' : 'Drag & drop files here'}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  or click to browse (PDF, DOCX up to 10MB)
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
                        className="flex items-center justify-between p-3 bg-muted"
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
            className="flex flex-col bg-card border border-border"
          >
            <div className="p-4 border-b border-border">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                <h2 className="font-display text-lg">Pitch Assistant</h2>
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
                        ? 'bg-foreground text-background' 
                        : 'bg-muted'
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
                  <div className="bg-muted p-4">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-foreground rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-foreground rounded-full animate-bounce [animation-delay:0.1s]" />
                      <div className="w-2 h-2 bg-foreground rounded-full animate-bounce [animation-delay:0.2s]" />
                    </div>
                  </div>
                </motion.div>
              )}
              
              <div ref={chatEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-border">
              <div className="flex gap-2">
                <Input
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Describe your pitch scenario..."
                  className="flex-1 bg-background"
                  disabled={isSending}
                />
                <Button type="submit" disabled={!inputMessage.trim() || isSending}>
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
