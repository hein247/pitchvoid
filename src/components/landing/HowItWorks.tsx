import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';

/* ── Chaos fragments — overwhelming noise ── */
const CHAOS_FRAGMENTS = [
  { text: 'check this AI tool', size: 14, opacity: 0.6, color: 'rgba(250,180,120,0.8)' },
  { text: 'have you tried ChatGPT for—', size: 12, opacity: 0.5, color: 'rgba(168,130,246,0.75)' },
  { text: '10x your productivity', size: 15, opacity: 0.55, color: 'rgba(120,200,255,0.7)' },
  { text: 'your competitor just launched', size: 13, opacity: 0.6, color: 'rgba(255,150,170,0.75)' },
  { text: 'meeting in 5', size: 11, opacity: 0.5, color: 'rgba(180,220,140,0.7)' },
  { text: 'Q3 numbers are in', size: 14, opacity: 0.6, color: 'rgba(250,210,120,0.8)' },
  { text: 'can we align on this?', size: 12, opacity: 0.5, color: 'rgba(200,160,255,0.7)' },
  { text: 'sent you a Slack', size: 10, opacity: 0.45, color: 'rgba(130,210,230,0.7)' },
  { text: 'URGENT:', size: 16, opacity: 0.7, color: 'rgba(255,100,80,0.9)' },
  { text: 'thoughts?', size: 11, opacity: 0.5, color: 'rgba(180,180,255,0.7)' },
  { text: 'following up on my last email', size: 12, opacity: 0.5, color: 'rgba(255,180,140,0.7)' },
  { text: 'AI will replace you if—', size: 13, opacity: 0.65, color: 'rgba(255,210,80,0.85)' },
  { text: 'investor meeting in 2 hours', size: 12, opacity: 0.55, color: 'rgba(255,140,180,0.8)' },
  { text: 'new framework dropped', size: 12, opacity: 0.5, color: 'rgba(200,140,255,0.7)' },
  { text: 'deck due tomorrow', size: 11, opacity: 0.5, color: 'rgba(255,160,200,0.7)' },
  { text: 'did you see my DM?', size: 11, opacity: 0.5, color: 'rgba(120,180,255,0.7)' },
  { text: 'just one more tab', size: 11, opacity: 0.5, color: 'rgba(250,190,100,0.7)' },
  { text: 'let\'s take this offline', size: 12, opacity: 0.5, color: 'rgba(160,230,180,0.7)' },
];

/* ── Landing positions for chaos — kept within 5–90% to avoid overflow ── */
const CHAOS_POSITIONS = CHAOS_FRAGMENTS.map((_, i) => ({
  x: ((i * 137) % 80) + 5,
  y: ((i * 89 + 30) % 75) + 8,
  rotation: ((i * 17) % 21) - 10,
}));

const TRUTH_LINES = [
  { text: 'You already know what to say.', bright: false },
  { text: 'You need one clear minute', bright: false },
  { text: 'before you open your mouth.', bright: true },
];

const PIVOT_LINES = [
  'PitchVoid doesn\'t generate ideas for you.',
  'It takes the mess already in your head',
  'and makes it sound like you know what you\'re doing.',
];

const DEMO_INPUT = 'ceo wants update tmrw, revenue down 15%, no app yet, competitors crushing it, need to ask for 180k without sounding desperate...';

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
        Clear your head →
      </button>
    </div>
  );
}

/* ── Main Component ── */
export default function HowItWorks() {
  const stageRef = useRef<HTMLDivElement>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    if (prefersReducedMotion || !stageRef.current) return;

    const fragmentCount = isMobile ? 12 : CHAOS_FRAGMENTS.length;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ repeat: -1, repeatDelay: 2 });

      /* ── Reset everything ── */
      tl.set('.chaos-fragment, .opening-line, .truth-line, .pivot-line, .demo-area, .demo-tagline, .cta-area, .scanline', { opacity: 0 });
      tl.set('.chaos-fragment', { scale: 1, filter: 'blur(0px)' });
      tl.set('.typewriter-text', { width: 0 });
      tl.set('.stage-container', { filter: 'blur(0px)' });

      /* ═══ PHASE 1 — THE ASSAULT ═══ */
      // Opening line with glow pulse
      tl.fromTo('.opening-line',
        { opacity: 0, scale: 0.97, filter: 'blur(6px)' },
        { opacity: 1, scale: 1, filter: 'blur(0px)', duration: 0.9, ease: 'power2.out' }
      );
      // Glow pulse on opening line
      tl.to('.opening-line', {
        textShadow: '0 0 30px rgba(168,85,247,0.4), 0 0 60px rgba(168,85,247,0.15)',
        duration: 0.6,
        ease: 'power2.inOut',
      });
      tl.to('.opening-line', {
        textShadow: '0 0 0px rgba(168,85,247,0)',
        duration: 0.8,
        ease: 'power2.out',
      });
      tl.to({}, { duration: 0.5 }); // hold after glow

      // Chaos fragments flood in
      for (let i = 0; i < fragmentCount; i++) {
        const frag = CHAOS_FRAGMENTS[i];
        const startX = i % 2 === 0 ? -300 : 300;
        const startY = gsap.utils.random(-200, 200);
        tl.fromTo(`.chaos-${i}`,
          { opacity: 0, x: startX, y: startY, rotation: gsap.utils.random(-20, 20), filter: 'blur(4px)' },
          {
            opacity: frag.opacity,
            x: 0, y: 0,
            rotation: CHAOS_POSITIONS[i].rotation,
            filter: 'blur(0px)',
            duration: 0.25,
            ease: 'power2.out',
          },
          i === 0 ? '+=0' : '<+=0.07'
        );
      }

      // URGENT fragment shake
      const urgentIdx = CHAOS_FRAGMENTS.findIndex(f => f.text === 'URGENT:');
      if (urgentIdx < fragmentCount) {
        tl.to(`.chaos-${urgentIdx}`, {
          x: '+=3', duration: 0.05, repeat: 5, yoyo: true, ease: 'none',
        }, '-=0.2');
      }

      // Drift/jitter on all chaos fragments while they sit
      tl.to('.chaos-fragment', {
        x: '+=random(-6, 6)',
        y: '+=random(-4, 4)',
        rotation: '+=random(-3, 3)',
        duration: 0.8,
        ease: 'sine.inOut',
        stagger: { each: 0.04, from: 'random' },
      });

      tl.to({}, { duration: 0.2 }); // brief pause

      /* ═══ PHASE 2 — THE FREEZE + DISSOLVE ═══ */
      tl.to({}, { duration: 0.3 }); // freeze

      // Dissolve all fragments + opening line
      tl.to('.chaos-fragment', {
        opacity: 0,
        scale: 0.3,
        filter: 'blur(8px)',
        x: () => gsap.utils.random(-200, 200),
        y: () => gsap.utils.random(-200, 200),
        rotation: () => gsap.utils.random(-30, 30),
        stagger: { each: 0.02, from: 'center' },
        duration: 0.7,
        ease: 'power2.in',
      });
      tl.to('.opening-line', { opacity: 0, filter: 'blur(4px)', duration: 0.4 }, '<');

      /* ═══ PHASE 3 — THE TRUTH ═══ */
      tl.to({}, { duration: 0.6 }); // silence

      // Line 1
      tl.fromTo('.truth-0',
        { opacity: 0, y: 10, filter: 'blur(4px)' },
        { opacity: 0.7, y: 0, filter: 'blur(0px)', duration: 0.5, ease: 'power2.out' }
      );
      tl.to({}, { duration: 1 });
      tl.to('.truth-0', { opacity: 0.3, duration: 0.3 });

      // Line 2
      tl.fromTo('.truth-1',
        { opacity: 0, y: 10, filter: 'blur(4px)' },
        { opacity: 0.7, y: 0, filter: 'blur(0px)', duration: 0.5, ease: 'power2.out' }
      );
      tl.to({}, { duration: 1 });
      tl.to('.truth-1', { opacity: 0.3, duration: 0.3 });

      // Line 3 — punchline
      tl.fromTo('.truth-2',
        { opacity: 0, y: 10, filter: 'blur(4px)' },
        { opacity: 0.9, y: 0, filter: 'blur(0px)', duration: 0.5, ease: 'power2.out' }
      );
      tl.to({}, { duration: 1.2 });

      // Fade all truth
      tl.to('.truth-line', { opacity: 0, filter: 'blur(3px)', duration: 0.5 });

      /* ═══ PHASE 4 — THE PIVOT ═══ */
      tl.fromTo('.pivot-line',
        { opacity: 0, y: 10, filter: 'blur(3px)' },
        { opacity: 0.9, y: 0, filter: 'blur(0px)', stagger: 0.25, duration: 0.45, ease: 'power2.out' }
      );
      tl.to({}, { duration: 2 }); // hold

      tl.to('.pivot-line', { opacity: 0, filter: 'blur(3px)', duration: 0.4 });

      /* ═══ PHASE 5 — THE DEMO ═══ */
      tl.fromTo('.demo-area',
        { opacity: 0, scale: 0.97 },
        { opacity: 1, scale: 1, duration: 0.4 }
      );

      // Scanline sweep on input side
      tl.fromTo('.scanline',
        { opacity: 0.5, top: '0%' },
        { opacity: 0, top: '100%', duration: 1.8, ease: 'none' },
        '<'
      );

      // Typewriter
      tl.fromTo('.typewriter-text',
        { width: 0 },
        { width: '100%', duration: 1.8, ease: 'none' },
        '<'
      );

      // Arrow
      tl.fromTo('.demo-arrow',
        { opacity: 0, scale: 0.8 },
        { opacity: 0.6, scale: 1, duration: 0.3, ease: 'back.out(2)' },
        '-=0.8'
      );

      // Output sections with glow on labels
      tl.fromTo('.output-section',
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, stagger: 0.2, duration: 0.35, ease: 'power2.out' },
        '-=0.4'
      );
      tl.fromTo('.output-label',
        { textShadow: '0 0 12px rgba(168,85,247,0.6)' },
        { textShadow: '0 0 0px rgba(168,85,247,0)', duration: 1, ease: 'power2.out' },
        '-=0.6'
      );

      // Tagline
      tl.fromTo('.demo-tagline',
        { opacity: 0 },
        { opacity: 0.5, duration: 0.4 }
      );
      tl.to({}, { duration: 2.5 }); // hold

      // Fade out demo
      tl.to('.demo-area, .demo-tagline', { opacity: 0, scale: 0.98, duration: 0.4 });

      /* ═══ PHASE 6 — CTA ═══ */
      tl.fromTo('.cta-area',
        { opacity: 0, scale: 0.92, filter: 'blur(4px)' },
        { opacity: 1, scale: 1, filter: 'blur(0px)', duration: 0.5, ease: 'back.out(1.4)' }
      );
      tl.to({}, { duration: 2.5 }); // hold

      tl.to('.cta-area', { opacity: 0, filter: 'blur(3px)', duration: 0.4 });

      tlRef.current = tl;
    }, stageRef);

    return () => ctx.revert();
  }, [prefersReducedMotion, isMobile]);

  if (prefersReducedMotion) {
    return (
      <section className="py-20 sm:py-32 px-4 sm:px-8">
        <StaticFallback />
      </section>
    );
  }

  const fragmentCount = isMobile ? 12 : CHAOS_FRAGMENTS.length;

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
          minHeight: isMobile ? '440px' : 'clamp(400px, 55vw, 500px)',
        }}
      >
        {/* ── THE STAGE ── */}
        <div className="stage-container relative w-full h-full flex items-center justify-center" style={{ minHeight: isMobile ? '440px' : 'clamp(400px, 55vw, 500px)' }}>

          {/* Opening line */}
          <p
            className="opening-line absolute inset-0 flex items-center justify-center text-center px-6 font-sans font-medium z-10"
            style={{ fontSize: 'clamp(18px, 3.5vw, 28px)', color: 'rgba(240,237,246,0.85)', opacity: 0 }}
          >
            Your brain is a group chat you can't mute.
          </p>

          {/* Chaos fragments */}
          {CHAOS_FRAGMENTS.slice(0, fragmentCount).map((frag, i) => (
            <span
              key={i}
              className={`chaos-fragment chaos-${i} absolute will-change-transform`}
              style={{
                left: `${CHAOS_POSITIONS[i].x}%`,
                top: `${CHAOS_POSITIONS[i].y}%`,
                fontSize: Math.max(frag.size, isMobile ? 10 : frag.size),
                color: frag.color,
                fontFamily: "'Be Vietnam Pro', sans-serif",
                whiteSpace: 'nowrap',
                maxWidth: '90%',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
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

          {/* Pivot lines */}
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 px-6 pt-8">
            {PIVOT_LINES.map((line, i) => (
              <p
                key={i}
                className={`pivot-line font-sans text-center`}
                style={{
                  fontSize: 'clamp(12px, 2vw, 14px)',
                  color: 'rgba(240,237,246,0.9)',
                  lineHeight: 1.8,
                  opacity: 0,
                }}
              >
                {line}
              </p>
            ))}
          </div>

          {/* Demo area */}
          <div className={`demo-area absolute inset-0 flex items-center justify-center px-4 sm:px-8 ${isMobile ? 'flex-col gap-3' : 'flex-row gap-6'}`} style={{ opacity: 0 }}>
            {/* Left — messy input */}
            <div
              className="relative rounded-lg p-3 sm:p-4 overflow-hidden"
              style={{
                background: 'rgba(14,12,24,0.6)',
                border: '1px solid rgba(240,237,246,0.06)',
                maxWidth: isMobile ? '100%' : 340,
                flex: isMobile ? 'none' : 1,
                width: isMobile ? '100%' : 'auto',
              }}
            >
              {/* Scanline sweep */}
              <div
                className="scanline absolute left-0 right-0 h-px pointer-events-none z-10"
                style={{
                  background: 'linear-gradient(90deg, transparent, rgba(168,85,247,0.4), transparent)',
                  opacity: 0,
                }}
              />
              <p className="text-[9px] sm:text-[10px] font-medium uppercase tracking-[0.15em] mb-2 font-sans" style={{ color: 'rgba(168,85,247,0.6)' }}>
                YOUR MESS
              </p>
              <div className="overflow-hidden">
                <p
                  className="typewriter-text font-mono overflow-hidden"
                  style={{ fontSize: 'clamp(10px, 1.5vw, 12px)', color: '#ffffff', width: 0, whiteSpace: 'normal', wordBreak: 'break-word' }}
                >
                  {DEMO_INPUT}
                </p>
              </div>
            </div>

            {/* Arrow */}
            <span className="demo-arrow text-lg sm:text-xl shrink-0" style={{ color: 'rgba(168,85,247,0.6)', opacity: 0 }}>
              {isMobile ? '↓' : '→'}
            </span>

            {/* Right — clean output */}
            <div
              className="rounded-lg overflow-hidden"
              style={{
                background: 'rgba(14,12,24,0.8)',
                border: '1px solid rgba(168,85,247,0.15)',
                maxWidth: isMobile ? '100%' : 340,
                flex: isMobile ? 'none' : 1,
                width: isMobile ? '100%' : 'auto',
              }}
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
                  <p className="output-label text-[8px] sm:text-[9px] font-medium uppercase tracking-[0.15em] mb-1 font-sans m-0" style={{ color: 'rgba(168,85,247,0.7)' }}>
                    {section.label}
                  </p>
                  <p className="text-[10px] sm:text-[11px] m-0 leading-relaxed font-sans" style={{ color: '#ffffff' }}>
                    {section.text}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Demo tagline */}
          <p
            className="demo-tagline absolute bottom-6 left-0 right-0 text-center font-sans"
            style={{ fontSize: 'clamp(11px, 1.8vw, 13px)', color: '#ffffff', opacity: 0 }}
          >
            Overstimulated → Articulate. In seconds.
          </p>

          {/* CTA */}
          <div className="cta-area absolute inset-0 flex items-center justify-center z-20" style={{ opacity: 0 }}>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-8 py-3.5 rounded-full text-primary-foreground font-medium magenta-gradient text-base hover:opacity-90 hover:scale-105 transition-all cursor-pointer"
            >
              Clear your head →
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
