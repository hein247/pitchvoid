import { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

const EASE = [0.25, 0.1, 0.25, 1.0] as [number, number, number, number];

const TYPEWRITER_TEXT =
  'meeting with ceo tomorrow, revenue down 15%, competitors have apps, we did this for a restaurant chain, need 180k budget...';

const WHO_WHAT_WHY_HOW = [
  { label: 'WHO', value: 'CEO' },
  { label: 'WHAT', value: 'Budget Request' },
  { label: 'WHY', value: 'Revenue Recovery' },
  { label: 'HOW', value: 'Data-Driven' },
];

const OUTPUT_SECTIONS = [
  {
    label: 'THE PROBLEM',
    points: ['Revenue declined 15% YoY — no digital presence', 'Competitors launched online ordering'],
  },
  {
    label: 'PROVEN RESULTS',
    points: ['Previous $180K engagement → 3x ROI in 6 months', 'Built transformation roadmap for similar retailer'],
  },
  {
    label: 'THE PROPOSAL',
    points: ['Requesting budget for digital recovery initiative', 'Q3 launch with phased rollout'],
  },
];

/* ── Typewriter Hook ── */
function useTypewriter(text: string, speed: number, trigger: boolean) {
  const [displayed, setDisplayed] = useState('');
  const [cursorVisible, setCursorVisible] = useState(false);
  const [typing, setTyping] = useState(false);

  useEffect(() => {
    if (!trigger) return;
    setTyping(true);
    setCursorVisible(true);
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(interval);
        setTyping(false);
        // cursor blinks for 2s then disappears
        setTimeout(() => setCursorVisible(false), 2000);
      }
    }, speed);
    return () => clearInterval(interval);
  }, [trigger, text, speed]);

  return { displayed, cursorVisible, typing };
}

/* ── Step 1: Drop Your Thoughts ── */
function Step1() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-100px' });
  const { displayed, cursorVisible } = useTypewriter(TYPEWRITER_TEXT, 30, inView);

  return (
    <motion.div
      ref={ref}
      className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 items-center"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 0.6, ease: EASE }}
    >
      {/* Content — left on desktop */}
      <motion.div
        className="order-2 md:order-1"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-100px' }}
        transition={{ duration: 0.6, ease: EASE, delay: 0.1 }}
      >
        <div
          className="rounded-2xl p-5 sm:p-6 min-h-[160px]"
          style={{
            background: 'rgba(14,12,24,0.6)',
            border: '1px solid hsl(var(--border))',
          }}
        >
          <p
            className="font-mono text-sm sm:text-base leading-relaxed m-0"
            style={{ color: 'rgba(240,237,246,0.5)' }}
          >
            {displayed}
            {cursorVisible && (
              <span
                className="inline-block w-[2px] h-[1em] ml-0.5 align-middle"
                style={{
                  background: 'hsl(var(--primary))',
                  animation: 'blink 1s step-end infinite',
                }}
              />
            )}
          </p>
        </div>
      </motion.div>

      {/* Label — right on desktop */}
      <motion.div
        className="order-1 md:order-2 md:text-right"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-100px' }}
        transition={{ duration: 0.6, ease: EASE, delay: 0.2 }}
      >
        <span
          className="font-display block mb-2"
          style={{ fontSize: 48, color: 'rgba(240,237,246,0.06)', lineHeight: 1 }}
        >
          01
        </span>
        <h3 className="text-xl text-foreground/80 font-sans font-medium m-0">
          Drop Your Thoughts
        </h3>
      </motion.div>
    </motion.div>
  );
}

/* ── Step 2: AI Organizes ── */
function Step2() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <motion.div
      ref={ref}
      className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 items-center"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 0.6, ease: EASE }}
    >
      {/* Label — left on desktop */}
      <motion.div
        className="order-1"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-100px' }}
        transition={{ duration: 0.6, ease: EASE, delay: 0.1 }}
      >
        <span
          className="font-display block mb-2"
          style={{ fontSize: 48, color: 'rgba(240,237,246,0.06)', lineHeight: 1 }}
        >
          02
        </span>
        <h3 className="text-xl text-foreground/80 font-sans font-medium m-0">
          AI Organizes Your Story
        </h3>
      </motion.div>

      {/* Content — right on desktop */}
      <div className="order-2">
        <div className="grid grid-cols-2 gap-3">
          {WHO_WHAT_WHY_HOW.map((card, i) => (
            <motion.div
              key={card.label}
              className="rounded-xl px-4 py-3"
              style={{
                background: 'rgba(168,85,247,0.08)',
                border: '1px solid rgba(168,85,247,0.25)',
              }}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.5, ease: EASE, delay: 0.15 * i + 0.2 }}
            >
              <p className="text-[10px] font-bold tracking-[0.15em] mb-0.5 font-sans" style={{ color: 'hsl(var(--primary))' }}>
                {card.label}
              </p>
              <p className="text-sm text-foreground/80 font-sans font-medium m-0">{card.value}</p>
            </motion.div>
          ))}
        </div>

        {/* Confirmation */}
        <motion.div
          className="flex items-center gap-2 mt-4"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.5, ease: EASE, delay: 0.9 }}
        >
          {inView && (
            <>
              <span className="w-2 h-2 rounded-full bg-green-500/70 shrink-0" />
              <span className="text-xs font-sans" style={{ color: 'rgba(34,197,94,0.7)' }}>
                Structure confirmed — ready to generate
              </span>
            </>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}

/* ── Step 3: Your Output, Ready ── */
function Step3() {
  const navigate = useNavigate();

  return (
    <motion.div
      className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 items-center"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 0.6, ease: EASE }}
    >
      {/* Content — left on desktop */}
      <motion.div
        className="order-2 md:order-1"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-100px' }}
        transition={{ duration: 0.6, ease: EASE, delay: 0.1 }}
      >
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            border: '1px solid rgba(168,85,247,0.2)',
            background: 'rgba(14,12,24,0.8)',
          }}
        >
          {OUTPUT_SECTIONS.map((section, sIdx) => (
            <motion.div
              key={sIdx}
              className="px-5 py-4"
              style={{
                borderBottom: sIdx < OUTPUT_SECTIONS.length - 1 ? '1px solid rgba(168,85,247,0.1)' : 'none',
              }}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.5, ease: EASE, delay: 0.1 * sIdx + 0.2 }}
            >
              <p
                className="text-[10px] font-medium uppercase tracking-[0.15em] mb-2 font-sans"
                style={{ color: 'rgba(168,85,247,0.7)' }}
              >
                {section.label}
              </p>
              {section.points.map((point, pIdx) => (
                <div key={pIdx} className="flex items-start gap-2 mb-1.5 last:mb-0">
                  <div
                    className="w-[3px] h-3.5 rounded-full shrink-0 mt-0.5"
                    style={{ background: 'rgba(168,85,247,0.5)' }}
                  />
                  <p className="text-xs m-0 leading-relaxed font-sans" style={{ color: 'rgba(240,237,246,0.65)' }}>
                    {point}
                  </p>
                </div>
              ))}
            </motion.div>
          ))}
        </div>

        {/* Format pills */}
        <motion.div
          className="flex gap-2 mt-4"
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.5, ease: EASE, delay: 0.6 }}
        >
          <span
            className="text-[11px] px-3 py-1 rounded-full font-sans font-medium"
            style={{
              background: 'rgba(168,85,247,0.15)',
              border: '1px solid rgba(168,85,247,0.3)',
              color: 'hsl(var(--primary))',
            }}
          >
            One-Pager
          </span>
          <span
            className="text-[11px] px-3 py-1 rounded-full font-sans font-medium"
            style={{
              background: 'rgba(240,237,246,0.04)',
              border: '1px solid hsl(var(--border))',
              color: 'rgba(240,237,246,0.5)',
            }}
          >
            Script
          </span>
        </motion.div>
      </motion.div>

      {/* Label — right on desktop */}
      <motion.div
        className="order-1 md:order-2 md:text-right"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-100px' }}
        transition={{ duration: 0.6, ease: EASE, delay: 0.2 }}
      >
        <span
          className="font-display block mb-2"
          style={{ fontSize: 48, color: 'rgba(240,237,246,0.06)', lineHeight: 1 }}
        >
          03
        </span>
        <h3 className="text-xl text-foreground/80 font-sans font-medium m-0">
          Your Cheat Sheet, Ready
        </h3>
      </motion.div>
    </motion.div>
  );
}

/* ── Main Component ── */
export default function HowItWorks() {
  return (
    <section className="py-20 sm:py-32 px-4 sm:px-8">
      {/* Blink keyframes */}
      <style>{`@keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }`}</style>

      <div className="max-w-[1100px] mx-auto">
        {/* Section heading */}
        <motion.div
          className="text-center mb-20 sm:mb-28"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6, ease: EASE }}
        >
          <h2
            className="text-foreground leading-[1.15] m-0"
            style={{ fontSize: 'clamp(28px, 5.2vw, 56px)', fontWeight: 400 }}
          >
            From scattered to structured
            <br />
            <span
              className="text-primary font-display font-medium"
              style={{ fontSize: 'clamp(34px, 7vw, 80px)' }}
            >
              in seconds.
            </span>
          </h2>
        </motion.div>

        {/* Steps */}
        <div className="flex flex-col gap-20 sm:gap-[120px]">
          <Step1 />
          <Step2 />
          <Step3 />
        </div>
      </div>
    </section>
  );
}
