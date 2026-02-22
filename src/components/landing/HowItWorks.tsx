import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowRight } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

/* ── Data ── */
const FRAGMENTS = [
  { text: 'meeting with CEO tomorrow', group: 'context' },
  { text: 'revenue down 15%', group: 'numbers' },
  { text: 'need to ask for budget', group: 'ask' },
  { text: 'did something similar last year', group: 'context' },
  { text: 'competitors have online ordering', group: 'competition' },
  { text: '$180K engagement', group: 'numbers' },
  { text: 'digital transformation', group: 'competition' },
  { text: 'Q3 deadline approaching', group: 'context' },
];

const FRAGMENTS_MOBILE = FRAGMENTS.slice(0, 5);

const OUTPUT_SECTIONS = [
  {
    label: 'THE PROBLEM',
    points: [
      { text: 'Revenue declined **15%** year-over-year due to lack of digital presence', hasBold: true },
      { text: 'Competitors have launched online ordering — capturing market share', hasBold: false },
    ],
  },
  {
    label: 'PROVEN RESULTS',
    points: [
      { text: 'Previous **$180K** engagement delivered 3x ROI in 6 months', hasBold: true },
      { text: 'Built digital transformation roadmap for similar retailer last year', hasBold: false },
    ],
  },
  {
    label: 'THE PROPOSAL',
    points: [
      { text: 'Requesting budget approval for digital recovery initiative', hasBold: false },
      { text: 'Targeting Q3 launch with phased rollout to minimize risk', hasBold: false },
    ],
  },
];

const WHO_WHAT_WHY_HOW = [
  { label: 'WHO', value: 'CEO' },
  { label: 'WHAT', value: 'Budget Request' },
  { label: 'WHY', value: 'Revenue Recovery' },
  { label: 'HOW', value: 'Data-Driven' },
];

/* ── Helpers ── */
function renderBold(text: string) {
  const parts = text.split(/\*\*(.*?)\*\*/g);
  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <strong key={i} className="bold-metric text-foreground font-semibold">
        {part}
      </strong>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}

/* ── Scatter positions (deterministic) ── */
const SCATTER_POSITIONS = [
  { x: -280, y: -180, rot: -12, size: 14 },
  { x: 200, y: -140, rot: 8, size: 16 },
  { x: -160, y: 60, rot: -6, size: 13 },
  { x: 240, y: 100, rot: 14, size: 15 },
  { x: -300, y: 160, rot: -10, size: 12 },
  { x: 120, y: -60, rot: 5, size: 17 },
  { x: -80, y: 200, rot: -8, size: 14 },
  { x: 300, y: -20, rot: 11, size: 13 },
];

const SCATTER_POSITIONS_MOBILE = [
  { x: -100, y: -120, rot: -8, size: 12 },
  { x: 80, y: -80, rot: 6, size: 13 },
  { x: -60, y: 40, rot: -5, size: 11 },
  { x: 100, y: 80, rot: 10, size: 12 },
  { x: -40, y: 140, rot: -6, size: 11 },
];

export default function HowItWorks() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mql.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    if (reducedMotion || !sectionRef.current) return;

    const section = sectionRef.current;
    const isMobile = window.innerWidth < 640;
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: isMobile ? '+=2000' : '+=3000',
          pin: true,
          scrub: 1,
          anticipatePin: 1,
        },
      });

      /* ── PHASE 1: The Mess (0–30%) ── */
      // Fragments drift in from scattered positions
      tl.from('.fragment', {
        opacity: 0,
        scale: 0.7,
        duration: 0.8,
        stagger: 0.06,
      }, 0);

      // Label phase 1
      tl.fromTo('.phase-label',
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.3 },
        0.2
      );
      tl.to('.phase-label-text', {
        text: { value: 'Your scattered thoughts' },
        duration: 0,
      }, 0);

      // Subtle parallax drift
      tl.to('.fragment', {
        y: '+=12',
        x: '+=8',
        duration: 0.5,
        stagger: { each: 0.04, from: 'random' },
        ease: 'none',
      }, 0.5);

      /* ── PHASE 2: The Shift (30–60%) ── */
      // Pull fragments to center
      tl.to('.phase-label', { opacity: 0, duration: 0.15 }, 1.2);

      // WHO/WHAT/WHY/HOW cards flash
      tl.fromTo('.parse-card', {
        opacity: 0,
        scale: 0.8,
        y: 20,
      }, {
        opacity: 1,
        scale: 1,
        y: 0,
        duration: 0.4,
        stagger: 0.08,
        ease: 'power3.out',
      }, 1.3);

      // Organizing label
      tl.fromTo('.phase-label-organize',
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.3 },
        1.35
      );

      // Fragments pull to center and stack
      tl.to('.fragment', {
        x: 0,
        y: (i: number) => (i - (isMobile ? 2 : 3.5)) * 36,
        rotation: 0,
        scale: 1,
        opacity: 0.8,
        duration: 1,
        stagger: 0.04,
        ease: 'power3.inOut',
      }, 1.4);

      // Center morphing line
      tl.fromTo('.center-line', {
        scaleY: 0,
        opacity: 0,
      }, {
        scaleY: 1,
        opacity: 1,
        duration: 0.6,
        ease: 'power2.out',
      }, 1.5);

      /* ── PHASE 3: The Output (60–100%) ── */
      // Fade out fragments + parse cards + center line
      tl.to('.fragment', { opacity: 0, scale: 0.9, duration: 0.3, stagger: 0.02 }, 2.5);
      tl.to('.parse-card', { opacity: 0, scale: 0.9, duration: 0.2, stagger: 0.03 }, 2.5);
      tl.to('.center-line', { opacity: 0, duration: 0.2 }, 2.5);
      tl.to('.phase-label-organize', { opacity: 0, duration: 0.15 }, 2.5);

      // Output sections slide in
      tl.fromTo('.output-container', {
        opacity: 0,
        y: 40,
      }, {
        opacity: 1,
        y: 0,
        duration: 0.5,
        ease: 'power2.out',
      }, 2.8);

      tl.fromTo('.output-section', {
        opacity: 0,
        x: -30,
      }, {
        opacity: 1,
        x: 0,
        stagger: 0.15,
        duration: 0.5,
        ease: 'power2.out',
      }, 2.9);

      tl.fromTo('.output-point', {
        opacity: 0,
        x: -20,
      }, {
        opacity: 1,
        x: 0,
        stagger: 0.08,
        duration: 0.35,
      }, 3.1);

      // Bold metrics glow
      tl.fromTo('.bold-metric', {
        textShadow: '0 0 0px rgba(168,85,247,0)',
      }, {
        textShadow: '0 0 20px rgba(168,85,247,0.6)',
        duration: 0.4,
        stagger: 0.1,
      }, 3.3);
      tl.to('.bold-metric', {
        textShadow: '0 0 0px rgba(168,85,247,0)',
        duration: 0.6,
        stagger: 0.1,
      }, 3.7);

      // Ready label
      tl.fromTo('.phase-label-ready',
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.3 },
        3.4
      );

      // CTA
      tl.fromTo('.scroll-cta', {
        opacity: 0,
        y: 16,
      }, {
        opacity: 1,
        y: 0,
        duration: 0.4,
        ease: 'power2.out',
      }, 3.7);
    }, section);

    return () => {
      ctx.revert();
    };
  }, [reducedMotion]);

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
  const fragments = isMobile ? FRAGMENTS_MOBILE : FRAGMENTS;
  const positions = isMobile ? SCATTER_POSITIONS_MOBILE : SCATTER_POSITIONS;

  /* ── Reduced-motion static fallback ── */
  if (reducedMotion) {
    return (
      <section className="py-20 px-4 sm:px-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl sm:text-5xl text-foreground text-center mb-4 font-display">
            From scattered to structured
            <br />
            <span className="text-primary font-display" style={{ fontSize: 'clamp(36px, 8vw, 80px)' }}>in seconds.</span>
          </h2>
          <p className="text-center text-muted-foreground text-sm mb-12">
            Your messy thoughts become a polished pitch — automatically.
          </p>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Before */}
            <div className="rounded-2xl border border-border p-6 bg-card/30">
              <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-4">Your thoughts</p>
              <div className="flex flex-wrap gap-2">
                {FRAGMENTS.map((f, i) => (
                  <span key={i} className="text-xs px-3 py-1.5 rounded-full border border-border text-muted-foreground font-mono">
                    {f.text}
                  </span>
                ))}
              </div>
            </div>

            {/* After */}
            <div className="rounded-2xl border border-primary/20 p-6 bg-card/30">
              <p className="text-xs font-medium uppercase tracking-widest text-green-500/70 mb-4">Ready to send</p>
              {OUTPUT_SECTIONS.map((section, i) => (
                <div key={i} className="mb-4 last:mb-0">
                  <p className="text-[11px] font-medium uppercase tracking-widest text-primary/50 mb-2">{section.label}</p>
                  {section.points.map((point, j) => (
                    <div key={j} className="flex items-start gap-2 mb-1.5">
                      <div className="w-[3px] h-4 rounded-full bg-primary/40 mt-0.5 shrink-0" />
                      <p className="text-sm text-muted-foreground">{renderBold(point.text)}</p>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden"
      style={{
        height: '100vh',
        background: '#09080f',
      }}
    >
      {/* Grain texture overlay */}
      <div
        className="absolute inset-0 pointer-events-none z-[1]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Header — always visible */}
      <div className="absolute top-0 left-0 right-0 z-10 pt-12 sm:pt-16 text-center px-4">
        <h2
          className="text-foreground leading-[1.15] m-0"
          style={{ fontSize: 'clamp(28px, 5.2vw, 60px)', fontWeight: 400 }}
        >
          From scattered to structured
          <br />
          <span
            className="text-primary font-display font-medium"
            style={{ fontSize: 'clamp(36px, 8vw, 100px)' }}
          >
            in seconds.
          </span>
        </h2>
      </div>

      {/* Phase labels */}
      <div className="absolute top-[140px] sm:top-[180px] left-0 right-0 z-10 text-center">
        <p className="phase-label text-[11px] uppercase tracking-[0.2em] text-muted-foreground font-sans opacity-0">
          <span className="phase-label-text">Your scattered thoughts</span>
        </p>
        <p className="phase-label-organize text-[11px] uppercase tracking-[0.2em] text-primary/60 font-sans opacity-0">
          PitchVoid organizes
        </p>
        <p className="phase-label-ready text-[11px] uppercase tracking-[0.2em] font-sans opacity-0" style={{ color: 'rgba(34,197,94,0.7)' }}>
          Ready to send
        </p>
      </div>

      {/* Fragments container — centered in viewport */}
      <div className="absolute inset-0 z-[5] flex items-center justify-center">
        <div className="relative" style={{ width: isMobile ? 300 : 700, height: isMobile ? 320 : 420 }}>
          {fragments.map((frag, i) => {
            const pos = positions[i];
            return (
              <div
                key={i}
                className="fragment absolute will-change-transform"
                style={{
                  left: '50%',
                  top: '50%',
                  transform: `translate(-50%, -50%) translate(${pos.x}px, ${pos.y}px) rotate(${pos.rot}deg)`,
                  fontSize: pos.size,
                  opacity: 0,
                }}
              >
                <span
                  className="inline-block px-3 py-2 rounded-lg font-mono whitespace-nowrap"
                  style={{
                    background: 'rgba(168,85,247,0.12)',
                    border: '1px solid rgba(168,85,247,0.25)',
                    color: 'rgba(240,237,246,0.85)',
                    backdropFilter: 'blur(4px)',
                  }}
                >
                  {frag.text}
                </span>
              </div>
            );
          })}

          {/* Center organizing line */}
          <div
            className="center-line absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[2px] rounded-full opacity-0"
            style={{
              height: isMobile ? 200 : 300,
              background: 'linear-gradient(180deg, transparent, rgba(168,85,247,0.5), transparent)',
              transformOrigin: 'center',
            }}
          />

          {/* WHO/WHAT/WHY/HOW parse cards */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex gap-2 sm:gap-3">
            {WHO_WHAT_WHY_HOW.map((card) => (
              <div
                key={card.label}
                className="parse-card px-3 py-2 rounded-xl opacity-0 will-change-transform"
                style={{
                  background: 'rgba(168,85,247,0.15)',
                  border: '1px solid rgba(168,85,247,0.35)',
                }}
              >
                <p className="text-[9px] sm:text-[10px] font-bold text-primary tracking-[0.1em] mb-0.5 font-sans">{card.label}</p>
                <p className="text-[11px] sm:text-xs text-foreground/80 font-sans font-medium whitespace-nowrap">{card.value}</p>
              </div>
            ))}
          </div>

          {/* Output container */}
          <div
            className="output-container absolute inset-0 flex items-center justify-center opacity-0 will-change-transform"
          >
            <div
              className="w-full max-w-md rounded-2xl overflow-hidden"
              style={{
                border: '1px solid rgba(168,85,247,0.25)',
                background: 'rgba(14,12,24,0.95)',
                backdropFilter: 'blur(20px)',
              }}
            >
              {OUTPUT_SECTIONS.map((section, sIdx) => (
                <div
                  key={sIdx}
                  className="output-section"
                  style={{
                    padding: '16px 24px',
                    borderBottom: sIdx < OUTPUT_SECTIONS.length - 1 ? '1px solid rgba(168,85,247,0.12)' : 'none',
                  }}
                >
                  <p
                    className="text-[10px] sm:text-[11px] font-medium uppercase tracking-[0.15em] mb-2.5 font-sans"
                    style={{ color: 'rgba(168,85,247,0.8)' }}
                  >
                    {section.label}
                  </p>
                  <div className="space-y-2">
                    {section.points.map((point, pIdx) => (
                      <div key={pIdx} className="output-point flex items-start gap-2.5">
                        <div
                          className="w-[3px] rounded-full shrink-0 mt-1"
                          style={{
                            height: 14,
                            background: 'linear-gradient(180deg, rgba(168,85,247,0.8), rgba(168,85,247,0.3))',
                          }}
                        />
                        <p className="text-xs sm:text-sm m-0 leading-relaxed font-sans" style={{ color: 'rgba(240,237,246,0.75)' }}>
                          {renderBold(point.text)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="scroll-cta absolute bottom-12 sm:bottom-16 left-0 right-0 z-10 text-center opacity-0">
        <button
          onClick={() => navigate('/dashboard')}
          className="inline-flex items-center gap-2.5 px-6 py-3 rounded-xl text-primary-foreground font-medium magenta-gradient text-sm hover:opacity-90 transition-opacity group"
        >
          Try it free
          <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      {/* Step numbers — subtle left margin markers */}
      <div className="absolute left-4 sm:left-8 top-1/2 -translate-y-1/2 z-[2] flex flex-col gap-6 sm:gap-8">
        {['01', '02', '03'].map((num) => (
          <span
            key={num}
            className="text-[10px] sm:text-xs font-display"
            style={{ color: 'rgba(168,85,247,0.3)' }}
          >
            {num}
          </span>
        ))}
      </div>
    </section>
  );
}
