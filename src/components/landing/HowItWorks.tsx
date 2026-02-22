import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import gsap from 'gsap';

const EASE = [0.25, 0.1, 0.25, 1.0] as [number, number, number, number];

const FRAGMENTS = [
  { text: 'meeting with ceo tomorrow', scatter: { x: -10, y: 0, rotation: -3 }, organized: { x: 0, y: 0 } },
  { text: 'revenue down 15%', scatter: { x: 30, y: 8, rotation: 2 }, organized: { x: 0, y: 30 } },
  { text: 'competitors have apps', scatter: { x: -5, y: -4, rotation: -2 }, organized: { x: 0, y: 60 } },
  { text: 'we did this for a restaurant chain', scatter: { x: 20, y: 12, rotation: 4 }, organized: { x: 0, y: 90 } },
  { text: 'need 180k budget approved', scatter: { x: -15, y: 3, rotation: -1 }, organized: { x: 0, y: 120 } },
  { text: 'q3 launch deadline', scatter: { x: 25, y: -6, rotation: 3 }, organized: { x: 0, y: 150 } },
  { text: 'digital transformation pitch', scatter: { x: -8, y: 10, rotation: -2 }, organized: { x: 0, y: 180 } },
  { text: 'show roi from last project', scatter: { x: 15, y: -3, rotation: 1 }, organized: { x: 0, y: 210 } },
];

const PARSED_LABELS = [
  { tag: 'WHO', value: 'CEO' },
  { tag: 'WHAT', value: 'Budget Request' },
  { tag: 'WHY', value: 'Revenue Recovery' },
  { tag: 'HOW', value: 'Data-Driven' },
];

const OUTPUT_SECTIONS = [
  {
    label: 'THE PROBLEM',
    point: <>Revenue declined <strong>15% YoY</strong> — no digital presence</>,
  },
  {
    label: 'PROVEN RESULTS',
    point: <>Previous engagement → <strong>35% repeat customers</strong> in 4 months</>,
  },
  {
    label: 'THE PROPOSAL',
    point: <><strong>$180K</strong> engagement, starting with 2-week diagnostic</>,
  },
];

/* ── Static reduced-motion fallback ── */
function StaticFallback() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {[
        { num: '01', title: 'Drop your thoughts', desc: 'Type anything — messy notes, bullet points, voice memos.' },
        { num: '02', title: 'AI organizes your story', desc: 'We parse WHO, WHAT, WHY, HOW from your input.' },
        { num: '03', title: 'Your cheat sheet, ready', desc: 'Get a polished one-pager, script, or slide deck.' },
      ].map((s) => (
        <div
          key={s.num}
          className="rounded-2xl p-6"
          style={{ background: 'rgba(9,8,15,0.85)', border: '1px solid rgba(168,85,247,0.08)' }}
        >
          <span className="font-display block mb-1" style={{ fontSize: 32, color: 'rgba(240,237,246,0.06)' }}>{s.num}</span>
          <h4 className="text-base font-sans font-medium text-foreground/80 mb-2">{s.title}</h4>
          <p className="text-xs font-sans" style={{ color: 'rgba(240,237,246,0.5)' }}>{s.desc}</p>
        </div>
      ))}
    </div>
  );
}

/* ── Main Component ── */
export default function HowItWorks() {
  const cardRef = useRef<HTMLDivElement>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    if (prefersReducedMotion || !cardRef.current) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ repeat: -1, repeatDelay: 2 });

      // ── Reset all elements to hidden ──
      tl.set('.fragment, .parsed-label, .output-preview, .phase-label', { opacity: 0 });
      tl.set('.fragment', { x: 0, y: 0, rotation: 0 });

      // ── PHASE 1: Drop ──
      tl.set('.phase-label-1', { opacity: 1 });
      tl.set('.dot', { scale: 1, backgroundColor: 'rgba(168,85,247,0.15)' });
      tl.to('.dot-1', { backgroundColor: 'rgba(168,85,247,0.8)', scale: 1.3, duration: 0.2, yoyo: true, repeat: 1 });

      // Scatter fragments in
      FRAGMENTS.forEach((f, i) => {
        tl.set(`.fragment-${i}`, {
          x: f.scatter.x,
          y: f.scatter.y,
          rotation: f.scatter.rotation,
        }, '<');
      });
      tl.to('.fragment', {
        opacity: 0.6,
        stagger: 0.3,
        duration: 0.4,
        ease: 'power2.out',
      });
      tl.to({}, { duration: 2 }); // pause

      // ── PHASE 2: Organize ──
      tl.to('.phase-label-1', { opacity: 0, duration: 0.3 });
      tl.set('.phase-label-2', { opacity: 1 });
      tl.set('.dot', { scale: 1, backgroundColor: 'rgba(168,85,247,0.15)' });
      tl.to('.dot-2', { backgroundColor: 'rgba(168,85,247,0.8)', scale: 1.3, duration: 0.2, yoyo: true, repeat: 1 }, '<');

      // Fade out fragments without parsed labels
      FRAGMENTS.forEach((_, i) => {
        if (i >= PARSED_LABELS.length) {
          tl.to(`.fragment-${i}`, { opacity: 0, duration: 0.5 }, '<');
        }
      });

      // Organize fragments that have parsed labels
      FRAGMENTS.forEach((f, i) => {
        if (i < PARSED_LABELS.length) {
          tl.to(`.fragment-${i}`, {
            x: f.organized.x,
            y: f.organized.y,
            rotation: 0,
            opacity: 0.85,
            duration: 1.2,
            ease: 'power3.inOut',
          }, '<');
        }
      });

      // Show parsed labels
      tl.to('.parsed-label', {
        opacity: 1,
        stagger: 0.15,
        duration: 0.4,
        ease: 'power2.out',
      });
      tl.to({}, { duration: 2 }); // pause

      // ── PHASE 3: Output ──
      tl.to('.phase-label-2', { opacity: 0, duration: 0.3 });
      tl.set('.phase-label-3', { opacity: 1 });
      tl.set('.dot', { scale: 1, backgroundColor: 'rgba(168,85,247,0.15)' });
      tl.to('.dot-3', { backgroundColor: 'rgba(168,85,247,0.8)', scale: 1.3, duration: 0.2, yoyo: true, repeat: 1 }, '<');

      // Hide Phase 2 content
      tl.to('.fragment, .parsed-label', { opacity: 0, duration: 0.5 });

      // Show output
      tl.fromTo('.output-preview', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' });
      tl.fromTo('.output-section', { opacity: 0, y: 10 }, { opacity: 1, y: 0, stagger: 0.2, duration: 0.4, ease: 'power2.out' });
      tl.to({}, { duration: 2 }); // pause

      // ── Reset for loop ──
      tl.to('.output-preview', { opacity: 0, duration: 0.5 });
      tl.to('.phase-label-3', { opacity: 0, duration: 0.3 }, '<');

      tlRef.current = tl;
    }, cardRef);

    return () => ctx.revert();
  }, [prefersReducedMotion]);

  const handleMouseEnter = () => tlRef.current?.pause();
  const handleMouseLeave = () => tlRef.current?.resume();

  return (
    <section className="py-20 sm:py-32 px-4 sm:px-8">
      <div className="max-w-[1100px] mx-auto">
        {/* Section heading */}
        <motion.div
          className="text-center mb-16 sm:mb-20"
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

        {/* Animated card or static fallback */}
        {prefersReducedMotion ? (
          <StaticFallback />
        ) : (
          <div
            ref={cardRef}
            className="mx-auto max-w-[900px] rounded-[20px] p-6 sm:p-12"
            style={{
              background: 'rgba(9,8,15,0.85)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              border: '1px solid rgba(168,85,247,0.08)',
            }}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            {/* Phase labels — toggled via opacity */}
            <div className="relative h-5 mb-4">
              <span
                className="phase-label phase-label-1 absolute inset-0 text-[11px] sm:text-xs font-sans font-medium uppercase tracking-[0.15em]"
                style={{ color: 'rgba(168,85,247,0.7)', opacity: 0 }}
              >
                01&nbsp;&nbsp;Drop your thoughts
              </span>
              <span
                className="phase-label phase-label-2 absolute inset-0 text-[11px] sm:text-xs font-sans font-medium uppercase tracking-[0.15em]"
                style={{ color: 'rgba(168,85,247,0.7)', opacity: 0 }}
              >
                02&nbsp;&nbsp;AI organizes your story
              </span>
              <span
                className="phase-label phase-label-3 absolute inset-0 text-[11px] sm:text-xs font-sans font-medium uppercase tracking-[0.15em]"
                style={{ color: 'rgba(168,85,247,0.7)', opacity: 0 }}
              >
                03&nbsp;&nbsp;Your cheat sheet, ready
              </span>
            </div>

            {/* Stage area */}
            <div
              className="relative overflow-hidden rounded-xl"
              style={{
                height: 'clamp(280px, 40vw, 320px)',
                background: 'rgba(14,12,24,0.4)',
                border: '1px solid rgba(168,85,247,0.06)',
              }}
            >
              {/* Phase 1 & 2: Fragments */}
              {FRAGMENTS.map((f, i) => (
                <div
                  key={i}
                  className={`fragment fragment-${i} absolute will-change-transform`}
                  style={{
                    left: 24,
                    top: 16 + i * 32,
                    opacity: 0,
                    fontFamily: 'monospace',
                    fontSize: 'clamp(11px, 1.5vw, 13px)',
                    color: 'rgba(240,237,246,0.5)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {/* Parsed label badge (visible in Phase 2) */}
                  {i < PARSED_LABELS.length && (
                    <span
                      className={`parsed-label parsed-label-${i} inline-block mr-2 align-middle`}
                      style={{
                        opacity: 0,
                        background: 'rgba(168,85,247,0.12)',
                        borderRadius: 4,
                        padding: '2px 8px',
                        fontSize: 9,
                        fontFamily: "'Be Vietnam Pro', sans-serif",
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em',
                        color: 'hsl(var(--primary))',
                      }}
                    >
                      {PARSED_LABELS[i].tag}
                    </span>
                  )}
                  <span>{f.text}</span>
                </div>
              ))}

              {/* Phase 3: Output preview */}
              <div
                className="output-preview absolute inset-0 p-4 sm:p-6 will-change-transform"
                style={{ opacity: 0 }}
              >
                <div
                  className="rounded-xl overflow-hidden h-full"
                  style={{
                    background: 'rgba(14,12,24,0.95)',
                    border: '1px solid rgba(168,85,247,0.2)',
                  }}
                >
                  {OUTPUT_SECTIONS.map((section, sIdx) => (
                    <div
                      key={sIdx}
                      className="output-section px-4 sm:px-5 py-3 sm:py-4"
                      style={{
                        borderBottom: sIdx < OUTPUT_SECTIONS.length - 1 ? '1px solid rgba(168,85,247,0.1)' : 'none',
                      }}
                    >
                      <p
                        className="text-[9px] sm:text-[10px] font-medium uppercase tracking-[0.15em] mb-1.5 font-sans m-0"
                        style={{ color: 'rgba(168,85,247,0.8)' }}
                      >
                        {section.label}
                      </p>
                      <div className="flex items-start gap-2">
                        <div
                          className="w-[3px] h-3.5 rounded-full shrink-0 mt-0.5"
                          style={{ background: 'linear-gradient(180deg, rgba(168,85,247,0.8), rgba(168,85,247,0.3))' }}
                        />
                        <p
                          className="text-[11px] sm:text-xs m-0 leading-relaxed font-sans"
                          style={{ color: 'rgba(240,237,246,0.75)' }}
                        >
                          {section.point}
                        </p>
                      </div>
                    </div>
                  ))}

                  {/* Format pills */}
                  <div className="flex gap-2 px-4 sm:px-5 pb-3 sm:pb-4 pt-1">
                    <span
                      className="text-[10px] sm:text-[11px] px-3 py-1 rounded-full font-sans font-medium"
                      style={{
                        background: 'rgba(168,85,247,0.15)',
                        border: '1px solid rgba(168,85,247,0.3)',
                        color: 'hsl(var(--primary))',
                      }}
                    >
                      One-Pager
                    </span>
                    <span
                      className="text-[10px] sm:text-[11px] px-3 py-1 rounded-full font-sans font-medium"
                      style={{
                        background: 'rgba(240,237,246,0.04)',
                        border: '1px solid rgba(240,237,246,0.1)',
                        color: 'rgba(240,237,246,0.5)',
                      }}
                    >
                      Script
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Carousel dots */}
            <div className="flex justify-center gap-3 mt-6">
              <span className="dot dot-1 w-2 h-2 rounded-full will-change-transform" style={{ backgroundColor: 'rgba(168,85,247,0.15)' }} />
              <span className="dot dot-2 w-2 h-2 rounded-full will-change-transform" style={{ backgroundColor: 'rgba(168,85,247,0.15)' }} />
              <span className="dot dot-3 w-2 h-2 rounded-full will-change-transform" style={{ backgroundColor: 'rgba(168,85,247,0.15)' }} />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
