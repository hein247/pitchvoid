import { useState, useEffect, useRef, useCallback } from 'react';
import { X } from 'lucide-react';
import type { ScriptData, ScriptLine } from './ScriptViewer';
import BreathingCanvas from './BreathingCanvas';
import Teleprompter from './Teleprompter';

interface FocusModeProps {
  scriptData: ScriptData;
  onExit: () => void;
}

type Phase = 'centering' | 'teleprompter' | 'cooldown';
type Speed = 0.75 | 1 | 1.25;

type CenterStep =
  | 'black'
  | 'headphones'
  | 'zone_intro'
  | 'choice'
  | 'breathing'
  | 'breathe_fadeout'
  | 'in_the_zone'
  | 'context'
  | 'opener'
  | 'ready'
  | 'done';

const APPLE_EASE = 'cubic-bezier(0.25, 0.1, 0.25, 1.0)';
const BREATH_PHASES = ['Inhale', 'Hold', 'Exhale'];
const BREATH_HINTS = ['4s inhale', '7s hold', '8s exhale'];
const CYCLES = 3;

/** Parse duration strings like "10 sec", "2 min", "10s" */
function parseDuration(dur: string): number | null {
  const m = dur.match(/(\d+)\s*(s|sec|second|min|minute)/i);
  if (!m) return null;
  const val = parseInt(m[1], 10);
  return m[2].startsWith('min') ? val * 60 : val;
}

/** Calculate hold time for a line in seconds */
function lineHoldTime(line: ScriptLine, speed: Speed): number {
  if (line.type === 'pause') return 3 / speed;
  if (line.type === 'transition') return 1.5 / speed;

  if ((line.type === 'opener' || line.type === 'closer') && line.duration) {
    const d = parseDuration(line.duration);
    if (d) return d / speed;
  }

  const words = (line.text || '').split(/\s+/).filter(Boolean).length;
  const base = Math.max(2, (words / 130) * 60);
  return base / speed;
}

/** Migrate old section-based data to flat lines */
function ensureLines(raw: ScriptData): ScriptLine[] {
  if (Array.isArray(raw.lines) && raw.lines.length > 0) return raw.lines;

  const lines: ScriptLine[] = [];
  if (raw.opener?.line) {
    lines.push({ type: 'opener', text: raw.opener.line, note: raw.opener.delivery_note, duration: '10 sec' });
  }
  if (Array.isArray(raw.sections)) {
    for (const section of raw.sections) {
      if (Array.isArray((section as any).points)) {
        for (const point of (section as any).points) {
          lines.push({ type: 'line', text: point, emphasis: null });
        }
      } else if ((section as any).content) {
        lines.push({ type: 'line', text: (section as any).content, emphasis: null });
      }
      if ((section as any).transition) {
        lines.push({ type: 'transition', text: (section as any).transition });
      }
    }
  }
  if (raw.closer?.line) {
    lines.push({ type: 'closer', text: raw.closer.line, note: raw.closer.delivery_note, duration: '10 sec' });
  }
  return lines;
}

const FocusMode = ({ scriptData, onExit }: FocusModeProps) => {
  const [phase, setPhase] = useState<Phase>('centering');
  const lines = useRef(ensureLines(scriptData)).current;

  // --- Centering state ---
  const [centerStep, setCenterStep] = useState<CenterStep>('black');
  const [breathPhase, setBreathPhase] = useState(0);
  const [breathHint, setBreathHint] = useState('4s inhale');
  const [completedCycles, setCompletedCycles] = useState<number[]>([]);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  // --- Audio refs ---
  const audioCtxRef = useRef<AudioContext | null>(null);
  const leftOscRef = useRef<OscillatorNode | null>(null);
  const rightOscRef = useRef<OscillatorNode | null>(null);
  const leftGainRef = useRef<GainNode | null>(null);
  const rightGainRef = useRef<GainNode | null>(null);

  // --- Teleprompter state ---
  const [currentLine, setCurrentLine] = useState(0);
  const [speed, setSpeed] = useState<Speed>(1);
  const [paused, setPaused] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const timerStartRef = useRef<number>(0);
  const timerAccumRef = useRef<number>(0);
  const rafRef = useRef<number>(0);
  const lineTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lineRefs = useRef<(HTMLDivElement | null)[]>([]);

  // --- Cool-down state ---
  const [coolStep, setCoolStep] = useState<'black' | 'ready' | 'time' | 'buttons'>('black');

  // --- Swipe ---
  const touchStartY = useRef<number | null>(null);

  // --- Audio helpers ---
  const startAudio = useCallback(() => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioCtxRef.current = ctx;

      const leftOsc = ctx.createOscillator();
      leftOsc.type = 'sine';
      leftOsc.frequency.value = 200;
      leftOscRef.current = leftOsc;

      const rightOsc = ctx.createOscillator();
      rightOsc.type = 'sine';
      rightOsc.frequency.value = 202;
      rightOscRef.current = rightOsc;

      const leftPan = ctx.createStereoPanner();
      leftPan.pan.value = -1;
      const rightPan = ctx.createStereoPanner();
      rightPan.pan.value = 1;

      const leftGain = ctx.createGain();
      leftGain.gain.value = 0;
      leftGainRef.current = leftGain;
      const rightGain = ctx.createGain();
      rightGain.gain.value = 0;
      rightGainRef.current = rightGain;

      leftOsc.connect(leftGain);
      leftGain.connect(leftPan);
      leftPan.connect(ctx.destination);

      rightOsc.connect(rightGain);
      rightGain.connect(rightPan);
      rightPan.connect(ctx.destination);

      leftOsc.start();
      rightOsc.start();

      const now = ctx.currentTime;
      leftGain.gain.linearRampToValueAtTime(0.15, now + 3);
      rightGain.gain.linearRampToValueAtTime(0.15, now + 3);
    } catch { /* audio unsupported */ }
  }, []);

  const fadeOutAudio = useCallback(() => {
    try {
      const ctx = audioCtxRef.current;
      const lg = leftGainRef.current;
      const rg = rightGainRef.current;
      if (ctx && lg && rg) {
        const t = ctx.currentTime;
        lg.gain.linearRampToValueAtTime(0, t + 3);
        rg.gain.linearRampToValueAtTime(0, t + 3);
        const id = setTimeout(() => {
          try {
            leftOscRef.current?.stop();
            rightOscRef.current?.stop();
            ctx.close();
          } catch {}
          audioCtxRef.current = null;
        }, 3500);
        timeoutsRef.current.push(id);
      }
    } catch {}
  }, []);

  const stopAudioImmediately = useCallback(() => {
    try {
      leftOscRef.current?.stop();
      rightOscRef.current?.stop();
      audioCtxRef.current?.close();
    } catch {}
    audioCtxRef.current = null;
  }, []);

  // --- Wake Lock ---
  useEffect(() => {
    let wl: WakeLockSentinel | null = null;
    const req = async () => {
      try {
        if ('wakeLock' in navigator) wl = await (navigator as any).wakeLock.request('screen');
      } catch { /* unsupported */ }
    };
    req();
    return () => {
      wl?.release();
      stopAudioImmediately();
    };
  }, [stopAudioImmediately]);

  // ===================== CENTERING SEQUENCE =====================

  const startBreathingSequence = useCallback(() => {
    startAudio();
    setCenterStep('breathing');
    setCompletedCycles([]);
  }, [startAudio]);

  const handleBreathingComplete = useCallback(() => {
    setCenterStep('breathe_fadeout');
    fadeOutAudio();

    const ids: ReturnType<typeof setTimeout>[] = [];
    const q = (fn: () => void, ms: number) => { ids.push(setTimeout(fn, ms)); };

    q(() => setCenterStep('in_the_zone'), 2000);

    const contextLine = scriptData.context_line || '';
    q(() => setCenterStep(contextLine ? 'context' : 'opener'), 4000);

    if (contextLine) {
      q(() => setCenterStep('opener'), 8000);
    }

    const openerOffset = contextLine ? 12000 : 8000;
    q(() => setCenterStep('ready'), openerOffset);
    q(() => setCenterStep('done'), openerOffset + 2000);
    q(() => setPhase('teleprompter'), openerOffset + 2500);

    timeoutsRef.current.push(...ids);
  }, [fadeOutAudio, scriptData.context_line]);

  const startFocusSequenceDirect = useCallback(() => {
    const ids: ReturnType<typeof setTimeout>[] = [];
    const q = (fn: () => void, ms: number) => { ids.push(setTimeout(fn, ms)); };

    const contextLine = scriptData.context_line || '';
    setCenterStep(contextLine ? 'context' : 'opener');

    if (contextLine) {
      q(() => setCenterStep('opener'), 4000);
    }

    const openerOffset = contextLine ? 8000 : 4000;
    q(() => setCenterStep('ready'), openerOffset);
    q(() => setCenterStep('done'), openerOffset + 2000);
    q(() => setPhase('teleprompter'), openerOffset + 2500);

    timeoutsRef.current.push(...ids);
  }, [scriptData.context_line]);

  const startCentering = useCallback(() => {
    const ids: ReturnType<typeof setTimeout>[] = [];
    const q = (fn: () => void, ms: number) => { ids.push(setTimeout(fn, ms)); };

    setCenterStep('black');

    q(() => setCenterStep('headphones'), 300);
    q(() => setCenterStep('zone_intro'), 2300);
    q(() => setCenterStep('choice'), 4300);

    timeoutsRef.current = ids;
  }, []);

  useEffect(() => {
    if (phase === 'centering') startCentering();
    return () => {
      timeoutsRef.current.forEach(clearTimeout);
    };
  }, [phase, startCentering]);

  const skipCentering = () => {
    timeoutsRef.current.forEach(clearTimeout);
    stopAudioImmediately();
    setPhase('teleprompter');
  };

  // ===================== TELEPROMPTER =====================

  useEffect(() => {
    if (phase !== 'teleprompter') return;
    if (paused) {
      timerAccumRef.current = elapsed;
      return;
    }
    timerStartRef.current = performance.now();
    const tick = () => {
      const now = performance.now();
      setElapsed(timerAccumRef.current + (now - timerStartRef.current) / 1000);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [phase, paused]); // eslint-disable-line react-hooks/exhaustive-deps

  const scheduleNext = useCallback(() => {
    if (lineTimerRef.current) clearTimeout(lineTimerRef.current);
    if (currentLine >= lines.length) {
      setPhase('cooldown');
      return;
    }
    const hold = lineHoldTime(lines[currentLine], speed) * 1000;
    lineTimerRef.current = setTimeout(() => {
      setCurrentLine(prev => {
        const next = prev + 1;
        if (next >= lines.length) {
          setPhase('cooldown');
          return prev;
        }
        return next;
      });
    }, hold);
  }, [currentLine, speed, lines]);

  useEffect(() => {
    if (phase !== 'teleprompter') return;
    if (paused) {
      if (lineTimerRef.current) clearTimeout(lineTimerRef.current);
      return;
    }
    scheduleNext();
    return () => { if (lineTimerRef.current) clearTimeout(lineTimerRef.current); };
  }, [phase, paused, currentLine, speed, scheduleNext]);

  useEffect(() => {
    if (phase !== 'teleprompter') return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === ' ') { e.preventDefault(); setPaused(p => !p); }
      if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') setCurrentLine(p => Math.max(0, p - 1));
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') setCurrentLine(p => Math.min(lines.length - 1, p + 1));
      if (e.key === 'Escape') onExit();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [phase, lines.length, onExit]);

  const onTouchStart = (e: React.TouchEvent) => { touchStartY.current = e.touches[0].clientY; };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartY.current === null) return;
    const dy = touchStartY.current - e.changedTouches[0].clientY;
    if (Math.abs(dy) > 50) {
      if (dy > 0) setCurrentLine(p => Math.min(lines.length - 1, p + 1));
      else setCurrentLine(p => Math.max(0, p - 1));
    }
    touchStartY.current = null;
  };

  const getTranslateY = () => {
    if (!lineRefs.current[currentLine]) return 0;
    const lineEl = lineRefs.current[currentLine]!;
    const lineTop = lineEl.offsetTop;
    const lineHeight = lineEl.offsetHeight;
    const viewportCenter = window.innerHeight / 2;
    return viewportCenter - lineTop - lineHeight / 2;
  };

  const formatTimer = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = Math.floor(s % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // ===================== COOL-DOWN =====================
  useEffect(() => {
    if (phase !== 'cooldown') return;
    timerAccumRef.current = elapsed;
    cancelAnimationFrame(rafRef.current);

    const ids: ReturnType<typeof setTimeout>[] = [];
    setCoolStep('black');
    ids.push(setTimeout(() => setCoolStep('ready'), 2000));
    ids.push(setTimeout(() => setCoolStep('time'), 5000));
    ids.push(setTimeout(() => setCoolStep('buttons'), 7000));
    return () => ids.forEach(clearTimeout);
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  const restartPractice = () => {
    setCurrentLine(0);
    setElapsed(0);
    timerAccumRef.current = 0;
    setPaused(false);
    setSpeed(1);
    setCenterStep('black');
    setCompletedCycles([]);
    setCoolStep('black');
    setPhase('centering');
  };

  // ===================== RENDER =====================

  // --- Centering Phase ---
  if (phase === 'centering') {
    const openerText = lines.find(l => l.type === 'opener')?.text || '';
    const contextLine = scriptData.context_line || '';
    const isBreathing = centerStep === 'breathing';
    const isFadeout = centerStep === 'breathe_fadeout';

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center font-sans select-none"
        style={{ background: '#080710' }}
      >
        {/* Gradient background */}
        <div
          className="absolute inset-0 pointer-events-none transition-opacity duration-1000"
          style={{
            background: isBreathing
              ? 'radial-gradient(ellipse 70% 50% at 50% 45%, rgba(148,80,240,0.18) 0%, transparent 70%), radial-gradient(ellipse 50% 60% at 35% 55%, rgba(120,50,220,0.12) 0%, transparent 60%), radial-gradient(ellipse 50% 50% at 65% 40%, rgba(180,100,255,0.09) 0%, transparent 55%)'
              : 'radial-gradient(ellipse 70% 50% at 50% 45%, rgba(128,60,220,0.12) 0%, transparent 70%), radial-gradient(ellipse 50% 60% at 35% 55%, rgba(100,40,200,0.08) 0%, transparent 60%), radial-gradient(ellipse 50% 50% at 65% 40%, rgba(160,80,240,0.06) 0%, transparent 55%)',
          }}
        />

        {/* Noise overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            opacity: 0.025,
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
            backgroundSize: '128px 128px',
            mixBlendMode: 'overlay',
          }}
        />

        {/* Vignette */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at center, transparent 50%, rgba(8,7,16,0.6) 100%)' }}
        />

        {/* Practice badge */}
        <div
          className="absolute top-7 left-7 z-10"
          style={{
            padding: '4px 10px',
            border: '1px solid rgba(168,85,247,0.18)',
            borderRadius: '4px',
            fontSize: '10px',
            color: 'rgba(168,85,247,0.4)',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            fontWeight: 300,
          }}
        >
          practice
        </div>

        {/* Headphone suggestion */}
        {centerStep === 'headphones' && (
          <div
            className="text-center z-10"
            style={{ animation: `focusFadeInOut 2s ${APPLE_EASE} forwards` }}
          >
            <p style={{ fontSize: '22px', marginBottom: '6px' }}>🎧</p>
            <p style={{ fontSize: '13px', color: '#ffffff' }}>
              For the full experience, use headphones
            </p>
          </div>
        )}

        {/* 'Let's get you in the zone' */}
        {centerStep === 'zone_intro' && (
          <p
            className="text-center font-sans z-10"
            style={{
              fontSize: '15px',
              color: '#ffffff',
              animation: `focusFadeInOut 2s ${APPLE_EASE} forwards`,
            }}
          >
            Let's get you in the zone
          </p>
        )}

        {/* Choice screen — idle canvas + buttons */}
        {centerStep === 'choice' && (
          <div
            className="flex flex-col items-center justify-center z-10"
            style={{ animation: `focusFadeIn 0.6s ${APPLE_EASE} forwards` }}
          >
            {/* Idle instruction */}
            <div className="text-center mb-12" style={{ minHeight: '44px' }}>
              <p style={{
                fontSize: '15px',
                color: 'rgba(255,255,255,0.7)',
                lineHeight: 1.7,
                maxWidth: '240px',
                fontWeight: 200,
                letterSpacing: '0.02em',
              }}>
                Take this moment.<br />Prepare yourself and your thoughts.
              </p>
            </div>

            {/* Idle canvas */}
            <div className="mb-12">
              <BreathingCanvas state="idle" size={280} />
            </div>

            <button
              onClick={() => {
                timeoutsRef.current.forEach(clearTimeout);
                startBreathingSequence();
              }}
              className="cursor-pointer transition-all duration-300"
              style={{
                padding: '12px 32px',
                background: 'rgba(168,85,247,0.06)',
                border: '1px solid rgba(168,85,247,0.2)',
                borderRadius: '28px',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: 300,
                letterSpacing: '0.06em',
              }}
            >
              Begin breathing
            </button>
            <button
              onClick={() => {
                timeoutsRef.current.forEach(clearTimeout);
                startFocusSequenceDirect();
              }}
              className="cursor-pointer bg-transparent border-none mt-8"
              style={{
                fontSize: '11px',
                color: 'rgba(255,255,255,0.3)',
                fontWeight: 200,
                letterSpacing: '0.1em',
              }}
            >
              skip
            </button>
          </div>
        )}

        {/* Breathing animation */}
        {(isBreathing || isFadeout) && (
          <div
            className="flex flex-col items-center z-10"
            style={{
              opacity: isFadeout ? 0 : 1,
              transition: `opacity 1.5s ${APPLE_EASE}`,
            }}
          >
            {/* Phase label */}
            {isBreathing && (
              <div className="text-center mb-12" style={{ minHeight: '44px' }}>
                <p style={{
                  fontSize: '11px',
                  color: 'rgba(168,85,247,0.45)',
                  letterSpacing: '0.3em',
                  textTransform: 'uppercase',
                  fontWeight: 300,
                  marginBottom: '8px',
                }}>
                  breath
                </p>
                <p style={{
                  fontSize: '36px',
                  color: '#ffffff',
                  fontFamily: "'Cormorant Garamond', serif",
                  fontWeight: 300,
                  fontStyle: 'italic',
                  letterSpacing: '0.04em',
                }}>
                  {BREATH_PHASES[breathPhase]}
                </p>
              </div>
            )}

            {/* Canvas */}
            <BreathingCanvas
              state={isBreathing ? 'breathing' : 'stopped'}
              cycles={CYCLES}
              size={280}
              onPhaseUpdate={(p) => {
                setBreathPhase(p);
                setBreathHint(BREATH_HINTS[p]);
              }}
              onCycleUpdate={(cycle) => {
                setCompletedCycles(prev => {
                  const next = [...prev];
                  if (!next.includes(cycle)) next.push(cycle);
                  return next;
                });
              }}
              onComplete={handleBreathingComplete}
            />

            {/* Cycle dots */}
            {isBreathing && (
              <>
                <div className="flex gap-3 mt-11 z-10">
                  {Array.from({ length: CYCLES }).map((_, i) => (
                    <div
                      key={i}
                      className="rounded-full transition-all duration-700"
                      style={{
                        width: '4px',
                        height: '4px',
                        background: completedCycles.includes(i)
                          ? 'rgba(190,140,255,0.6)'
                          : 'rgba(168,85,247,0.12)',
                        boxShadow: completedCycles.includes(i)
                          ? '0 0 8px rgba(168,85,247,0.3)'
                          : 'none',
                      }}
                    />
                  ))}
                </div>

                {/* Timing hint */}
                <p className="mt-4 z-10" style={{
                  fontSize: '10px',
                  color: 'rgba(255,255,255,0.35)',
                  letterSpacing: '0.15em',
                  fontWeight: 200,
                }}>
                  {breathHint}
                </p>

                {/* Skip during breathing */}
                <button
                  onClick={() => {
                    stopAudioImmediately();
                    handleBreathingComplete();
                  }}
                  className="mt-8 cursor-pointer bg-transparent border-none z-10"
                  style={{
                    fontSize: '11px',
                    color: 'rgba(255,255,255,0.3)',
                    fontWeight: 200,
                    letterSpacing: '0.1em',
                  }}
                >
                  skip
                </button>
              </>
            )}
          </div>
        )}

        {/* 'you're in the zone' */}
        {centerStep === 'in_the_zone' && (
          <p
            className="text-center font-sans z-10"
            style={{
              fontSize: '15px',
              color: '#ffffff',
              animation: `focusFadeInOut 2s ${APPLE_EASE} forwards`,
            }}
          >
            you're in the zone
          </p>
        )}

        {/* Context line */}
        {centerStep === 'context' && contextLine && (
          <p
            className="text-center px-8 max-w-lg z-10"
            style={{
              fontSize: '13px',
              color: 'rgba(255,255,255,0.7)',
              animation: `focusFadeInOut 4s ${APPLE_EASE} forwards`,
            }}
          >
            {contextLine}
          </p>
        )}

        {/* Opener */}
        {centerStep === 'opener' && openerText && (
          <p
            className="text-center px-8 max-w-lg font-medium z-10"
            style={{
              fontSize: '20px',
              color: '#ffffff',
              animation: `focusFadeInOut 4s ${APPLE_EASE} forwards`,
            }}
          >
            {openerText}
          </p>
        )}

        {/* Ready */}
        {centerStep === 'ready' && (
          <p
            className="text-center lowercase z-10"
            style={{
              fontSize: '14px',
              color: 'rgba(168,85,247,0.8)',
              animation: `focusFadeInOut 2s ${APPLE_EASE} forwards`,
            }}
          >
            ready
          </p>
        )}

        {/* Skip button (always visible) */}
        <button
          onClick={skipCentering}
          className="fixed bottom-8 right-8 z-50"
          style={{ fontSize: '10px', color: 'rgba(255,255,255,0.25)' }}
        >
          Skip →
        </button>

        <style>{`
          @keyframes focusFadeInOut {
            0% { opacity: 0; }
            12% { opacity: 1; }
            75% { opacity: 1; }
            100% { opacity: 0; }
          }
          @keyframes focusFadeIn {
            from { opacity: 0; transform: translateY(12px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}</style>
      </div>
    );
  }

  // --- Teleprompter Phase ---
  if (phase === 'teleprompter') {
    // Convert flat lines into sections for the Teleprompter component
    const teleprompterSections = (() => {
      const sections: { title: string; points: string[]; coaching?: string }[] = [];
      let currentSection: { title: string; points: string[]; coaching?: string } | null = null;

      // Try using scriptData.sections first (original format)
      if (Array.isArray(scriptData.sections) && scriptData.sections.length > 0) {
        for (const sec of scriptData.sections) {
          sections.push({
            title: (sec as any).name || '',
            points: Array.isArray((sec as any).points) ? (sec as any).points : [(sec as any).content || ''],
            coaching: (sec as any).transition,
          });
        }
      } else {
        // Fallback: convert flat lines to sections
        for (const line of lines) {
          if (line.type === 'opener') {
            currentSection = { title: 'Opening', points: [] };
            if (line.text) currentSection.points.push(line.text);
            if (line.note) currentSection.coaching = line.note;
            sections.push(currentSection);
            currentSection = null;
          } else if (line.type === 'closer') {
            currentSection = { title: 'Closing', points: [] };
            if (line.text) currentSection.points.push(line.text);
            if (line.note) currentSection.coaching = line.note;
            sections.push(currentSection);
            currentSection = null;
          } else if (line.type === 'transition') {
            if (currentSection && line.text) {
              currentSection.coaching = line.text;
            }
            if (currentSection) {
              sections.push(currentSection);
              currentSection = null;
            }
          } else if (line.type === 'line') {
            if (!currentSection) {
              currentSection = { title: `Section ${sections.length + 1}`, points: [] };
            }
            if (line.text) currentSection.points.push(line.text);
          }
        }
        if (currentSection && currentSection.points.length > 0) {
          sections.push(currentSection);
        }
      }

      return sections.length > 0 ? sections : [{ title: 'Script', points: lines.filter(l => l.text).map(l => l.text!) }];
    })();

    return (
      <Teleprompter
        sections={teleprompterSections}
        onExit={onExit}
        onComplete={() => setPhase('cooldown')}
      />
    );
  }

  // --- Cool-Down Phase ---
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center font-sans select-none"
      style={{ background: '#080710' }}
    >
      {/* Gradient bg for completion */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 60% 50% at 50% 45%, rgba(148,80,240,0.14) 0%, transparent 70%), radial-gradient(ellipse 40% 40% at 45% 50%, rgba(120,50,220,0.08) 0%, transparent 55%)',
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at center, transparent 50%, rgba(8,7,16,0.6) 100%)' }}
      />

      {(coolStep === 'ready' || coolStep === 'time' || coolStep === 'buttons') && (
        <>
          <p
            className="text-center mb-4 z-10"
            style={{
              fontSize: '11px',
              color: 'rgba(168,85,247,0.4)',
              letterSpacing: '0.3em',
              textTransform: 'uppercase',
              fontWeight: 300,
              animation: `focusFadeUp 1s ease both`,
            }}
          >
            ready
          </p>
          <p
            className="text-center mb-10 z-10"
            style={{
              fontSize: '38px',
              color: '#ffffff',
              fontFamily: "'Cormorant Garamond', serif",
              fontWeight: 300,
              fontStyle: 'italic',
              animation: `focusFadeUp 1s ease 0.2s both`,
            }}
          >
            You're ready.
          </p>
        </>
      )}

      {(coolStep === 'time' || coolStep === 'buttons') && (
        <p
          className="text-center mb-8 z-10"
          style={{
            fontSize: '13px',
            color: 'rgba(255,255,255,0.7)',
            animation: `focusFadeUp 1s ease 0.4s both`,
          }}
        >
          {formatTimer(elapsed)}
        </p>
      )}

      {coolStep === 'buttons' && (
        <div
          className="flex gap-4 z-10"
          style={{ animation: `focusFadeUp 1s ease 0.4s both` }}
        >
          <button
            onClick={restartPractice}
            className="transition-all duration-300 cursor-pointer"
            style={{
              padding: '12px 28px',
              background: 'rgba(168,85,247,0.08)',
              border: '1px solid rgba(168,85,247,0.22)',
              borderRadius: '24px',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: 300,
              letterSpacing: '0.05em',
            }}
          >
            Practice again
          </button>
          <button
            onClick={onExit}
            className="transition-all duration-300 cursor-pointer"
            style={{
              padding: '12px 28px',
              background: 'rgba(168,85,247,0.08)',
              border: '1px solid rgba(168,85,247,0.22)',
              borderRadius: '24px',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: 300,
              letterSpacing: '0.05em',
            }}
          >
            Done
          </button>
        </div>
      )}

      <style>{`
        @keyframes focusFadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes focusFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default FocusMode;
