import { useState, useRef, useEffect } from 'react';
import { ArrowRight, Loader2, Upload, Mic, Zap, X, File, Image, Pencil } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import OnePager, { type OnePagerData } from '@/components/dashboard/OnePager';
import GenerationSkeleton from '@/components/dashboard/GenerationSkeleton';
import { toast } from '@/hooks/use-toast';
import { validateFiles, FILE_UPLOAD_CONFIG } from '@/lib/fileValidation';
import type { AttachedFile } from '@/components/dashboard/InputArea';

const getFileIcon = (type: string) => {
  if (type.startsWith('image/')) return Image;
  return File;
};

const LiveDemo = () => {
  const navigate = useNavigate();
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [output, setOutput] = useState<OnePagerData | null>(null);
  const [shakeInput, setShakeInput] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // File upload state
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);

  const hasContent = input.length > 0 || attachedFiles.length > 0;
  const isReady = input.length >= 50 || (input.length >= 10 && attachedFiles.length > 0);
  const showGenerate = input.length >= 10 || attachedFiles.length > 0;
  const glowWidth = Math.min(100, (input.length / 200) * 100);

  // Recording timer
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

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    setTimeout(() => {
      setInput((prev) =>
        prev
          ? prev + '\n' + 'Pitch me for a Senior Product Manager role at Google. Focus on my experience scaling mobile apps.'
          : 'Pitch me for a Senior Product Manager role at Google. Focus on my experience scaling mobile apps.'
      );
    }, 500);
  };

  const handleToggleRecording = () => {
    if (isRecording) {
      handleStopRecording();
    } else {
      setIsRecording(true);
      setRecordingTime(0);
    }
  };

  const processFile = async (file: File): Promise<string | undefined> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (file.type.startsWith('image/')) {
          resolve(reader.result as string);
        } else {
          resolve(`Document: ${file.name}`);
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

    for (const err of errors) {
      toast({ title: 'File rejected', description: err.message, variant: 'destructive' });
    }
    if (overLimit) {
      toast({ title: 'Too many files', description: `Maximum ${FILE_UPLOAD_CONFIG.maxFiles} files allowed`, variant: 'destructive' });
      return;
    }
    if (validFiles.length === 0) return;

    for (const file of validFiles) {
      const newFile: AttachedFile = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        file,
        name: file.name,
        size: file.size,
        type: file.type,
        progress: 0,
      };
      setAttachedFiles((prev) => [...prev, newFile]);
      const content = await processFile(file);
      setAttachedFiles((prev) =>
        prev.map((f) => (f.id === newFile.id ? { ...f, content, progress: 100 } : f))
      );
    }
  };

  const handleRemoveFile = (id: string) => {
    setAttachedFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleGenerate = async () => {
    const trimmed = input.trim();
    if (!trimmed && attachedFiles.length === 0) {
      setShakeInput(true);
      setTimeout(() => setShakeInput(false), 500);
      return;
    }

    setIsGenerating(true);
    setOutput(null);
    setIsCollapsed(true);

    try {
      const { data, error } = await supabase.functions.invoke('generate-demo', {
        body: { scenario: trimmed || attachedFiles.map((f) => f.name).join(', ') },
      });

      if (error) {
        if (error.message?.includes('429') || error.message?.includes('rate limit')) {
          toast({ title: 'Demo limit reached', description: "You've already tried the demo. Sign up for 3 free credits.", variant: 'destructive' });
          return;
        }
        throw error;
      }

      if (data?.error) {
        if (data.errorType === 'rate_limit') {
          toast({ title: 'Demo limit reached', description: "You've already tried the demo. Sign up for 3 free credits.", variant: 'destructive' });
          return;
        }
        throw new Error(data.error);
      }

      if (data?.needs_more) {
        toast({ title: 'Need more detail', description: data.suggestion || "Try describing who you're talking to and what you need to communicate." });
        setIsCollapsed(false);
        return;
      }

      if (data?.onePager) {
        setOutput(data.onePager as OnePagerData);
      }
    } catch (err: any) {
      console.error('Demo generation error:', err);
      toast({ title: 'Something went wrong', description: 'Please try again in a moment.', variant: 'destructive' });
      setIsCollapsed(false);
    } finally {
      setIsGenerating(false);
    }
  };

  // Phase: determines visual state
  const phase = output ? 'done' : isReady ? 'ready' : hasContent ? 'active' : 'empty';

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-8 pt-4 sm:pt-6">
      {/* The Void Input */}
      <motion.div
        animate={shakeInput ? { x: [-8, 8, -6, 6, -3, 3, 0] } : {}}
        transition={{ duration: 0.4 }}
      >
        <div className="relative">
          {/* Ambient radial glow behind input */}
          <div
            className="absolute inset-0 -inset-x-12 -inset-y-8 pointer-events-none transition-opacity duration-700"
            style={{
              background: 'radial-gradient(ellipse at center, hsl(263 70% 58% / 0.06) 0%, transparent 70%)',
              opacity: phase === 'empty' ? 1 : phase === 'active' ? 0.7 : phase === 'ready' ? 0.5 : 0,
              animation: phase === 'empty' ? 'void-breathe-glow 4s ease-in-out infinite' : undefined,
            }}
          />

          {/* Collapsed post-generation summary */}
          {isCollapsed && output && (
            <div className="relative flex items-center gap-3 px-5 py-3 rounded-2xl border transition-all duration-500"
              style={{
                borderColor: 'rgba(240,237,246,0.08)',
                backgroundColor: 'rgba(240,237,246,0.02)',
              }}
            >
              <p className="text-sm text-[rgba(240,237,246,0.45)] truncate flex-1 font-['Be_Vietnam_Pro']">
                {input.slice(0, 80)}{input.length > 80 ? '…' : ''}
              </p>
              <button
                onClick={() => { setIsCollapsed(false); setOutput(null); }}
                className="p-1.5 rounded-lg text-[rgba(240,237,246,0.25)] hover:text-[rgba(240,237,246,0.6)] transition-colors"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Main input area — hidden when collapsed with output */}
          {!(isCollapsed && output) && (
            <motion.div
              initial={false}
              animate={{
                scale: isGenerating ? 0.98 : 1,
                opacity: isGenerating ? 0.6 : 1,
              }}
              transition={{ duration: 0.3 }}
            >
              <div
                className="relative rounded-2xl transition-all duration-500 overflow-hidden"
                style={{
                  borderWidth: '1px',
                  borderStyle: 'solid',
                  borderColor: phase === 'empty'
                    ? 'rgba(240,237,246,0)'
                    : phase === 'active'
                    ? 'rgba(240,237,246,0.06)'
                    : phase === 'ready'
                    ? 'rgba(240,237,246,0.12)'
                    : 'rgba(240,237,246,0.08)',
                  backgroundColor: phase === 'empty'
                    ? 'transparent'
                    : phase === 'active'
                    ? 'rgba(240,237,246,0.02)'
                    : 'rgba(240,237,246,0.03)',
                  boxShadow: phase === 'ready'
                    ? '0 0 60px -20px hsl(263 70% 58% / 0.1)'
                    : 'none',
                }}
              >
                {/* Textarea */}
                <div className="relative">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    onInput={(e) => {
                      const target = e.target as HTMLTextAreaElement;
                      target.style.height = 'auto';
                      target.style.height = Math.min(target.scrollHeight, 200) + 'px';
                    }}
                    disabled={isGenerating}
                    maxLength={5000}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                        handleGenerate();
                      }
                    }}
                    className="w-full bg-transparent text-foreground px-6 py-5 text-sm sm:text-base leading-relaxed resize-none focus:outline-none transition-all font-['Be_Vietnam_Pro']"
                    style={{
                      minHeight: phase === 'empty' ? '56px' : '80px',
                      maxHeight: '200px',
                    }}
                  />
                  {/* Custom breathing placeholder */}
                  {!hasContent && !isFocused && (
                    <div
                      className="absolute inset-0 flex items-center px-6 pointer-events-none select-none font-['Be_Vietnam_Pro'] text-sm sm:text-base"
                      style={{
                        color: shakeInput ? 'rgba(239,68,68,0.5)' : 'rgba(240,237,246,0.35)',
                        animation: shakeInput ? undefined : 'void-breathe 4s ease-in-out infinite',
                      }}
                    >
                      speak into the void...
                    </div>
                  )}
                  {!hasContent && isFocused && (
                    <div
                      className="absolute inset-0 flex items-center px-6 pointer-events-none select-none font-['Be_Vietnam_Pro'] text-sm sm:text-base"
                      style={{ color: 'rgba(240,237,246,0.25)' }}
                    >
                      speak into the void...
                    </div>
                  )}
                </div>

                {/* Attached files */}
                {attachedFiles.length > 0 && (
                  <div className="flex flex-wrap gap-2 px-6 pb-2">
                    {attachedFiles.map((af) => {
                      const FileIcon = getFileIcon(af.type);
                      return (
                        <div
                          key={af.id}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs"
                          style={{
                            backgroundColor: 'rgba(240,237,246,0.04)',
                            border: '1px solid rgba(240,237,246,0.08)',
                            color: 'rgba(240,237,246,0.65)',
                          }}
                        >
                          <FileIcon className="w-3 h-3 opacity-50" />
                          <span className="max-w-[120px] truncate">{af.name}</span>
                          <button
                            onClick={() => handleRemoveFile(af.id)}
                            className="ml-0.5 opacity-40 hover:opacity-80 transition-opacity"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Toolbar */}
                <div className="flex items-center justify-between px-5 py-3">
                  <div className="flex items-center gap-1">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={(e) => {
                        handleFileSelect(e.target.files);
                        e.target.value = '';
                      }}
                      accept={FILE_UPLOAD_CONFIG.acceptString}
                      multiple
                      className="hidden"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isGenerating}
                      className="p-2 rounded-lg transition-all duration-300 disabled:opacity-20"
                      style={{
                        color: hasContent ? 'rgba(240,237,246,0.4)' : 'rgba(240,237,246,0.12)',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = 'rgba(240,237,246,0.6)')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = hasContent ? 'rgba(240,237,246,0.4)' : 'rgba(240,237,246,0.12)')}
                      title="Attach files"
                    >
                      <Upload className="w-4 h-4" />
                    </button>
                    <div className="w-px h-4 mx-1" style={{ backgroundColor: 'rgba(240,237,246,0.06)' }} />
                    <button
                      onClick={handleToggleRecording}
                      disabled={isGenerating}
                      className={`p-2 rounded-lg transition-all duration-300 disabled:opacity-20 ${
                        isRecording ? 'bg-red-500/20 text-red-400' : ''
                      }`}
                      style={
                        !isRecording
                          ? { color: hasContent ? 'rgba(240,237,246,0.4)' : 'rgba(240,237,246,0.12)' }
                          : undefined
                      }
                      onMouseEnter={(e) => {
                        if (!isRecording) e.currentTarget.style.color = 'rgba(240,237,246,0.6)';
                      }}
                      onMouseLeave={(e) => {
                        if (!isRecording) e.currentTarget.style.color = hasContent ? 'rgba(240,237,246,0.4)' : 'rgba(240,237,246,0.12)';
                      }}
                      title="Voice input"
                    >
                      <Mic className="w-4 h-4" />
                    </button>
                    {isRecording && (
                      <span className="text-xs text-red-400 font-mono ml-1">
                        {formatTime(recordingTime)}
                      </span>
                    )}
                  </div>

                  {/* Generate button — fades in */}
                  <AnimatePresence>
                    {showGenerate && (
                      <motion.button
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.25 }}
                        onClick={handleGenerate}
                        disabled={isGenerating}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium text-primary-foreground brand-gradient disabled:opacity-40 transition-opacity"
                      >
                        {isGenerating ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Zap className="w-3.5 h-3.5" />
                        )}
                        Generate
                      </motion.button>
                    )}
                  </AnimatePresence>
                </div>

                {/* Glow line — fullness indicator */}
                <div className="relative h-px">
                  <div
                    className="absolute bottom-0 left-1/2 h-px transition-all duration-700 ease-out"
                    style={{
                      width: `${glowWidth}%`,
                      transform: 'translateX(-50%)',
                      background: 'linear-gradient(90deg, transparent, hsl(263 70% 58% / 0.4), transparent)',
                      opacity: hasContent ? 1 : 0,
                      animation: isReady ? 'void-glow-pulse 3s ease-in-out infinite' : undefined,
                    }}
                  />
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Loading skeleton */}
      <AnimatePresence>
        {isGenerating && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-10"
          >
            <GenerationSkeleton format="one-pager" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Output */}
      <AnimatePresence>
        {output && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="mt-10">
              <OnePager data={output} />
            </div>

            <div className="mt-12 text-center space-y-4">
              <p className="text-muted-foreground text-sm sm:text-base">
                Sign up to save this, practice it, and get 2 more free.
              </p>
              <button
                onClick={() => navigate('/auth')}
                className="px-7 py-3.5 rounded-[15px] text-primary-foreground font-medium brand-gradient text-base inline-flex items-center gap-3 hover:opacity-90 transition-opacity group"
              >
                Create account
                <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Void animations */}
      <style>{`
        @keyframes void-breathe {
          0%, 100% { opacity: 0.15; }
          50% { opacity: 0.3; }
        }
        @keyframes void-breathe-glow {
          0%, 100% { opacity: 0.7; }
          50% { opacity: 1; }
        }
        @keyframes void-glow-pulse {
          0%, 100% { opacity: 0.8; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default LiveDemo;
