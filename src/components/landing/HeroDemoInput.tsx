import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, User, Target, MessageSquare, Zap } from 'lucide-react';

const DEMO_SCENARIOS = [
  "I'm pitching our Q3 results to the board next Tuesday…",
  "I need to convince my manager to approve a budget increase for our design team…",
  "I'm applying for a senior role at a startup and want to stand out…",
  "We're launching a new product and need to brief the sales team…",
];

interface ParsedTag {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}

const PARSED_RESULTS: ParsedTag[][] = [
  [
    { icon: <User className="w-3 h-3" />, label: 'WHO', value: 'Board of Directors', color: 'from-primary to-accent' },
    { icon: <Target className="w-3 h-3" />, label: 'WHAT', value: 'Q3 Performance Review', color: 'from-accent to-secondary' },
    { icon: <MessageSquare className="w-3 h-3" />, label: 'TONE', value: 'Confident & Data-driven', color: 'from-primary to-accent' },
    { icon: <Zap className="w-3 h-3" />, label: 'FORMAT', value: 'Executive One-Pager', color: 'from-accent to-secondary' },
  ],
  [
    { icon: <User className="w-3 h-3" />, label: 'WHO', value: 'Direct Manager', color: 'from-primary to-accent' },
    { icon: <Target className="w-3 h-3" />, label: 'WHAT', value: 'Budget Increase Proposal', color: 'from-accent to-secondary' },
    { icon: <MessageSquare className="w-3 h-3" />, label: 'TONE', value: 'Persuasive & Structured', color: 'from-primary to-accent' },
    { icon: <Zap className="w-3 h-3" />, label: 'FORMAT', value: 'One-Pager Brief', color: 'from-accent to-secondary' },
  ],
  [
    { icon: <User className="w-3 h-3" />, label: 'WHO', value: 'Hiring Manager', color: 'from-primary to-accent' },
    { icon: <Target className="w-3 h-3" />, label: 'WHAT', value: 'Career Pitch', color: 'from-accent to-secondary' },
    { icon: <MessageSquare className="w-3 h-3" />, label: 'TONE', value: 'Authentic & Compelling', color: 'from-primary to-accent' },
    { icon: <Zap className="w-3 h-3" />, label: 'FORMAT', value: 'Presentation Script', color: 'from-accent to-secondary' },
  ],
  [
    { icon: <User className="w-3 h-3" />, label: 'WHO', value: 'Sales Team', color: 'from-primary to-accent' },
    { icon: <Target className="w-3 h-3" />, label: 'WHAT', value: 'Product Launch Brief', color: 'from-accent to-secondary' },
    { icon: <MessageSquare className="w-3 h-3" />, label: 'TONE', value: 'Energetic & Clear', color: 'from-primary to-accent' },
    { icon: <Zap className="w-3 h-3" />, label: 'FORMAT', value: 'Team Presentation', color: 'from-accent to-secondary' },
  ],
];

const HeroDemoInput = () => {
  const [scenarioIndex, setScenarioIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const [phase, setPhase] = useState<'typing' | 'parsing' | 'parsed' | 'pause'>('typing');
  const charIndex = useRef(0);

  const currentScenario = DEMO_SCENARIOS[scenarioIndex];
  const currentParsed = PARSED_RESULTS[scenarioIndex];

  useEffect(() => {
    setDisplayedText('');
    charIndex.current = 0;
    setPhase('typing');
  }, [scenarioIndex]);

  // Typing effect
  useEffect(() => {
    if (phase !== 'typing') return;

    const timer = setInterval(() => {
      if (charIndex.current < currentScenario.length) {
        setDisplayedText(currentScenario.slice(0, charIndex.current + 1));
        charIndex.current++;
      } else {
        clearInterval(timer);
        setTimeout(() => setPhase('parsing'), 400);
      }
    }, 35);

    return () => clearInterval(timer);
  }, [phase, currentScenario]);

  // Parsing → parsed transition
  useEffect(() => {
    if (phase !== 'parsing') return;
    const timer = setTimeout(() => setPhase('parsed'), 800);
    return () => clearTimeout(timer);
  }, [phase]);

  // Rotate scenarios
  useEffect(() => {
    if (phase !== 'parsed') return;
    const timer = setTimeout(() => {
      setPhase('pause');
      setTimeout(() => {
        setScenarioIndex((i) => (i + 1) % DEMO_SCENARIOS.length);
      }, 300);
    }, 3500);
    return () => clearTimeout(timer);
  }, [phase]);

  return (
    <div className="w-full max-w-xl mx-auto lg:mx-0">
      {/* Fake input area */}
      <div className="rounded-2xl overflow-hidden border border-border/60 bg-card/80 backdrop-blur-sm shadow-[0_8px_40px_rgba(0,0,0,0.4)]">
        {/* Input header */}
        <div className="px-4 py-3 border-b border-border/30 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-xs text-muted-foreground font-sans">Describe your pitch…</span>
        </div>

        {/* Typed text area */}
        <div className="px-5 py-4 min-h-[72px]">
          <p className="text-sm sm:text-base text-foreground/90 font-sans leading-relaxed">
            {displayedText}
            {phase === 'typing' && (
              <span className="animate-blink text-primary font-light">|</span>
            )}
          </p>
        </div>

        {/* Parsed output */}
        <AnimatePresence mode="wait">
          {phase === 'parsing' && (
            <motion.div
              key="parsing"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="px-5 pb-4"
            >
              <div className="flex items-center gap-2 text-xs text-primary/80">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                >
                  <Sparkles className="w-3 h-3" />
                </motion.div>
                <span className="font-sans">Parsing your scenario…</span>
              </div>
            </motion.div>
          )}

          {phase === 'parsed' && (
            <motion.div
              key="parsed"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="px-5 pb-5"
            >
              <div className="border-t border-border/30 pt-4">
                <div className="grid grid-cols-2 gap-2">
                  {currentParsed.map((tag, i) => (
                    <motion.div
                      key={tag.label}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-accent/5 border border-border/40"
                    >
                      <span className={`flex items-center justify-center w-5 h-5 rounded-full bg-gradient-to-r ${tag.color} text-primary-foreground shrink-0`}>
                        {tag.icon}
                      </span>
                      <div className="min-w-0">
                        <span className="text-[10px] text-muted-foreground font-medium tracking-wider uppercase block font-sans">
                          {tag.label}
                        </span>
                        <span className="text-xs text-foreground/90 font-sans truncate block">
                          {tag.value}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Scenario dots */}
      <div className="flex items-center justify-center gap-1.5 mt-4">
        {DEMO_SCENARIOS.map((_, i) => (
          <button
            key={i}
            onClick={() => setScenarioIndex(i)}
            className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
              i === scenarioIndex ? 'w-4 bg-primary' : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
            }`}
            aria-label={`Scenario ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

export default HeroDemoInput;
