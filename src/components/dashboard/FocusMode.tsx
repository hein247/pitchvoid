import { useState, useEffect, useRef, useCallback } from 'react';
import { X } from 'lucide-react';
import type { ScriptData, ScriptLine } from './ScriptViewer';

interface FocusModeProps {
  scriptData: ScriptData;
  onExit: () => void;
}

type Phase = 'centering' | 'teleprompter' | 'cooldown';
type Speed = 0.75 | 1 | 1.25;

type CenterStep =
  | 'black'
  | 'headphones'
  | 'void'
  | 'breathe1_inhale'
  | 'breathe1_hold'
  | 'breathe1_exhale'
  | 'breathe2_inhale'
  | 'breathe2_hold'
  | 'breathe2_exhale'
  | 'breathe_fadeout'
  | 'context'
  | 'opener'
  | 'ready'
  | 'done';

const APPLE_EASE = 'cubic-bezier(0.25, 0.1, 0.25, 1.0)';

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
    } catch { /* audio unsupported — visual still works */ }
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
  const startCentering = useCallback(() => {
    const ids: ReturnType<typeof setTimeout>[] = [];
    const q = (fn: () => void, ms: number) => { ids.push(setTimeout(fn, ms)); };

    // Timing chain per spec
    setCenterStep('black');

    // 0.3s — headphone suggestion
    q(() => setCenterStep('headphones'), 300);

    // 2.3s — hide headphones, show 'void', start audio
    q(() => {
      setCenterStep('void');
      startAudio();
    }, 2300);

    // 3.8s — hide 'void'
    q(() => setCenterStep('black'), 3800);

    // 4.0s — Cycle 1 Inhale (4s)
    q(() => setCenterStep('breathe1_inhale'), 4000);

    // 8.0s — Cycle 1 Hold (7s)
    q(() => setCenterStep('breathe1_hold'), 8000);

    // 15.0s — Cycle 1 Exhale (8s)
    q(() => setCenterStep('breathe1_exhale'), 15000);

    // 23.0s — Cycle 2 Inhale (4s)
    q(() => setCenterStep('breathe2_inhale'), 23000);

    // 27.0s — Cycle 2 Hold (7s)
    q(() => setCenterStep('breathe2_hold'), 27000);

    // 34.0s — Cycle 2 Exhale (8s)
    q(() => setCenterStep('breathe2_exhale'), 34000);

    // 42.0s — Circle fades out, audio fades out
    q(() => {
      setCenterStep('breathe_fadeout');
      fadeOutAudio();
    }, 42000);

    // 45.0s — Existing focus sequence: context line
    const contextLine = scriptData.context_line || '';
    q(() => setCenterStep(contextLine ? 'context' : 'opener'), 45000);

    // context holds ~4s then opener
    if (contextLine) {
      q(() => setCenterStep('opener'), 49000);
    }

    // opener holds ~4s then ready
    const openerOffset = contextLine ? 53000 : 49000;
    q(() => setCenterStep('ready'), openerOffset);

    // ready holds 2s then done
    q(() => setCenterStep('done'), openerOffset + 2000);
    q(() => setPhase('teleprompter'), openerOffset + 2500);

    timeoutsRef.current = ids;
  }, [startAudio, fadeOutAudio, scriptData.context_line]);

  useEffect(() => {
    if (phase === 'centering') startCentering();
    return () => { timeoutsRef.current.forEach(clearTimeout); };
  }, [phase, startCentering]);

  const skipCentering = () => {
    timeoutsRef.current.forEach(clearTimeout);
    stopAudioImmediately();
    setPhase('teleprompter');
  };

  // ===================== TELEPROMPTER =====================

  // RAF timer
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

  // Auto-advance
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

  // Keyboard
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

  // Swipe gestures (vertical)
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

  // Calculate translateY to center current line
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
    setCoolStep('black');
    setPhase('centering');
  };

  // ===================== RENDER =====================

  // --- Helper: is this a breathing step? ---
  const isBreathingStep = (s: CenterStep) =>
    s.startsWith('breathe1_') || s.startsWith('breathe2_') || s === 'breathe_fadeout';

  // --- Centering Phase ---
  if (phase === 'centering') {
    const openerText = lines.find(l => l.type === 'opener')?.text || '';
    const contextLine = scriptData.context_line || '';

    // Breathing circle params
    const isCycle1 = centerStep.startsWith('breathe1_');
    const isCycle2 = centerStep.startsWith('breathe2_');
    const isInhale = centerStep.endsWith('_inhale');
    const isHold = centerStep.endsWith('_hold');
    const isExhale = centerStep.endsWith('_exhale');
    const isFadeout = centerStep === 'breathe_fadeout';

    const strokeBase = isCycle2 ? 0.16 : 0.12;
    const strokePulseHigh = isCycle2 ? 0.22 : 0.18;

    // Determine circle radius for current step
    let circleR = 15;
    let circleDuration = '0s';
    let circleEasing = 'linear';
    if (isInhale) { circleR = 70; circleDuration = '4s'; circleEasing = 'ease-in'; }
    else if (isHold) { circleR = 70; circleDuration = '0s'; }
    else if (isExhale) { circleR = 15; circleDuration = '8s'; circleEasing = 'ease-out'; }

    // Breathing label
    let breatheLabel = '';
    if (isInhale) breatheLabel = 'in';
    else if (isHold) breatheLabel = 'hold';
    else if (isExhale) breatheLabel = 'out';

    const showBreathing = isCycle1 || isCycle2 || isFadeout;

    return (
      <div className="fixed inset-0 z-50 bg-black flex items-center justify-center font-sans select-none">

        {/* Headphone suggestion */}
        {centerStep === 'headphones' && (
          <div
            className="text-center"
            style={{ animation: `focusFadeInOut 2s ${APPLE_EASE} forwards` }}
          >
            <p style={{ fontSize: '22px', marginBottom: '6px' }}>🎧</p>
            <p style={{ fontSize: '11px', color: 'rgba(240,237,246,0.2)' }}>
              For the full experience, use headphones
            </p>
          </div>
        )}

        {/* 'void' text */}
        {centerStep === 'void' && (
          <p
            className="text-center lowercase"
            style={{
              fontSize: '13px',
              color: 'rgba(168,85,247,0.2)',
              letterSpacing: '0.3em',
              animation: `focusFadeInOut 1.5s ${APPLE_EASE} forwards`,
            }}
          >
            void
          </p>
        )}

        {/* Breathing circle */}
        {showBreathing && (
          <div
            className="flex flex-col items-center"
            style={{
              opacity: isFadeout ? 0 : 1,
              transition: `opacity 1s ${APPLE_EASE}`,
            }}
          >
            <svg width="160" height="160" viewBox="0 0 160 160" className="overflow-visible">
              <circle
                cx="80" cy="80"
                r={isHold || isFadeout ? 70 : circleR}
                fill="none"
                strokeWidth="1"
                style={{
                  stroke: isHold
                    ? undefined
                    : `rgba(168,85,247,${strokeBase})`,
                  transition: isHold
                    ? undefined
                    : `r ${circleDuration} ${circleEasing}`,
                  animation: isHold
                    ? `holdPulse 500ms ease-in-out infinite alternate`
                    : undefined,
                  // CSS custom properties for the pulse animation
                  ...(isHold ? {
                    '--pulse-low': `rgba(168,85,247,${strokeBase})`,
                    '--pulse-high': `rgba(168,85,247,${strokePulseHigh})`,
                  } as React.CSSProperties : {}),
                }}
              />
            </svg>

            {/* Breathing label */}
            {breatheLabel && !isFadeout && (
              <p
                key={centerStep}
                style={{
                  fontSize: '11px',
                  color: 'rgba(240,237,246,0.1)',
                  marginTop: '40px',
                  animation: `focusFadeInOut ${isInhale ? '4s' : isHold ? '7s' : '8s'} ${APPLE_EASE} forwards`,
                }}
              >
                {breatheLabel}
              </p>
            )}
          </div>
        )}

        {/* Context line (existing) */}
        {centerStep === 'context' && contextLine && (
          <p
            className="text-center px-8 max-w-lg"
            style={{
              fontSize: '13px',
              color: 'rgba(240,237,246,0.3)',
              animation: `focusFadeInOut 4s ${APPLE_EASE} forwards`,
            }}
          >
            {contextLine}
          </p>
        )}

        {/* Opener (existing) */}
        {centerStep === 'opener' && openerText && (
          <p
            className="text-center px-8 max-w-lg font-medium"
            style={{
              fontSize: '20px',
              color: 'rgba(240,237,246,0.8)',
              animation: `focusFadeInOut 4s ${APPLE_EASE} forwards`,
            }}
          >
            {openerText}
          </p>
        )}

        {/* Ready (existing) */}
        {centerStep === 'ready' && (
          <p
            className="text-center lowercase"
            style={{
              fontSize: '14px',
              color: 'rgba(168,85,247,0.4)',
              animation: `focusFadeInOut 2s ${APPLE_EASE} forwards`,
            }}
          >
            ready
          </p>
        )}

        {/* Skip button */}
        <button
          onClick={skipCentering}
          className="fixed bottom-8 right-8 z-50"
          style={{ fontSize: '10px', color: 'rgba(240,237,246,0.1)' }}
        >
          Skip →
        </button>

        {/* Keyframe styles */}
        <style>{`
          @keyframes focusFadeInOut {
            0% { opacity: 0; }
            12% { opacity: 1; }
            75% { opacity: 1; }
            100% { opacity: 0; }
          }
          @keyframes holdPulse {
            from { stroke: rgba(168,85,247,${strokeBase}); }
            to { stroke: rgba(168,85,247,${strokePulseHigh}); }
          }
        `}</style>
      </div>
    );
  }

  // --- Teleprompter Phase ---
  if (phase === 'teleprompter') {
    const translateY = getTranslateY();

    return (
      <div
        className="fixed inset-0 z-50 font-sans select-none overflow-hidden"
        style={{ animation: `ambientPulse 4s ease infinite` }}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        onClick={(e) => {
          if ((e.target as HTMLElement).closest('[data-topbar]')) return;
          setPaused(p => !p);
        }}
      >
        {/* Top bar */}
        <div
          data-topbar
          className="fixed top-0 left-0 right-0 z-10 flex items-center justify-between px-4 sm:px-6 py-3"
          style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}
          onClick={e => e.stopPropagation()}
        >
          <button
            onClick={onExit}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center"
            style={{ color: 'rgba(240,237,246,0.4)' }}
          >
            <X className="w-5 h-5" />
          </button>

          <span className="font-mono text-lg" style={{ color: 'rgba(240,237,246,0.5)' }}>
            {formatTimer(elapsed)}
          </span>

          <div className="flex gap-1">
            {([0.75, 1, 1.25] as Speed[]).map(s => (
              <button
                key={s}
                onClick={() => setSpeed(s)}
                className="px-2 py-1 rounded-full text-[10px] font-mono transition-all"
                style={{
                  color: 'rgba(240,237,246,0.35)',
                  border: speed === s ? '1px solid rgba(168,85,247,0.5)' : '1px solid rgba(240,237,246,0.08)',
                }}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>

        {/* Lines container */}
        <div
          className="absolute inset-0 flex flex-col items-center"
          style={{
            transform: `translateY(${translateY}px)`,
            transition: `transform 400ms ${APPLE_EASE}`,
            paddingTop: '50vh',
          }}
        >
          {lines.map((line, idx) => {
            const isCurrent = idx === currentLine;
            const isPast = idx < currentLine;
            const isTransition = line.type === 'transition';
            const isPauseLine = line.type === 'pause';

            let opacity = 0.2;
            if (isCurrent) opacity = 1;
            else if (isPast) opacity = 0.15;

            let fontSize = '22px';
            if (isTransition) fontSize = '18px';
            if (isPauseLine) fontSize = '14px';

            return (
              <div
                key={idx}
                ref={el => { lineRefs.current[idx] = el; }}
                className="w-full max-w-2xl px-8 py-3 text-center"
                style={{
                  opacity,
                  transition: `opacity 400ms ${APPLE_EASE}`,
                }}
              >
                {isPauseLine ? (
                  <p style={{ color: 'rgba(240,237,246,0.2)', fontSize, letterSpacing: '0.3em' }}>
                    · · ·
                  </p>
                ) : (
                  <p
                    style={{
                      fontSize,
                      color: isCurrent ? 'rgba(240,237,246,0.85)' : 'rgba(240,237,246,0.5)',
                      fontStyle: isTransition ? 'italic' : 'normal',
                      fontWeight: isCurrent ? 500 : 400,
                      lineHeight: 1.6,
                      transition: `color 400ms ${APPLE_EASE}, font-weight 400ms ${APPLE_EASE}`,
                    }}
                  >
                    {line.text}
                  </p>
                )}

                {isCurrent && paused && (
                  <p
                    className="mt-2"
                    style={{
                      fontSize: '12px',
                      color: 'rgba(240,237,246,0.15)',
                      animation: `focusFadeIn 300ms ${APPLE_EASE} forwards`,
                    }}
                  >
                    paused
                  </p>
                )}
              </div>
            );
          })}
        </div>

        <style>{`
          @keyframes ambientPulse {
            0%, 100% { background-color: #000000; }
            50% { background-color: #020103; }
          }
          @keyframes focusFadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
        `}</style>
      </div>
    );
  }

  // --- Cool-Down Phase ---
  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center font-sans select-none">
      {(coolStep === 'ready' || coolStep === 'time' || coolStep === 'buttons') && (
        <p
          className="text-center mb-4"
          style={{
            fontSize: '16px',
            color: '#ffffff',
            animation: `focusFadeIn 600ms ${APPLE_EASE} forwards`,
          }}
        >
          You're ready.
        </p>
      )}

      {(coolStep === 'time' || coolStep === 'buttons') && (
        <p
          className="text-center mb-8"
          style={{
            fontSize: '13px',
            color: 'rgba(240,237,246,0.3)',
            animation: `focusFadeIn 600ms ${APPLE_EASE} forwards`,
          }}
        >
          {formatTimer(elapsed)}
        </p>
      )}

      {coolStep === 'buttons' && (
        <div
          className="flex gap-4"
          style={{ animation: `focusFadeIn 600ms ${APPLE_EASE} forwards` }}
        >
          <button
            onClick={restartPractice}
            className="px-6 py-3 rounded-xl text-sm font-medium transition-colors"
            style={{
              border: '1px solid rgba(240,237,246,0.15)',
              color: 'rgba(240,237,246,0.6)',
            }}
          >
            Practice again
          </button>
          <button
            onClick={onExit}
            className="px-6 py-3 rounded-xl text-sm font-medium text-white"
            style={{
              background: 'linear-gradient(135deg, rgba(168,85,247,0.8), rgba(236,72,153,0.8))',
            }}
          >
            Done
          </button>
        </div>
      )}

      <style>{`
        @keyframes focusFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default FocusMode;
