import { motion } from 'framer-motion';

interface OnboardingPromptProps {
  onSelectScenario: (text: string) => void;
}

const scenarios = [
  {
    emoji: '💼',
    label: 'Pitch investors on my startup idea',
    prefill: 'meeting with angel investors next week, my app connects pet owners with local verified dog walkers, built a prototype last weekend, the market is worth 150 billion, competitors charge 40% but we charge 15%, asking for 500k seed',
  },
  {
    emoji: '🎤',
    label: 'Prepare for a job interview',
    prefill: 'interview tomorrow for senior product designer role at a fintech startup, I have 7 years experience, led a redesign that increased conversions 32%, managed a team of 4, they care about design systems and accessibility',
  },
  {
    emoji: '😬',
    label: 'Have a tough conversation',
    prefill: 'need to ask my manager for a raise, been here 2 years with no salary adjustment, took on 3 extra projects this quarter, my market rate is 15k more than what I make, performance review is next friday',
  },
];

const OnboardingPrompt = ({ onSelectScenario }: OnboardingPromptProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="mb-4"
    >
      <p
        className="text-[13px] mb-3"
        style={{ color: 'rgba(240,237,246,0.3)' }}
      >
        Try one of these, or brain dump your own ↓
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
        {scenarios.map((s, i) => (
          <motion.button
            key={i}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 * i, duration: 0.3 }}
            onClick={() => onSelectScenario(s.prefill)}
            className="flex items-start gap-3 text-left rounded-xl border border-border/40 bg-card/30 p-3 sm:p-4 transition-all duration-200 hover:border-border/70 hover:bg-card/50 active:scale-[0.98] min-h-[44px]"
          >
            <span className="text-xl leading-none flex-shrink-0 mt-0.5">{s.emoji}</span>
            <span className="text-sm text-muted-foreground leading-snug">{s.label}</span>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
};

export default OnboardingPrompt;
