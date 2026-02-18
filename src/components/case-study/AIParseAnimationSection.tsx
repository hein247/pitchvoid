import { motion, useInView, AnimatePresence } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { FileUp, Sparkles, MessageSquare } from "lucide-react";
import TypewriterText from "@/components/ui/TypewriterText";

type Phase = 'upload' | 'parse' | 'think' | 'output';

const PHASE_DURATIONS: Record<Phase, number> = {
  upload: 2000,
  parse: 2000,
  think: 1500,
  output: 2500,
};

const PHASE_ORDER: Phase[] = ['upload', 'parse', 'think', 'output'];

const thinkingTexts = [
  "Analyzing audience...",
  "Finding key points...",
  "Structuring narrative...",
];

const talkingPoints = [
  "Market size: $2.4B",
  "3x faster than competitors",
  "Live demo ready",
];

const AIParseAnimationSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: false, margin: "-80px" });
  const [phase, setPhase] = useState<Phase>('upload');
  const [thinkIndex, setThinkIndex] = useState(0);
  const [progressValue, setProgressValue] = useState(0);

  useEffect(() => {
    if (!isInView) return;

    let phaseIdx = 0;
    setPhase('upload');
    setProgressValue(0);
    setThinkIndex(0);

    const advance = () => {
      phaseIdx = (phaseIdx + 1) % PHASE_ORDER.length;
      const next = PHASE_ORDER[phaseIdx];
      setPhase(next);
      if (next === 'upload') {
        setProgressValue(0);
        setThinkIndex(0);
      }
    };

    let timeout: ReturnType<typeof setTimeout>;

    const schedule = () => {
      const current = PHASE_ORDER[phaseIdx];
      timeout = setTimeout(() => {
        advance();
        schedule();
      }, PHASE_DURATIONS[current]);
    };

    schedule();

    return () => clearTimeout(timeout);
  }, [isInView]);

  // Progress bar fill for upload phase
  useEffect(() => {
    if (phase !== 'upload') return;
    setProgressValue(0);
    const start = Date.now();
    const dur = 1600;
    const raf = () => {
      const elapsed = Date.now() - start;
      const pct = Math.min(elapsed / dur, 1);
      setProgressValue(pct * 100);
      if (pct < 1) requestAnimationFrame(raf);
    };
    requestAnimationFrame(raf);
  }, [phase]);

  // Cycle thinking text
  useEffect(() => {
    if (phase !== 'think') return;
    setThinkIndex(0);
    let idx = 0;
    const interval = setInterval(() => {
      idx = (idx + 1) % thinkingTexts.length;
      setThinkIndex(idx);
    }, 500);
    return () => clearInterval(interval);
  }, [phase]);

  return (
    <section ref={ref} className="py-16 md:py-20 px-6 bg-[hsl(270,10%,7%)]">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="mb-10"
        >
          <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground/60 mb-2">
            Early concept sketch
          </p>
          <h3 className="text-xl md:text-2xl font-display text-foreground mb-2">
            The initial vision
          </h3>
          <p className="text-sm text-muted-foreground max-w-lg">
            Before building, I sketched out the core loop — upload a file, let AI extract insights, and produce talking points automatically.
          </p>
        </motion.div>

        {/* Animation Container */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="rounded-xl border-2 border-dashed border-border p-6 md:p-8 bg-[hsl(270,10%,7%)] min-h-[280px] flex flex-col items-center justify-center relative overflow-hidden"
        >
          {/* Phase indicators */}
          <div className="flex gap-3 mb-8 w-full max-w-md justify-center">
            {PHASE_ORDER.map((p, i) => (
              <div key={p} className="flex items-center gap-2">
                <div
                  className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                    PHASE_ORDER.indexOf(phase) >= i
                      ? 'bg-primary'
                      : 'bg-muted-foreground/20'
                  }`}
                />
                <span className={`text-[9px] uppercase tracking-widest transition-colors duration-300 ${
                  phase === p ? 'text-primary' : 'text-muted-foreground/40'
                }`}>
                  {p}
                </span>
              </div>
            ))}
          </div>

          {/* Animation area */}
          <div className="w-full max-w-sm min-h-[180px] flex items-center justify-center">
            <AnimatePresence mode="wait">
              {/* UPLOAD PHASE */}
              {phase === 'upload' && (
                <motion.div
                  key="upload"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="flex flex-col items-center gap-4 w-full"
                >
                  <div className="w-full rounded-lg border-2 border-dashed border-muted-foreground/30 p-6 flex flex-col items-center gap-3">
                    <motion.div
                      initial={{ y: -20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ duration: 0.5, delay: 0.3 }}
                      className="flex items-center gap-2"
                    >
                      <FileUp className="w-5 h-5 text-muted-foreground/60" />
                      <span className="text-xs text-muted-foreground font-mono">pitch_deck.pdf</span>
                    </motion.div>
                    {/* Progress bar */}
                    <div className="w-full h-1 rounded-full bg-muted-foreground/10 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary/50 transition-none"
                        style={{ width: `${progressValue}%` }}
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {/* PARSE PHASE */}
              {phase === 'parse' && (
                <motion.div
                  key="parse"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="w-full space-y-2"
                >
                  {[0.7, 1, 0.85, 0.6, 0.9, 0.5].map((w, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: i * 0.25 }}
                      className="h-2 rounded bg-muted-foreground/20 animate-pulse"
                      style={{ width: `${w * 100}%` }}
                    />
                  ))}
                  <motion.div
                    initial={{ top: 0 }}
                    animate={{ top: '100%' }}
                    transition={{ duration: 1.5, ease: 'linear' }}
                    className="absolute left-0 right-0 h-px bg-primary/40"
                  />
                </motion.div>
              )}

              {/* THINK PHASE */}
              {phase === 'think' && (
                <motion.div
                  key="think"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="flex flex-col items-center gap-4"
                >
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    <Sparkles className="w-6 h-6 text-primary/70" />
                  </motion.div>
                  <p className="text-xs text-muted-foreground font-mono h-4">
                    <TypewriterText
                      key={thinkIndex}
                      text={thinkingTexts[thinkIndex]}
                      speed={30}
                    />
                  </p>
                </motion.div>
              )}

              {/* OUTPUT PHASE */}
              {phase === 'output' && (
                <motion.div
                  key="output"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="w-full space-y-2"
                >
                  {talkingPoints.map((point, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: i * 0.3 }}
                      className="flex items-center gap-3 p-3 rounded-lg border border-dashed border-border bg-background/30"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-primary/50 shrink-0" />
                      <span className="text-xs text-muted-foreground font-mono">{point}</span>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default AIParseAnimationSection;
