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

const MESS_CARDS = [
  { app: APPS.slack, text: "@here revenue down 15% this quarter, churn is spiking. Need all hands on deck to brainstorm retention strategies before Friday." },
  { app: APPS.messages, text: "did you see what they just shipped? 😭 It's exactly our Q4 roadmap but they actually executed it and it looks gorgeous." },
  { app: APPS.notes, text: "startup pivot ideas... b2b ai wrapper? no wait. maybe we focus entirely on the enterprise workflow segment instead of smb." },
  { app: APPS.chatgpt, text: "how to not sound desperate asking for 180k. 'We see an opportunity to accelerate growth...' no that sounds like corporate BS." },
  { app: APPS.notion, text: "Brainstorming document 3 (Final_v2) - If we pivot to a B2B SaaS model, we can probably charge 10x more for the same API." },
];

const getScatteredPositions = (w: number) => {
  const cW = Math.min(w - 32, 1100);
  const cH = w < 640 ? 540 : Math.min(w * 0.7, 720);
  const s = w < 640 ? 0.55 : (w < 1024 ? 0.8 : 1);
  const cardW = (w < 640 ? 200 : 300) * s;
  const maxX = Math.max(0, (cW / 2) - (cardW / 2) - 10);
  const maxY = Math.max(0, (cH / 2) - 70);
  const n = [
    { x: -0.55, y: -0.45, r: -8 }, { x: 0.55, y: -0.35, r: 12 },
    { x: 0, y: 0.05, r: -4 }, { x: -0.45, y: 0.5, r: 10 }, { x: 0.5, y: 0.45, r: -6 },
  ];
  return n.map(p => ({ x: p.x * maxX, y: p.y * maxY, r: p.r }));
};

const getUploadPositions = (w: number) => {
  const s = w < 640 ? 0.45 : (w < 1024 ? 0.7 : 1);
  return [
    { x: -140 * s, y: -30 * s, r: -8 }, { x: 120 * s, y: 25 * s, r: 12 },
    { x: -70 * s, y: 70 * s, r: 5 }, { x: 90 * s, y: -70 * s, r: -10 },
  ];
};

const COMBINED_MESS = [
  "startup pivot ideas... b2b ai wrapper? no wait. ceo wants update tomorrow on the roadmap, but revenue is down 15% this quarter and churn is spiking. we have no actual app yet, just a figma prototype that barely works on mobile.",
  "competitors are crushing it. we need to figure out how to ask for 180k in bridge funding without sounding desperate... emergency sync to figure out our narrative before the board meeting."
];

const OUTPUT_SECTIONS = [
  { label: 'THE SITUATION', text: 'Revenue down 15% with spiking churn. Competitors shipped the Q4 roadmap first. No production app, only a prototype.' },
  { label: 'THE EVIDENCE', text: 'Enterprise B2B pivot unlocks 10x pricing on existing architecture. Current SMB model is unsustainable at this burn rate.' },
  { label: 'THE ASK', text: 'Secure $180K bridge round framed as strategic repositioning into enterprise, not a lifeline.' },
];

/* ── Responsive helper ── */
function rv(mobile: number | string, tablet: number | string, desktop: number | string, w: number) {
  if (w < 640) return mobile;
  if (w < 1024) return tablet;
  return desktop;
}

export default function HowItWorks() {
  const [scope, animate] = useAnimate();
  const [width, setWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);
  const prefersReducedMotion = useReducedMotion();
  const navigate = useNavigate();

  const isMobile = width < 640;
  const isTablet = width >= 640 && width < 1024;

  useEffect(() => {
    const onResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
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

          // PAGE 1
          await animate('.core-text-1', { opacity: 1, filter: 'blur(0px)' }, { duration: 0.8, ease: "easeOut" });
          await safeDelay(1200);
          animate('.core-text-1', { opacity: 0, scale: 0.9, filter: 'blur(6px)' }, { duration: 0.4 });

          const w = window.innerWidth;
          const pos = getScatteredPositions(w);
          const cScale = w < 640 ? 0.55 : (w < 1024 ? 0.8 : 1);

          await animate(MESS_CARDS.map((_, i) => [
            `.mess-card-${i}`,
            { opacity: 1, scale: cScale, x: pos[i].x, y: pos[i].y, rotate: pos[i].r },
            { type: 'spring', bounce: 0.5, duration: 0.6, at: i * 0.015 }
          ]));
          await safeDelay(2200);
          await animate(MESS_CARDS.map((_, i) => [
            `.mess-card-${i}`,
            { opacity: 0, scale: 0.5, filter: 'blur(10px)' },
            { duration: 0.4, at: i * 0.015 }
          ]));
          await safeDelay(400);
          if (!isActive) break;

          // PAGE 2
          await animate('.core-text-2', { opacity: 1, filter: 'blur(0px)' }, { duration: 0.8, ease: "easeOut" });
          await safeDelay(3600);
          await animate('.core-text-2', { opacity: 0, scale: 0.95, filter: 'blur(6px)' }, { duration: 0.6 });
          if (!isActive) break;

          // PAGE 3
          animate('.upload-page-container', { opacity: 1 }, { duration: 0 });
          await animate([
            ['.core-text-3', { opacity: 1, y: 0, filter: 'blur(0px)' }, { duration: 0.8, ease: "easeOut", at: 0 }],
            ['.upload-dropzone', { opacity: 1, scale: 1 }, { duration: 0.8, type: "spring", bounce: 0.4, at: 0.2 }]
          ]);

          const uPos = getUploadPositions(w);
          const uScale = w < 640 ? 0.55 : (w < 1024 ? 0.75 : 0.9);

          await animate([0, 1, 2, 3].map(i => [
            `.upload-item-${i}`,
            { opacity: 1, scale: uScale, x: uPos[i].x, y: uPos[i].y, rotate: uPos[i].r, filter: 'blur(0px)' },
            { type: 'spring', bounce: 0.4, duration: 0.8, at: i * 0.15 }
          ]));

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

          // PAGE 4
          const suckAnims: any[] = [0, 1, 2, 3].map(i => [
            `.upload-item-${i}`,
            { opacity: 0, scale: 0.1, x: 0, y: 0, rotate: uPos[i].r - 180, filter: 'blur(8px)' },
            { duration: 0.6, ease: "anticipate", at: i * 0.05 }
          ]);
          suckAnims.push(['.consolidated-card', { opacity: 1, scale: 1, filter: 'blur(0px)' }, { duration: 0.6, type: 'spring', bounce: 0.4, at: 0.3 }]);
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
      } catch (e: any) {
        if (isActive && e.message !== "cancelled") console.error("Animation error:", e);
      }
    };

    runAnimation();
    return () => { isActive = false; };
  }, [animate, prefersReducedMotion]);

  const minH = isMobile ? 560 : (isTablet ? 660 : 760);

  return (
    <section className="w-full bg-zinc-950"
      style={{ padding: isMobile ? '48px 12px' : (isTablet ? '64px 24px' : '96px 32px') }}>
      <div
        ref={scope}
        className="w-full max-w-[1100px] mx-auto relative overflow-hidden shadow-2xl"
        style={{
          background: 'rgba(9,8,15,0.92)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(168,85,247,0.15)',
          borderRadius: isMobile ? 16 : 24,
          minHeight: minH,
        }}
      >
        <div className="relative w-full h-full flex items-center justify-center" style={{ minHeight: minH }}>

          {/* PAGE 1: HEADLINE */}
          <div className="core-text-1 absolute inset-0 flex items-center justify-center pointer-events-none z-40"
            style={{ padding: isMobile ? '0 20px' : '0 32px', opacity: 0 }}>
            <h3 className="font-medium text-white/90 text-center font-sans drop-shadow-2xl"
              style={{
                fontSize: rv(20, 28, 38, width) as number,
                lineHeight: 1.2,
                maxWidth: rv(260, 400, 500, width) as number,
              }}>
              Your brain is a group chat you can't mute.
            </h3>
          </div>

          {/* PAGE 1: CHAOS CARDS */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30" aria-hidden="true">
            {MESS_CARDS.map((card, i) => (
              <div
                key={i}
                className={`mess-card mess-card-${i} absolute bg-[#1c1c1e]/85 backdrop-blur-2xl border border-white/10 shadow-2xl flex flex-col origin-center`}
                style={{
                  opacity: 0,
                  zIndex: MESS_CARDS.length - i,
                  width: rv(180, 250, 310, width) as number,
                  padding: rv(10, 14, 18, width) as number,
                  gap: rv(6, 8, 10, width) as number,
                  borderRadius: rv(10, 14, 16, width) as number,
                }}
              >
                <div className="flex items-center" style={{ gap: rv(4, 6, 8, width) as number }}>
                  <div className={`flex items-center justify-center border shadow-inner ${card.app.bg} ${card.app.border}`}
                    style={{
                      width: rv(16, 20, 24, width) as number,
                      height: rv(16, 20, 24, width) as number,
                      borderRadius: rv(4, 5, 6, width) as number,
                    }}>
                    <card.app.icon size={rv(8, 10, 12, width) as number} className={card.app.color} strokeWidth={2.5} />
                  </div>
                  <span className="font-semibold tracking-wide text-white/60 uppercase"
                    style={{ fontSize: rv(8, 10, 12, width) as number }}>
                    {card.app.name}
                  </span>
                </div>
                <p className="text-white/95 leading-relaxed font-medium"
                  style={{
                    fontSize: rv(10, 12, 14, width) as number,
                    display: '-webkit-box',
                    WebkitLineClamp: isMobile ? 3 : 4,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}>
                  {card.text}
                </p>
              </div>
            ))}
          </div>

          {/* PAGE 2: PROBLEM */}
          <div className="core-text-2 absolute inset-0 flex items-center justify-center pointer-events-none z-40"
            style={{ padding: isMobile ? '0 20px' : '0 40px', opacity: 0 }}>
            <div className="text-center font-sans drop-shadow-2xl"
              style={{ maxWidth: rv(280, 480, 640, width) as number }}>
              <span className="font-medium text-white/95"
                style={{ fontSize: rv(15, 19, 24, width) as number, lineHeight: 1.5 }}>
                You had the idea. The pitch. The thing you needed to say.
              </span>
              <br />
              <span className="font-medium"
                style={{
                  fontSize: rv(13, 16, 20, width) as number,
                  lineHeight: 1.5,
                  color: 'rgba(255,255,255,0.5)',
                }}>
                But by the time you sat down to organize it, ten other things had already gotten in the way.
              </span>
            </div>
          </div>

          {/* PAGE 3: UPLOAD TEXT */}
          <div className="core-text-3 absolute left-0 right-0 flex flex-col items-center z-40 pointer-events-none"
            style={{
              opacity: 0,
              top: rv(20, 36, 52, width) as number,
              padding: isMobile ? '0 16px' : '0 32px',
            }}>
            <div className="text-center drop-shadow-2xl"
              style={{ maxWidth: rv(270, 460, 620, width) as number }}>
              <span className="font-medium text-white/95"
                style={{ fontSize: rv(14, 18, 24, width) as number, lineHeight: 1.5 }}>
                Paste your notes. Drop your screenshots.
              </span>
              <br />
              <span className="font-medium"
                style={{
                  fontSize: rv(12, 15, 19, width) as number,
                  lineHeight: 1.5,
                  color: 'rgba(255,255,255,0.5)',
                }}>
                We'll find the structure hiding inside your mess.
              </span>
            </div>
          </div>

          {/* PAGE 3: UPLOAD UI */}
          <div className="upload-page-container absolute inset-0 flex items-center justify-center pointer-events-none z-30" style={{ opacity: 0 }}>
            <div className="upload-dropzone border-2 border-dashed border-purple-500/20 bg-white/5 backdrop-blur-sm flex flex-col items-center justify-center relative overflow-hidden transition-colors"
              style={{
                opacity: 0,
                transform: 'scale(0.95)',
                width: isMobile ? '90%' : '88%',
                maxWidth: 780,
                height: rv(200, 280, 380, width) as number,
                marginTop: rv(52, 64, 76, width) as number,
                borderRadius: rv(14, 20, 24, width) as number,
                gap: rv(10, 14, 16, width) as number,
              }}>
              <UploadCloud className="upload-icon text-purple-500/50"
                style={{ width: rv(28, 36, 48, width) as number, height: rv(28, 36, 48, width) as number }} />
              <p className="font-medium text-purple-200/50 font-sans tracking-wide uppercase"
                style={{ fontSize: rv(10, 12, 14, width) as number }}>
                Drop your mess here
              </p>
            </div>

            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-35" aria-hidden="true">
              {/* Chart */}
              <div className="upload-item upload-item-0 absolute bg-zinc-900/90 backdrop-blur-xl border border-zinc-700 shadow-[0_20px_40px_rgba(0,0,0,0.6)] flex flex-col overflow-hidden origin-center"
                style={{
                  opacity: 0,
                  width: rv(90, 110, 140, width) as number,
                  height: rv(115, 145, 180, width) as number,
                  marginTop: rv(44, 58, 72, width) as number,
                  borderRadius: rv(8, 10, 12, width) as number,
                }}>
                <div className="bg-zinc-800/80 flex items-center border-b border-white/5"
                  style={{ height: rv(14, 18, 24, width) as number, padding: rv('0 5px', '0 7px', '0 10px', width) as string, gap: rv(3, 4, 6, width) as number }}>
                  {['bg-red-400/80', 'bg-yellow-400/80', 'bg-green-400/80'].map((c, j) => (
                    <div key={j} className={`rounded-full ${c}`} style={{ width: rv(3, 4, 6, width) as number, height: rv(3, 4, 6, width) as number }} />
                  ))}
                </div>
                <div className="flex-1 flex flex-col" style={{ padding: rv(6, 8, 12, width) as number, gap: rv(4, 6, 10, width) as number }}>
                  <div className="w-full bg-gradient-to-t from-purple-500/20 to-purple-500/5 border border-purple-500/20 flex items-end px-1"
                    style={{ height: rv(32, 44, 64, width) as number, borderRadius: rv(4, 5, 6, width) as number }}>
                    <div className="w-full bg-purple-500/40" style={{ height: rv(16, 22, 32, width) as number, borderRadius: `${rv(3, 4, 4, width)}px ${rv(3, 4, 4, width)}px 0 0` }} />
                  </div>
                  <div className="w-3/4 bg-zinc-700/80 rounded-full" style={{ height: rv(4, 6, 10, width) as number }} />
                  <div className="w-1/2 bg-zinc-700/80 rounded-full" style={{ height: rv(4, 6, 10, width) as number }} />
                </div>
              </div>

              {/* iMessage */}
              <div className="upload-item upload-item-1 absolute bg-zinc-950/90 backdrop-blur-xl border border-green-500/20 shadow-[0_20px_40px_rgba(0,0,0,0.6)] flex flex-col justify-end origin-center"
                style={{
                  opacity: 0,
                  width: rv(100, 130, 160, width) as number,
                  height: rv(130, 170, 210, width) as number,
                  padding: rv(7, 10, 12, width) as number,
                  gap: rv(4, 6, 8, width) as number,
                  marginTop: rv(44, 58, 72, width) as number,
                  borderRadius: rv(10, 14, 16, width) as number,
                }}>
                <div className="self-start bg-zinc-800 w-3/4" style={{ height: rv(16, 22, 28, width) as number, borderRadius: '12px 12px 12px 3px' }} />
                <div className="self-end bg-green-600 w-2/3" style={{ height: rv(16, 22, 28, width) as number, borderRadius: '12px 12px 3px 12px' }} />
                <div className="self-end bg-green-600 w-5/6" style={{ height: rv(26, 36, 48, width) as number, borderRadius: '12px 12px 3px 12px' }} />
                <div className="self-start bg-zinc-800 w-2/3" style={{ height: rv(16, 22, 28, width) as number, borderRadius: '12px 12px 12px 3px' }} />
              </div>

              {/* Apple Note */}
              <div className="upload-item upload-item-2 absolute bg-[#fbf9f1]/95 backdrop-blur-xl border border-yellow-300/50 shadow-[0_20px_40px_rgba(0,0,0,0.6)] flex flex-col origin-center"
                style={{
                  opacity: 0,
                  width: rv(100, 130, 160, width) as number,
                  height: rv(100, 130, 160, width) as number,
                  padding: rv(8, 12, 16, width) as number,
                  gap: rv(4, 6, 10, width) as number,
                  marginTop: rv(44, 58, 72, width) as number,
                  borderRadius: rv(8, 10, 12, width) as number,
                }}>
                <div className="text-yellow-900 font-bold font-sans tracking-tight" style={{ fontSize: rv(9, 10, 12, width) as number }}>Meeting Notes</div>
                {[1, 0.83, 1, 0.67, 1].map((w2, j) => (
                  <div key={j} className="bg-yellow-800/15 rounded-full" style={{ width: `${w2 * 100}%`, height: rv(3, 4, 6, width) as number }} />
                ))}
              </div>

              {/* Image */}
              <div className="upload-item upload-item-3 absolute bg-zinc-800/90 backdrop-blur-xl border border-blue-500/20 shadow-[0_20px_40px_rgba(0,0,0,0.6)] flex items-center justify-center relative overflow-hidden origin-center"
                style={{
                  opacity: 0,
                  width: rv(90, 110, 140, width) as number,
                  height: rv(90, 110, 140, width) as number,
                  marginTop: rv(44, 58, 72, width) as number,
                  borderRadius: rv(8, 10, 12, width) as number,
                }}>
                <ImageIcon className="text-blue-300/80 z-10 drop-shadow-lg" style={{ width: rv(22, 30, 40, width) as number, height: rv(22, 30, 40, width) as number }} />
                <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/20 to-purple-500/20" />
              </div>
            </div>
          </div>

          {/* PAGE 4: SYNTHESIS */}
          <div className="absolute inset-0 flex items-center justify-center z-40 pointer-events-none"
            style={{ padding: isMobile ? '0 8px' : '0 16px' }}>
            <div
              className="consolidated-card relative bg-[#14121a]/95 backdrop-blur-2xl border border-purple-500/40 shadow-[0_0_80px_rgba(168,85,247,0.25)] overflow-hidden flex flex-col"
              style={{
                opacity: 0,
                scale: 0.5,
                filter: 'blur(10px)',
                width: isMobile ? '96%' : '92%',
                maxWidth: 640,
                minHeight: rv(260, 300, 340, width) as number,
                borderRadius: rv(12, 16, 16, width) as number,
              }}
            >
              <div className="bg-white/5 border-b border-white/10 flex items-center justify-between"
                style={{ height: rv(32, 38, 44, width) as number, padding: rv('0 10px', '0 14px', '0 20px', width) as string }}>
                <div className="flex items-center" style={{ gap: rv(5, 7, 10, width) as number }}>
                  <Sparkles className="text-purple-400" style={{ width: rv(11, 13, 16, width) as number, height: rv(11, 13, 16, width) as number }} />
                  <span className="font-semibold text-purple-200/80 tracking-widest uppercase font-sans"
                    style={{ fontSize: rv(8, 9, 11, width) as number }}>PitchVoid</span>
                </div>
                <div className="flex items-center" style={{ gap: rv(4, 5, 6, width) as number }}>
                  <div className="rounded-full bg-purple-400 animate-pulse" style={{ width: rv(4, 5, 6, width) as number, height: rv(4, 5, 6, width) as number }} />
                  <span className="font-mono text-purple-300/60 uppercase tracking-wider"
                    style={{ fontSize: rv(7, 8, 10, width) as number }}>Processing</span>
                </div>
              </div>

              <div className="relative flex-1 flex flex-col justify-center"
                style={{ padding: rv(14, 20, 32, width) as number }}>
                <div className="mess-text-container absolute inset-0 flex flex-col justify-center"
                  style={{ padding: rv('14px', '20px 28px', '28px 36px', width) as string, gap: rv(10, 14, 20, width) as number }}>
                  {COMBINED_MESS.map((p, idx) => (
                    <p key={idx} className="font-mono text-white/50 leading-relaxed"
                      style={{ fontSize: rv(9, 11, 13, width) as number }}>{p}</p>
                  ))}
                </div>

                <div className="process-scanline absolute left-0 right-0 h-[3px] bg-purple-400 shadow-[0_0_25px_3px_rgba(168,85,247,1)] z-20 pointer-events-none"
                  style={{ opacity: 0, top: '0%' }} />

                <div className="clean-sections absolute inset-0 flex flex-col justify-center z-10"
                  style={{ padding: rv('14px', '20px 28px', '28px 36px', width) as string, gap: rv(16, 22, 32, width) as number }}>
                  {OUTPUT_SECTIONS.map((sec, i) => (
                    <div key={i} className={`clean-sec clean-sec-${i}`} style={{ opacity: 0, transform: 'translateY(15px)', filter: 'blur(4px)' }}>
                      <p className="font-bold text-purple-400 tracking-[0.2em] uppercase font-sans"
                        style={{ fontSize: rv(8, 9, 11, width) as number, marginBottom: rv(3, 5, 8, width) as number }}>
                        {sec.label}
                      </p>
                      <p className="text-white/95 font-medium leading-relaxed font-sans"
                        style={{ fontSize: rv(11, 13, 16, width) as number }}>
                        {sec.text}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* PAGE 5: CTA */}
          <div className="absolute left-0 right-0 flex flex-col items-center z-50 pointer-events-none"
            style={{
              bottom: rv(16, 28, 44, width) as number,
              gap: rv(12, 16, 20, width) as number,
              padding: '0 16px',
            }}>
            <p className="demo-tagline font-sans font-medium text-white"
              style={{ opacity: 0, y: 10, fontSize: rv(11, 13, 15, width) as number }}>
              Overstimulated → Articulate. In seconds.
            </p>
            <div className="cta-area pointer-events-auto" style={{ opacity: 0, scale: 0.9 }}>
              <button
                onClick={() => navigate('/dashboard')}
                className="rounded-full text-white font-semibold bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90 hover:scale-105 transition-all cursor-pointer shadow-[0_0_30px_rgba(168,85,247,0.5)] border border-white/20"
                style={{
                  padding: rv('9px 22px', '11px 28px', '14px 32px', width) as string,
                  fontSize: rv(13, 15, 18, width) as number,
                }}
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
