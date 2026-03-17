import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAnimate, stagger, useReducedMotion } from 'motion/react';
import { Bot, NotebookPen, MessageSquare, Mail, Calendar, FileText, Hash, Sparkles, UploadCloud, Image as ImageIcon } from 'lucide-react';

/* ── App UI Definitions ── */
const APPS = {
  notes: { name: 'Notes', icon: NotebookPen, bg: 'bg-gradient-to-b from-yellow-300 to-yellow-500', color: 'text-yellow-900', border: 'border-yellow-500/20' },
  chatgpt: { name: 'ChatGPT', icon: Bot, bg: 'bg-[#10a37f]', color: 'text-white', border: 'border-[#10a37f]/50' },
  notion: { name: 'Notion', icon: FileText, bg: 'bg-white', color: 'text-black', border: 'border-slate-200' },
  slack: { name: 'Slack', icon: Hash, bg: 'bg-gradient-to-b from-purple-500 to-purple-700', color: 'text-white', border: 'border-purple-500/30' },
  messages: { name: 'Messages', icon: MessageSquare, bg: 'bg-gradient-to-b from-green-400 to-green-600', color: 'text-white', border: 'border-green-500/30' },
  mail: { name: 'Mail', icon: Mail, bg: 'bg-gradient-to-b from-blue-400 to-blue-600', color: 'text-white', border: 'border-blue-500/30' },
  calendar: { name: 'Calendar', icon: Calendar, bg: 'bg-gradient-to-b from-red-400 to-red-600', color: 'text-white', border: 'border-red-500/30' }
};

/* ── Content Data (5 Messy Fragments) ── */
const MESS_CARDS = [
  { app: APPS.slack, text: "@here revenue down 15% this quarter, churn is spiking. Need all hands on deck to brainstorm retention strategies before Friday." },
  { app: APPS.messages, text: "did you see what they just shipped? 😭 It's exactly our Q4 roadmap but they actually executed it and it looks gorgeous." },
  { app: APPS.notes, text: "startup pivot ideas... b2b ai wrapper? no wait. maybe we focus entirely on the enterprise workflow segment instead of smb." },
  { app: APPS.chatgpt, text: "how to not sound desperate asking for 180k. 'We see an opportunity to accelerate growth...' no that sounds like corporate BS." },
  { app: APPS.notion, text: "Brainstorming document 3 (Final_v2) - If we pivot to a B2B SaaS model, we can probably charge 10x more for the same API." },
];

/* ── Responsive Positioning Logic ── */
const getScatteredPositions = (windowWidth: number) => {
  const isMobile = windowWidth < 640;
  const containerWidth = Math.min(windowWidth - 32, 1100);
  const containerHeight = isMobile ? 560 : Math.min(windowWidth * 0.75, 760);

  const scale = isMobile ? 0.72 : (windowWidth < 1024 ? 0.85 : 1);
  const cardW = (isMobile ? 180 : 320) * scale;
  const cardH = 120 * scale;

  const maxX = Math.max(0, (containerWidth / 2) - (cardW / 2) - 10);
  const maxY = Math.max(0, (containerHeight / 2) - (cardH / 2) - 20);

  const normalized = isMobile
    ? [
        { x: -0.25, y: -0.6, r: -6 },
        { x: 0.25, y: -0.35, r: 8 },
        { x: -0.05, y: -0.05, r: -3 },
        { x: -0.3, y: 0.3, r: 7 },
        { x: 0.3, y: 0.55, r: -5 },
      ]
    : [
        { x: -0.6, y: -0.5, r: -8 },
        { x: 0.6, y: -0.4, r: 12 },
        { x: 0, y: 0.05, r: -4 },
        { x: -0.5, y: 0.55, r: 10 },
        { x: 0.55, y: 0.5, r: -6 },
      ];

  return normalized.map(p => ({
    x: p.x * maxX,
    y: p.y * maxY,
    r: p.r
  }));
};

const getUploadPositions = (windowWidth: number) => {
  if (windowWidth < 640) {
    return [
      { x: -80, y: -70, r: -6 },
      { x: 80, y: -40, r: 8 },
      { x: -60, y: 60, r: 4 },
      { x: 70, y: 70, r: -7 },
    ];
  }
  const scale = windowWidth < 1024 ? 0.8 : 1;
  return [
    { x: -160 * scale, y: -40 * scale, r: -8 },
    { x: 140 * scale, y: 30 * scale, r: 12 },
    { x: -80 * scale, y: 80 * scale, r: 5 },
    { x: 100 * scale, y: -80 * scale, r: -10 },
  ];
};

const COMBINED_MESS = [
  "startup pivot ideas... b2b ai wrapper? no wait. ceo wants update tomorrow on the roadmap, but revenue is down 15% this quarter and churn is spiking. we have no actual app yet, just a figma prototype that barely works on mobile, and investors are getting anxious about our burn rate.",
  "competitors are crushing it. we need to figure out how to ask for 180k in bridge funding without sounding completely desperate... emergency sync to figure out our narrative before the board meeting."
];

/* ── 3 Output Sections (matches PitchVoid's actual 3-section structure) ── */
const OUTPUT_SECTIONS = [
  { label: 'THE SITUATION', text: 'Revenue down 15% with spiking churn. Competitors shipped the Q4 roadmap first. No production app, only a prototype.' },
  { label: 'THE EVIDENCE', text: 'Enterprise B2B pivot unlocks 10x pricing on existing architecture. Current SMB model is unsustainable at this burn rate.' },
  { label: 'THE ASK', text: 'Secure $180K bridge round framed as strategic repositioning into enterprise, not a lifeline.' },
];

export default function HowItWorks() {
  const [scope, animate] = useAnimate();
  const [isMobile, setIsMobile] = useState(false);
  const prefersReducedMotion = useReducedMotion();
  const navigate = useNavigate();

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    let isActive = true;

    const safeDelay = async (ms: number) => {
      await new Promise(r => setTimeout(r, ms));
      if (!isActive) throw new Error("cancelled");
    };

    const runAnimation = async () => {
      try {
        if (prefersReducedMotion) {
          if (!scope.current) return;
          await animate('.consolidated-card', { opacity: 1, scale: 1, filter: 'blur(0px)' }, { duration: 0 });
          await animate('.mess-text-container', { opacity: 0 }, { duration: 0 });
          await animate('.clean-sec', { opacity: 1, y: 0, filter: 'blur(0px)' }, { duration: 0 });
          await animate('.demo-tagline', { opacity: 1, y: 0 }, { duration: 0 });
          await animate('.cta-area', { opacity: 1, scale: 1, filter: 'blur(0px)', pointerEvents: 'auto' }, { duration: 0 });
          return;
        }

        while (isActive) {
          if (!scope.current) break;

          // --- 0. Reset Phase ---
          await animate([
            ['.core-text-1', { opacity: 0, scale: 1, filter: 'blur(6px)' }, { duration: 0, at: 0 }],
            ['.core-text-2', { opacity: 0, scale: 1, filter: 'blur(6px)' }, { duration: 0, at: 0 }],
            ['.core-text-3', { opacity: 0, y: -10, filter: 'blur(6px)' }, { duration: 0, at: 0 }],
            ['.mess-card', { opacity: 0, scale: 0.2, x: 0, y: 0, rotate: 0, filter: 'blur(0px)' }, { duration: 0, at: 0 }],
            ['.upload-page-container', { opacity: 0 }, { duration: 0, at: 0 }],
            ['.upload-dropzone', { opacity: 0, scale: 0.95, borderColor: 'rgba(168,85,247,0.2)', backgroundColor: 'rgba(255,255,255,0.02)' }, { duration: 0, at: 0 }],
            ['.upload-icon', { y: 0, color: 'rgba(168,85,247,0.5)' }, { duration: 0, at: 0 }],
            ['.upload-item', { opacity: 0, scale: 1.5, x: 0, y: -200, rotate: 0, filter: 'blur(10px)' }, { duration: 0, at: 0 }],
            ['.consolidated-card', { opacity: 0, scale: 0.5, filter: 'blur(10px)' }, { duration: 0, at: 0 }],
            ['.mess-text-container', { opacity: 1, filter: 'blur(0px)' }, { duration: 0, at: 0 }],
            ['.process-scanline', { opacity: 0, top: '0%' }, { duration: 0, at: 0 }],
            ['.clean-sec', { opacity: 0, y: 15, filter: 'blur(4px)' }, { duration: 0, at: 0 }],
            ['.demo-tagline', { opacity: 0, y: 10 }, { duration: 0, at: 0 }],
            ['.cta-area', { opacity: 0, scale: 0.9, filter: 'blur(4px)', pointerEvents: 'none' }, { duration: 0, at: 0 }],
          ]);

          if (!isActive) break;

          // ==========================================
          // PAGE 1: THE CHAOS
          // ==========================================
          await animate('.core-text-1', { opacity: 1, filter: 'blur(0px)' }, { duration: 0.8, ease: "easeOut" });
          await safeDelay(1200);

          animate('.core-text-1', { opacity: 0, scale: 0.9, filter: 'blur(6px)' }, { duration: 0.4 });

          const currentWidth = window.innerWidth;
          const positions = getScatteredPositions(currentWidth);
          const cardScale = currentWidth < 640 ? 0.72 : (currentWidth < 1024 ? 0.85 : 1);

          const scatterAnims: any[] = MESS_CARDS.map((_, i) => [
            `.mess-card-${i}`,
            { opacity: 1, scale: cardScale, x: positions[i].x, y: positions[i].y, rotate: positions[i].r },
            { type: 'spring', bounce: 0.5, duration: 0.6, at: i * 0.015 }
          ]);

          await animate(scatterAnims);
          await safeDelay(2200);

          const clearChaosAnims: any[] = MESS_CARDS.map((_, i) => [
            `.mess-card-${i}`,
            { opacity: 0, scale: 0.5, filter: 'blur(10px)' },
            { duration: 0.4, at: i * 0.015 }
          ]);
          await animate(clearChaosAnims);
          await safeDelay(400);

          if (!isActive) break;

          // ==========================================
          // PAGE 2: THE PROBLEM
          // ==========================================
          await animate('.core-text-2', { opacity: 1, filter: 'blur(0px)' }, { duration: 0.8, ease: "easeOut" });
          await safeDelay(3600);
          await animate('.core-text-2', { opacity: 0, scale: 0.95, filter: 'blur(6px)' }, { duration: 0.6 });

          if (!isActive) break;

          // ==========================================
          // PAGE 3: THE UPLOAD
          // ==========================================
          animate('.upload-page-container', { opacity: 1 }, { duration: 0 });

          await animate([
            ['.core-text-3', { opacity: 1, y: 0, filter: 'blur(0px)' }, { duration: 0.8, ease: "easeOut", at: 0 }],
            ['.upload-dropzone', { opacity: 1, scale: 1 }, { duration: 0.8, type: "spring", bounce: 0.4, at: 0.2 }]
          ]);

          const uploadPositions = getUploadPositions(currentWidth);
          const uploadScale = currentWidth < 640 ? 0.6 : 0.9;

          const dropAnims: any[] = [0, 1, 2, 3].map((i) => [
            `.upload-item-${i}`,
            { opacity: 1, scale: uploadScale, x: uploadPositions[i].x, y: uploadPositions[i].y, rotate: uploadPositions[i].r, filter: 'blur(0px)' },
            { type: 'spring', bounce: 0.4, duration: 0.8, at: i * 0.15 }
          ]);

          await animate(dropAnims);

          animate('.upload-dropzone',
            { borderColor: ['rgba(168,85,247,0.2)', 'rgba(168,85,247,0.8)', 'rgba(168,85,247,0.4)'], backgroundColor: ['rgba(255,255,255,0.02)', 'rgba(168,85,247,0.1)', 'rgba(255,255,255,0.04)'] },
            { duration: 1.5, times: [0, 0.2, 1] }
          );
          animate('.upload-icon', { y: [0, -10, 0], color: ['rgba(168,85,247,0.5)', 'rgba(168,85,247,1)', 'rgba(168,85,247,0.8)'] }, { duration: 0.6 });

          await safeDelay(2000);

          await animate([
            ['.core-text-3', { opacity: 0, y: -10, filter: 'blur(6px)' }, { duration: 0.6, at: 0 }],
            ['.upload-dropzone', { opacity: 0, scale: 0.95 }, { duration: 0.6, at: 0.1 }]
          ]);

          if (!isActive) break;

          // ==========================================
          // PAGE 4: THE SYNTHESIS
          // ==========================================
          const suckAnims: any[] = [];

          [0, 1, 2, 3].forEach(i => {
            suckAnims.push([
              `.upload-item-${i}`,
              { opacity: 0, scale: 0.1, x: 0, y: 0, rotate: uploadPositions[i].r - 180, filter: 'blur(8px)' },
              { duration: 0.6, ease: "anticipate", at: i * 0.05 }
            ]);
          });

          suckAnims.push([
            '.consolidated-card',
            { opacity: 1, scale: 1, filter: 'blur(0px)' },
            { duration: 0.6, type: 'spring', bounce: 0.4, at: 0.3 }
          ]);

          await animate(suckAnims);
          if (!isActive) break;

          await safeDelay(800);

          animate('.process-scanline', { opacity: [0, 1, 1, 0], top: ['0%', '100%'] }, { duration: 3.5, ease: "linear", times: [0, 0.1, 0.9, 1] });
          animate('.mess-text-container', { opacity: 0, filter: 'blur(4px)' }, { duration: 1.2, delay: 1.2 });
          await animate('.clean-sec', { opacity: 1, y: 0, filter: 'blur(0px)' }, { duration: 0.6, delay: stagger(0.3, { startDelay: 1.5 }), ease: "easeOut" });

          if (!isActive) break;
          await safeDelay(500);

          animate('.demo-tagline', { opacity: 1, y: 0 }, { duration: 0.5 });
          await animate('.cta-area', { opacity: 1, scale: 1, filter: 'blur(0px)', pointerEvents: 'auto' }, { duration: 0.6, type: "spring", bounce: 0.5, delay: 0.1 });

          await safeDelay(4500);

          await animate([
            ['.consolidated-card', { opacity: 0, scale: 0.95, filter: 'blur(10px)' }, { duration: 0.5, at: 0 }],
            ['.demo-tagline', { opacity: 0 }, { duration: 0.4, at: 0 }],
            ['.cta-area', { opacity: 0, filter: 'blur(4px)', pointerEvents: 'none' }, { duration: 0.4, at: 0 }]
          ]);
          await safeDelay(400);
        }
      } catch (error: any) {
        if (isActive && error.message !== "cancelled") console.error("Animation error:", error);
      }
    };

    runAnimation();
    return () => { isActive = false; };
  }, [animate, prefersReducedMotion]);

  return (
    <section className="w-full py-20 sm:py-32 px-4 sm:px-8">
      <div
        ref={scope}
        className="w-full max-w-[1100px] mx-auto rounded-[24px] relative overflow-hidden shadow-2xl"
        style={{
          background: 'rgba(9,8,15,0.92)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(168,85,247,0.15)',
          minHeight: isMobile ? '580px' : 'clamp(680px, 75vw, 760px)',
        }}
      >
        <div className="relative w-full h-full flex items-center justify-center" style={{ minHeight: isMobile ? '580px' : 'clamp(680px, 75vw, 760px)' }}>

          {/* ======================= */}
          {/* PAGE 1: TEXT */}
          {/* ======================= */}
          <div className="core-text-1 absolute inset-0 flex items-center justify-center pointer-events-none z-40 px-5" style={{ opacity: 0 }}>
            <h3 className="text-xl sm:text-3xl md:text-4xl font-medium text-white/90 text-center max-w-lg leading-tight font-sans drop-shadow-2xl">
              Your brain is a group chat<br className="hidden sm:block" /> you can't mute.
            </h3>
          </div>

          {/* ======================= */}
          {/* PAGE 1: CHAOS CARDS */}
          {/* ======================= */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30 perspective-1000" aria-hidden="true">
            {MESS_CARDS.map((card, i) => (
              <div
                key={i}
                className={`mess-card mess-card-${i} absolute w-[180px] sm:w-[320px] rounded-xl sm:rounded-2xl bg-[#1c1c1e]/85 backdrop-blur-2xl border border-white/10 p-3 sm:p-5 shadow-2xl flex flex-col gap-1.5 sm:gap-2.5 origin-center`}
                style={{ opacity: 0, zIndex: MESS_CARDS.length - i }}
              >
                <div className="flex items-center gap-2">
                  <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-[6px] flex items-center justify-center border shadow-inner ${card.app.bg} ${card.app.border}`}>
                    <card.app.icon size={12} className={card.app.color} strokeWidth={2.5} />
                  </div>
                  <span className="text-[11px] sm:text-[12px] font-semibold tracking-wide text-white/60 uppercase">
                    {card.app.name}
                  </span>
                </div>
                <p className="text-[13px] sm:text-[14px] text-white/95 leading-relaxed font-medium line-clamp-4">
                  {card.text}
                </p>
              </div>
            ))}
          </div>

          {/* ======================= */}
          {/* PAGE 2: CONTEXT TEXT */}
          {/* ======================= */}
          <div className="core-text-2 absolute inset-0 flex items-center justify-center pointer-events-none z-40 px-5" style={{ opacity: 0 }}>
            <h3 className="text-base sm:text-xl md:text-2xl font-medium text-white/95 text-center max-w-2xl leading-relaxed font-sans drop-shadow-2xl">
              You had the idea. The pitch. The thing you needed to say.<br className="hidden sm:block" />
              <span className="text-white/60">But by the time you sat down to organize it, ten other things had already gotten in the way.</span>
            </h3>
          </div>

          {/* ======================= */}
          {/* PAGE 3: UPLOAD PAGE */}
          {/* ======================= */}
          <div className="core-text-3 absolute top-8 sm:top-16 left-0 right-0 flex flex-col items-center gap-3 z-40 pointer-events-none px-5" style={{ opacity: 0 }}>
            <h3 className="text-base sm:text-xl md:text-2xl font-medium text-white/95 text-center max-w-2xl leading-relaxed drop-shadow-2xl">
              Paste your notes. Drop your screenshots.<br className="hidden sm:block" />
              <span className="text-white/60">We'll find the structure hiding inside your mess.</span>
            </h3>
          </div>

          <div className="upload-page-container absolute inset-0 flex items-center justify-center pointer-events-none z-30" style={{ opacity: 0 }}>
            <div className="upload-dropzone w-[88%] max-w-[800px] h-[260px] sm:h-[400px] mt-16 sm:mt-20 rounded-2xl sm:rounded-3xl border-2 border-dashed border-purple-500/20 bg-white/5 backdrop-blur-sm flex flex-col items-center justify-center gap-3 sm:gap-4 relative overflow-hidden transition-colors" style={{ opacity: 0, transform: 'scale(0.95)' }}>
              <UploadCloud className="upload-icon w-12 h-12 text-purple-500/50" />
              <p className="text-sm font-medium text-purple-200/50 font-sans tracking-wide uppercase">Drop your mess here</p>
            </div>

            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-35" aria-hidden="true">
              {/* Chart/App Screenshot */}
              <div className="upload-item upload-item-0 absolute w-[100px] sm:w-[140px] h-[130px] sm:h-[180px] bg-zinc-900/90 backdrop-blur-xl rounded-xl border border-zinc-700 shadow-[0_20px_40px_rgba(0,0,0,0.6)] flex flex-col overflow-hidden origin-center mt-12 sm:mt-20" style={{ opacity: 0 }}>
                <div className="h-6 bg-zinc-800/80 flex items-center px-2.5 gap-1.5 border-b border-white/5">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-400/80" />
                  <div className="w-1.5 h-1.5 rounded-full bg-yellow-400/80" />
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400/80" />
                </div>
                <div className="flex-1 p-3 flex flex-col gap-2.5">
                  <div className="w-full h-16 bg-gradient-to-t from-purple-500/20 to-purple-500/5 rounded-md border border-purple-500/20 flex items-end px-1">
                    <div className="w-full h-8 bg-purple-500/40 rounded-t-md" />
                  </div>
                  <div className="w-3/4 h-2.5 bg-zinc-700/80 rounded-full" />
                  <div className="w-1/2 h-2.5 bg-zinc-700/80 rounded-full" />
                </div>
              </div>

              {/* iMessage */}
              <div className="upload-item upload-item-1 absolute w-[110px] sm:w-[160px] h-[150px] sm:h-[210px] bg-zinc-950/90 backdrop-blur-xl rounded-xl sm:rounded-2xl border border-green-500/20 shadow-[0_20px_40px_rgba(0,0,0,0.6)] flex flex-col p-2 sm:p-3 gap-1.5 sm:gap-2 justify-end origin-center mt-12 sm:mt-20" style={{ opacity: 0 }}>
                <div className="self-start bg-zinc-800 w-3/4 h-7 rounded-2xl rounded-bl-sm" />
                <div className="self-end bg-green-600 w-2/3 h-7 rounded-2xl rounded-br-sm" />
                <div className="self-end bg-green-600 w-5/6 h-12 rounded-2xl rounded-br-sm" />
                <div className="self-start bg-zinc-800 w-2/3 h-7 rounded-2xl rounded-bl-sm" />
              </div>

              {/* Apple Note */}
              <div className="upload-item upload-item-2 absolute w-[110px] sm:w-[160px] h-[110px] sm:h-[160px] bg-[#fbf9f1]/95 backdrop-blur-xl rounded-lg sm:rounded-xl border border-yellow-300/50 shadow-[0_20px_40px_rgba(0,0,0,0.6)] p-3 sm:p-4 flex flex-col gap-1.5 sm:gap-2.5 origin-center mt-12 sm:mt-20" style={{ opacity: 0 }}>
                <div className="text-yellow-900 font-bold text-[12px] font-sans tracking-tight">Meeting Notes</div>
                <div className="w-full h-1.5 bg-yellow-800/15 rounded-full mt-1" />
                <div className="w-5/6 h-1.5 bg-yellow-800/15 rounded-full" />
                <div className="w-full h-1.5 bg-yellow-800/15 rounded-full" />
                <div className="w-4/6 h-1.5 bg-yellow-800/15 rounded-full" />
                <div className="w-full h-1.5 bg-yellow-800/15 rounded-full mt-1" />
              </div>

              {/* Image */}
              <div className="upload-item upload-item-3 absolute w-[100px] sm:w-[140px] h-[100px] sm:h-[140px] bg-zinc-800/90 backdrop-blur-xl rounded-lg sm:rounded-xl border border-blue-500/20 shadow-[0_20px_40px_rgba(0,0,0,0.6)] flex items-center justify-center relative overflow-hidden origin-center mt-12 sm:mt-20" style={{ opacity: 0 }}>
                <ImageIcon className="text-blue-300/80 w-10 h-10 z-10 drop-shadow-lg" />
                <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/20 to-purple-500/20" />
              </div>
            </div>
          </div>

          {/* ======================= */}
          {/* PAGE 4: SYNTHESIS */}
          {/* ======================= */}
          <div className="absolute inset-0 flex items-center justify-center z-40 pointer-events-none">
            <div
              className="consolidated-card relative w-[92%] max-w-[640px] bg-[#14121a]/95 backdrop-blur-2xl border border-purple-500/40 rounded-xl sm:rounded-2xl shadow-[0_0_80px_rgba(168,85,247,0.25)] overflow-hidden flex flex-col"
              style={{ opacity: 0, scale: 0.5, filter: 'blur(10px)', minHeight: isMobile ? '420px' : '380px' }}
            >
              {/* Simplified header */}
              <div className="h-11 bg-white/5 border-b border-white/10 flex items-center justify-between px-5">
                <div className="flex items-center gap-2.5">
                  <Sparkles className="text-purple-400 w-4 h-4" />
                  <span className="text-[11px] font-semibold text-purple-200/80 tracking-widest uppercase font-sans">PitchVoid</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
                  <span className="text-[10px] font-mono text-purple-300/60 uppercase tracking-wider">Processing</span>
                </div>
              </div>

              <div className="relative p-5 sm:p-8 flex-1 flex flex-col justify-center">
                <div className="mess-text-container absolute inset-0 p-4 sm:p-10 flex flex-col justify-center gap-3 sm:gap-5">
                  {COMBINED_MESS.map((paragraph, idx) => (
                    <p key={idx} className="font-mono text-[11px] sm:text-[13px] text-white/50 leading-relaxed">
                      {paragraph}
                    </p>
                  ))}
                </div>

                <div
                  className="process-scanline absolute left-0 right-0 h-[3px] bg-purple-400 shadow-[0_0_25px_3px_rgba(168,85,247,1)] z-20 pointer-events-none"
                  style={{ opacity: 0, top: '0%' }}
                />

                {/* 3 clean output sections */}
                <div className="clean-sections absolute inset-0 p-5 sm:p-10 flex flex-col justify-center gap-5 sm:gap-8 z-10">
                  {OUTPUT_SECTIONS.map((sec, i) => (
                    <div key={i} className={`clean-sec clean-sec-${i}`} style={{ opacity: 0, transform: 'translateY(15px)', filter: 'blur(4px)' }}>
                      <p className="text-[10px] sm:text-[11px] font-bold text-purple-400 tracking-[0.2em] uppercase mb-1.5 sm:mb-2 font-sans">
                        {sec.label}
                      </p>
                      <p className="text-[14px] sm:text-[16px] text-white/95 font-medium leading-relaxed font-sans">
                        {sec.text}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ======================= */}
          {/* PAGE 5: CTA */}
          {/* ======================= */}
          <div className="absolute bottom-6 sm:bottom-12 left-0 right-0 flex flex-col items-center gap-6 sm:gap-5 z-50 pointer-events-none">
            <p
              className="demo-tagline font-sans font-medium text-[13px] sm:text-[15px]"
              style={{ color: '#ffffff', opacity: 0 }}
            >
              Overstimulated → Articulate. In seconds.
            </p>
            <div className="cta-area pointer-events-auto" style={{ opacity: 0, scale: 0.9 }}>
              <button
                onClick={() => navigate('/dashboard')}
                className="px-8 py-3.5 rounded-full text-primary-foreground font-semibold magenta-gradient text-base sm:text-lg hover:opacity-90 hover:scale-105 transition-all cursor-pointer shadow-[0_0_30px_rgba(168,85,247,0.5)] border border-white/20"
              >
                Clear your head →
              </button>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
