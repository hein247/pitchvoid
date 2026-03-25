import { useState } from 'react';
import { ArrowRight, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import OnePager, { type OnePagerData } from '@/components/dashboard/OnePager';
import GenerationSkeleton from '@/components/dashboard/GenerationSkeleton';
import { toast } from '@/hooks/use-toast';

const LiveDemo = () => {
  const navigate = useNavigate();
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [output, setOutput] = useState<OnePagerData | null>(null);
  const [shakeInput, setShakeInput] = useState(false);

  const handleGenerate = async () => {
    const trimmed = input.trim();
    if (!trimmed) {
      setShakeInput(true);
      setTimeout(() => setShakeInput(false), 500);
      return;
    }

    setIsGenerating(true);
    setOutput(null);

    try {
      const { data, error } = await supabase.functions.invoke('generate-demo', {
        body: { scenario: trimmed }
      });

      if (error) {
        // Check for rate limit
        if (error.message?.includes('429') || error.message?.includes('rate limit')) {
          toast({
            title: 'Demo limit reached',
            description: "You've already tried the demo. Sign up for 3 free credits.",
            variant: 'destructive'
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
            variant: 'destructive'
          });
          return;
        }
        throw new Error(data.error);
      }

      if (data?.needs_more) {
        toast({
          title: 'Need more detail',
          description: data.suggestion || "Try describing who you're talking to and what you need to communicate."
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
        variant: 'destructive'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-8 pt-8 sm:pt-12">
      {/* Input area */}
      <div className="space-y-4">
        <motion.div
          animate={shakeInput ? { x: [-8, 8, -6, 6, -3, 3, 0] } : {}}
          transition={{ duration: 0.4 }}>
          
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
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Brain dump your thoughts here..."
              disabled={isGenerating || !!output}
              rows={5}
              maxLength={5000}
              className="relative w-full rounded-[19px] bg-background text-foreground placeholder:text-muted-foreground/60 px-6 py-5 text-sm sm:text-base leading-relaxed resize-none focus:outline-none transition-all"
              style={{
                boxShadow: '0 0 40px -10px hsl(25 75% 65% / 0.08)'
              }}
            />
          </div>
          
        </motion.div>

        {!output &&
        <div className="flex justify-center">
            <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="px-8 py-3.5 rounded-full text-primary-foreground font-semibold magenta-gradient text-base sm:text-lg inline-flex items-center gap-3 hover:opacity-90 hover:scale-105 transition-all shadow-[0_0_30px_rgba(168,85,247,0.5)] border border-white/20 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100">
            
              {isGenerating ?
            <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generating...
                </> :

            <>
                  Generate
                  <ArrowRight className="w-5 h-5" />
                </>
            }
            </button>
          </div>
        }
      </div>

      {/* Loading skeleton */}
      <AnimatePresence>
        {isGenerating &&
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="mt-10">
          
            <GenerationSkeleton format="one-pager" />
          </motion.div>
        }
      </AnimatePresence>

      {/* Output */}
      <AnimatePresence>
        {output &&
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}>
          
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
              className="px-7 py-3.5 rounded-[15px] text-primary-foreground font-medium magenta-gradient text-base inline-flex items-center gap-3 hover:opacity-90 transition-opacity group">
              
                Create account
                <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </motion.div>
        }
      </AnimatePresence>
    </div>);

};

export default LiveDemo;