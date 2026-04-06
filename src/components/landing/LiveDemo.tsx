import { useState, useRef, useEffect, useCallback } from 'react';
import { ArrowRight, Loader2, Upload, Mic, X, File, Image } from 'lucide-react';
import pitchvoidIcon from '@/assets/pitchvoid-logo-blacked.png';
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

  // File upload state
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);

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
    // Mock transcription (same as dashboard)
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

  // File processing
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

    try {
      const { data, error } = await supabase.functions.invoke('generate-demo', {
        body: { scenario: trimmed || attachedFiles.map((f) => f.name).join(', ') },
      });

      if (error) {
        if (error.message?.includes('429') || error.message?.includes('rate limit')) {
          toast({
            title: 'Demo limit reached',
            description: "You've already tried the demo. Sign up for 3 free credits.",
            variant: 'destructive',
          });
          return;
        }
        throw error;
      }

      if (data?.error) {
        if (data.errorType === 'rate_limit') {
          toast({
            title: 'Demo limit reached',
            description: "You've already tried the demo. Sign up for 3 free credits.",
            variant: 'destructive',
          });
          return;
        }
        throw new Error(data.error);
      }

      if (data?.needs_more) {
        toast({
          title: 'Need more detail',
          description: data.suggestion || "Try describing who you're talking to and what you need to communicate.",
        });
        return;
      }

      if (data?.onePager) {
        setOutput(data.onePager as OnePagerData);
      }
    } catch (err: any) {
      console.error('Demo generation error:', err);
      toast({
        title: 'Something went wrong',
        description: 'Please try again in a moment.',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-8 pt-4 sm:pt-6">
      {/* Input area */}
      <div className="space-y-4">
        <motion.div
          animate={shakeInput ? { x: [-8, 8, -6, 6, -3, 3, 0] } : {}}
          transition={{ duration: 0.4 }}
        >
          <div className="relative rounded-[20px] p-[1px] overflow-hidden">
            {/* Animated gradient border */}
            <div
              className="absolute inset-0 rounded-[20px] animate-gradient-x"
              style={{
                background: shakeInput
                  ? 'hsl(0 70% 50% / 0.6)'
                  : 'linear-gradient(90deg, hsl(var(--primary)), hsl(var(--secondary)), hsl(var(--primary)), hsl(var(--secondary)))',
                backgroundSize: '300% 100%',
                opacity: 0.5,
              }}
            />
            <div
              className="relative rounded-[19px] bg-background"
              style={{ boxShadow: '0 0 40px -10px hsl(25 75% 65% / 0.08)' }}
            >
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = 'auto';
                  target.style.height = target.scrollHeight + 'px';
                }}
                placeholder={shakeInput ? 'Drop some thoughts first' : 'Brain dump your thoughts here...'}
                disabled={isGenerating || !!output}
                maxLength={5000}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                    handleGenerate();
                  }
                }}
                className={`w-full rounded-t-[19px] bg-transparent text-foreground px-6 py-5 text-sm sm:text-base leading-relaxed resize-none focus:outline-none transition-all min-h-[120px] ${
                  shakeInput ? 'placeholder:text-red-500/50' : 'placeholder:text-muted-foreground/60'
                }`}
              />

              {/* Attached files preview */}
              {attachedFiles.length > 0 && (
                <div className="flex flex-wrap gap-2 px-6 pb-2">
                  {attachedFiles.map((af) => {
                    const FileIcon = getFileIcon(af.type);
                    return (
                      <div
                        key={af.id}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-accent/10 border border-accent/20 text-xs text-foreground/80"
                      >
                        <FileIcon className="w-3 h-3 text-accent/60" />
                        <span className="max-w-[120px] truncate">{af.name}</span>
                        <button
                          onClick={() => handleRemoveFile(af.id)}
                          className="ml-0.5 text-muted-foreground hover:text-foreground"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Toolbar: upload, mic, generate */}
              {!output && (
                <div className="flex items-center justify-between px-5 py-3 border-t border-border/20">
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
                      className="p-2 rounded-lg transition-colors text-muted-foreground hover:text-foreground hover:bg-accent/10 disabled:opacity-40"
                      title="Attach files"
                    >
                      <Upload className="w-4 h-4" />
                    </button>
                    <div className="w-px h-4 bg-border/30 mx-1" />
                    <button
                      onClick={handleToggleRecording}
                      disabled={isGenerating || !!output}
                      className={`p-2 rounded-lg transition-colors ${
                        isRecording
                          ? 'bg-red-500/20 text-red-400'
                          : 'text-muted-foreground hover:text-foreground hover:bg-accent/10'
                      } disabled:opacity-40`}
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
                  <button
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium text-primary-foreground brand-gradient disabled:opacity-40 transition-opacity"
                  >
                    {isGenerating ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <img src={pitchvoidIcon} alt="" className="w-4 h-4 invert" />
                    )}
                    Generate
                  </button>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>

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

            {/* Post-output CTA */}
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
    </div>
  );
};

export default LiveDemo;
