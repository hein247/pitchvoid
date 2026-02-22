import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';

/* ── Chaos fragments — overwhelming noise ── */
const CHAOS_FRAGMENTS = [
  { text: 'check this AI tool', size: 14, opacity: 0.5, color: 'rgba(240,237,246,0.6)' },
  { text: 'have you tried ChatGPT for—', size: 12, opacity: 0.4, color: 'rgba(240,237,246,0.5)' },
  { text: '10x your productivity', size: 15, opacity: 0.45, color: 'rgba(240,237,246,0.55)' },
  { text: 'your competitor just launched', size: 13, opacity: 0.5, color: 'rgba(240,237,246,0.6)' },
  { text: 'meeting in 5', size: 11, opacity: 0.35, color: 'rgba(240,237,246,0.5)' },
  { text: 'Q3 numbers are in', size: 14, opacity: 0.5, color: 'rgba(240,237,246,0.6)' },
  { text: 'can you hop on a quick call', size: 12, opacity: 0.4, color: 'rgba(240,237,246,0.5)' },
  { text: 'sent you a Slack', size: 10, opacity: 0.3, color: 'rgba(240,237,246,0.45)' },
  { text: 'URGENT:', size: 16, opacity: 0.6, color: 'rgba(255,120,80,0.8)' },
  { text: 'thoughts?', size: 11, opacity: 0.35, color: 'rgba(240,237,246,0.5)' },
  { text: 'following up on my last email', size: 12, opacity: 0.4, color: 'rgba(240,237,246,0.5)' },
  { text: 'AI will replace you if—', size: 13, opacity: 0.55, color: 'rgba(245,210,80,0.75)' },
  { text: 'just one more tab', size: 11, opacity: 0.35, color: 'rgba(240,237,246,0.45)' },
  { text: 'new framework dropped', size: 12, opacity: 0.4, color: 'rgba(240,237,246,0.5)' },
  { text: 'pivot', size: 10, opacity: 0.3, color: 'rgba(240,237,246,0.4)' },
  { text: 'synergy', size: 10, opacity: 0.3, color: 'rgba(240,237,246,0.4)' },
  { text: 'circle back', size: 11, opacity: 0.35, color: 'rgba(240,237,246,0.45)' },
  { text: 'let\'s take this offline', size: 12, opacity: 0.4, color: 'rgba(240,237,246,0.5)' },
];

/* ── Landing positions for chaos — scattered across stage ── */
const CHAOS_POSITIONS = CHAOS_FRAGMENTS.map((_, i) => ({
  x: ((i * 137) % 100) - 10, // pseudo-random % from left
  y: ((i * 89 + 30) % 90) + 5, // pseudo-random % from top
  rotation: ((i * 17) % 21) - 10,
}));

const TRUTH_LINES = [
  { text: 'You don\'t need another AI tool.', bright: false },
  { text: 'You need five seconds of clarity', bright: false },
  { text: 'before you open your mouth.', bright: true },
];

const PIVOT_LINES = [
  'PitchVoid doesn\'t generate ideas for you.',
  'It takes the mess already in your head',
  'and makes it sound like you know what you\'re doing.',
];

const DEMO_INPUT = 'meeting with ceo tomorrow, revenue down 15%, competitors have apps, need 180k budget...';

const OUTPUT_SECTIONS = [
  { label: 'THE PROBLEM', text: 'Revenue declined 15% YoY — no digital presence' },
  { label: 'PROVEN RESULTS', text: 'Previous engagement → 35% repeat customers in 4 months' },
  { label: 'THE PROPOSAL', text: '$180K engagement, starting with 2-week diagnostic' },
];

/* ── Static fallback for reduced motion ── */
function StaticFallback() {
  const navigate = useNavigate();
  return (
    <div className="max-w-[900px] mx-auto text-center px-4 py-16">
      <h3 className="text-xl sm:text-2xl text-foreground/80 font-sans mb-4">
        Your brain is a group chat you can't mute.
      </h3>
      <p className="text-sm text-foreground/40 mb-8 max-w-md mx-auto">
        PitchVoid takes the mess already in your head and makes it sound like you know what you're doing.
      </p>
      <button
        onClick={() => navigate('/dashboard')}
        className="px-8 py-3.5 rounded-full text-primary-foreground font-medium magenta-gradient text-base hover:opacity-90 transition-opacity"
      >
        Shut up and try it →
      </button>
    </div>
  );
}

/* ── Main Component ── */
export default function HowItWorks() {
  const stageRef = useRef<HTMLDivElement>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    if (prefersReducedMotion || !stageRef.current) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ repeat: -1, repeatDelay: 1.5 });

      /* ── Reset everything ── */
      tl.set('.chaos-fragment, .opening-line, .truth-line, .pivot-line, .purple-divider, .demo-area, .demo-tagline, .cta-area', { opacity: 0 });
      tl.set('.chaos-fragment', { scale: 1 });
      tl.set('.typewriter-text', { width: 0 });

      /* ═══ PHASE 1 — THE ASSAULT (0s–4s) ═══ */
      // Opening line appears
      tl.fromTo('.opening-line',
        { opacity: 0, scale: 0.95 },
        { opacity: 1, scale: 1, duration: 0.8, ease: 'power2.out' }
      );
      tl.to({}, { duration: 1.5 }); // hold

      // Chaos fragments flood in from off-screen
      CHAOS_FRAGMENTS.forEach((frag, i) => {
        const startX = i % 2 === 0 ? -300 : 300;
        const startY = gsap.utils.random(-200, 200);
        tl.fromTo(`.chaos-${i}`,
          { opacity: 0, x: startX, y: startY, rotation: gsap.utils.random(-20, 20) },
          {
            opacity: frag.opacity,
            x: 0, y: 0,
            rotation: CHAOS_POSITIONS[i].rotation,
            duration: 0.3,
            ease: 'power2.out',
          },
          i === 0 ? '+=0' : '<+=0.08'
        );
      });
      tl.to({}, { duration: 1.5 }); // let chaos sit

      /* ═══ PHASE 2 — THE FREEZE + DISSOLVE (4s–6s) ═══ */
      tl.to({}, { duration: 0.5 }); // freeze hold

      // Dissolve all fragments + opening line outward
      tl.to('.chaos-fragment', {
        opacity: 0,
        scale: 0.3,
        x: () => gsap.utils.random(-200, 200),
        y: () => gsap.utils.random(-200, 200),
        rotation: () => gsap.utils.random(-30, 30),
        stagger: { each: 0.02, from: 'center' },
        duration: 0.8,
        ease: 'power2.in',
      });
      tl.to('.opening-line', { opacity: 0, duration: 0.5 }, '<');

      /* ═══ PHASE 3 — THE TRUTH (6s–12s) ═══ */
      tl.to({}, { duration: 0.8 }); // silence

      // Line 1
      tl.fromTo('.truth-0', { opacity: 0, y: 10 }, { opacity: 0.7, y: 0, duration: 0.6, ease: 'power2.out' });
      tl.to({}, { duration: 1.5 });
      tl.to('.truth-0', { opacity: 0.3, duration: 0.4 });

      // Line 2
      tl.fromTo('.truth-1', { opacity: 0, y: 10 }, { opacity: 0.7, y: 0, duration: 0.6, ease: 'power2.out' });
      tl.to({}, { duration: 1.5 });
      tl.to('.truth-1', { opacity: 0.3, duration: 0.4 });

      // Line 3 — punchline, stays bright
      tl.fromTo('.truth-2', { opacity: 0, y: 10 }, { opacity: 0.9, y: 0, duration: 0.6, ease: 'power2.out' });
      tl.to({}, { duration: 2 });

      // All visible together briefly, then fade
      tl.to('.truth-line', { opacity: 0, duration: 0.6 });

      /* ═══ PHASE 4 — THE PIVOT (12s–16s) ═══ */
      // Purple line draws
      tl.fromTo('.purple-divider',
        { opacity: 0, scaleX: 0 },
        { opacity: 1, scaleX: 1, duration: 0.8, ease: 'power2.inOut' }
      );

      // Pivot text
      tl.fromTo('.pivot-line',
        { opacity: 0, y: 10 },
        { opacity: 0.5, y: 0, stagger: 0.3, duration: 0.5, ease: 'power2.out' }
      );
      tl.to({}, { duration: 3 }); // hold

      // Fade out pivot
      tl.to('.pivot-line, .purple-divider', { opacity: 0, duration: 0.5 });

      /* ═══ PHASE 5 — THE DEMO (16s–22s) ═══ */
      tl.fromTo('.demo-area',
        { opacity: 0 },
        { opacity: 1, duration: 0.4 }
      );

      // Typewriter effect on input
      tl.fromTo('.typewriter-text',
        { width: 0 },
        { width: '100%', duration: 2, ease: 'none' }
      );

      // Arrow pulse
      tl.fromTo('.demo-arrow',
        { opacity: 0, scale: 0.8 },
        { opacity: 0.6, scale: 1, duration: 0.3, ease: 'back.out(2)' },
        '-=1'
      );

      // Output sections appear staggered
      tl.fromTo('.output-section',
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, stagger: 0.2, duration: 0.4, ease: 'power2.out' },
        '-=0.5'
      );

      // Tagline
      tl.fromTo('.demo-tagline',
        { opacity: 0 },
        { opacity: 0.4, duration: 0.5 }
      );
      tl.to({}, { duration: 3 }); // hold

      // Fade out demo
      tl.to('.demo-area, .demo-tagline', { opacity: 0, duration: 0.5 });

      /* ═══ PHASE 6 — CTA (22s–24s+) ═══ */
      tl.fromTo('.cta-area',
        { opacity: 0, scale: 0.9 },
        { opacity: 1, scale: 1, duration: 0.5, ease: 'back.out(1.4)' }
      );
      tl.to({}, { duration: 3 }); // hold

      // Fade for loop
      tl.to('.cta-area', { opacity: 0, duration: 0.5 });

      tlRef.current = tl;
    }, stageRef);

    return () => ctx.revert();
  }, [prefersReducedMotion]);

  if (prefersReducedMotion) {
    return (
      <section className="py-20 sm:py-32 px-4 sm:px-8">
        <StaticFallback />
      </section>
    );
  }

  return (
    <section className="py-20 sm:py-32 px-4 sm:px-8">
      <div
        ref={stageRef}
        className="max-w-[900px] mx-auto rounded-[20px] relative overflow-hidden"
        style={{
          background: 'rgba(9,8,15,0.92)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(168,85,247,0.08)',
          minHeight: 'clamp(400px, 55vw, 500px)',
        }}
      >
        {/* ── THE STAGE ── */}
        <div className="relative w-full h-full flex items-center justify-center" style={{ minHeight: 'clamp(400px, 55vw, 500px)' }}>

          {/* Opening line */}
          <p
            className="opening-line absolute inset-0 flex items-center justify-center text-center px-6 font-sans font-medium z-10"
            style={{ fontSize: 'clamp(18px, 3.5vw, 28px)', color: 'rgba(240,237,246,0.85)', opacity: 0 }}
          >
            Your brain is a group chat you can't mute.
          </p>

          {/* Chaos fragments */}
          {CHAOS_FRAGMENTS.map((frag, i) => (
            <span
              key={i}
              className={`chaos-fragment chaos-${i} absolute will-change-transform`}
              style={{
                left: `${CHAOS_POSITIONS[i].x}%`,
                top: `${CHAOS_POSITIONS[i].y}%`,
                fontSize: frag.size,
                color: frag.color,
                fontFamily: "'Be Vietnam Pro', sans-serif",
                whiteSpace: 'nowrap',
                opacity: 0,
                pointerEvents: 'none',
              }}
            >
              {frag.text}
            </span>
          ))}

          {/* Truth lines */}
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6">
            {TRUTH_LINES.map((line, i) => (
              <p
                key={i}
                className={`truth-line truth-${i} font-sans text-center`}
                style={{
                  fontSize: 'clamp(14px, 2.5vw, 18px)',
                  color: line.bright ? 'rgba(240,237,246,0.9)' : 'rgba(240,237,246,0.7)',
                  fontWeight: line.bright ? 500 : 400,
                  opacity: 0,
                }}
              >
                {line.text}
              </p>
            ))}
          </div>

          {/* Purple divider */}
          <div
            className="purple-divider absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
            style={{
              width: 'clamp(120px, 25vw, 200px)',
              height: 1,
              background: 'rgba(168,85,247,0.4)',
              opacity: 0,
              transformOrigin: 'center',
            }}
          />

          {/* Pivot lines */}
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 px-6" style={{ paddingTop: '55%' }}>
            {PIVOT_LINES.map((line, i) => (
              <p
                key={i}
                className={`pivot-line font-sans text-center`}
                style={{
                  fontSize: 'clamp(12px, 2vw, 14px)',
                  color: 'rgba(240,237,246,0.5)',
                  lineHeight: 1.8,
                  opacity: 0,
                }}
              >
                {line}
              </p>
            ))}
          </div>

          {/* Demo area */}
          <div className="demo-area absolute inset-0 flex items-center justify-center px-4 sm:px-8 gap-3 sm:gap-6" style={{ opacity: 0 }}>
            {/* Left — messy input */}
            <div
              className="flex-1 rounded-lg p-3 sm:p-4 overflow-hidden"
              style={{ background: 'rgba(14,12,24,0.6)', border: '1px solid rgba(240,237,246,0.06)', maxWidth: 340 }}
            >
              <p className="text-[9px] sm:text-[10px] font-medium uppercase tracking-[0.15em] mb-2 font-sans" style={{ color: 'rgba(168,85,247,0.6)' }}>
                YOUR MESS
              </p>
              <div className="overflow-hidden">
                <p
                  className="typewriter-text font-mono whitespace-nowrap overflow-hidden"
                  style={{ fontSize: 'clamp(10px, 1.5vw, 12px)', color: 'rgba(240,237,246,0.45)', width: 0 }}
                >
                  {DEMO_INPUT}
                </p>
              </div>
            </div>

            {/* Arrow */}
            <span className="demo-arrow text-lg sm:text-xl shrink-0" style={{ color: 'rgba(168,85,247,0.6)', opacity: 0 }}>→</span>

            {/* Right — clean output */}
            <div
              className="flex-1 rounded-lg overflow-hidden"
              style={{ background: 'rgba(14,12,24,0.8)', border: '1px solid rgba(168,85,247,0.15)', maxWidth: 340 }}
            >
              {OUTPUT_SECTIONS.map((section, sIdx) => (
                <div
                  key={sIdx}
                  className="output-section px-3 sm:px-4 py-2 sm:py-3"
                  style={{
                    borderBottom: sIdx < OUTPUT_SECTIONS.length - 1 ? '1px solid rgba(168,85,247,0.1)' : 'none',
                    opacity: 0,
                  }}
                >
                  <p className="text-[8px] sm:text-[9px] font-medium uppercase tracking-[0.15em] mb-1 font-sans m-0" style={{ color: 'rgba(168,85,247,0.7)' }}>
                    {section.label}
                  </p>
                  <p className="text-[10px] sm:text-[11px] m-0 leading-relaxed font-sans" style={{ color: 'rgba(240,237,246,0.7)' }}>
                    {section.text}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Demo tagline */}
          <p
            className="demo-tagline absolute bottom-6 left-0 right-0 text-center font-sans"
            style={{ fontSize: 'clamp(11px, 1.8vw, 13px)', color: 'rgba(240,237,246,0.4)', opacity: 0 }}
          >
            From overstimulated to articulate. In seconds.
          </p>

          {/* CTA */}
          <div className="cta-area absolute inset-0 flex items-center justify-center" style={{ opacity: 0 }}>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-8 py-3.5 rounded-full text-primary-foreground font-medium magenta-gradient text-base hover:opacity-90 hover:scale-105 transition-all cursor-pointer"
            >
              Shut up and try it →
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
