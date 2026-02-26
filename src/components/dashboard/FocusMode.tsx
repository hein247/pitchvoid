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
  | 'zone_intro'
  | 'choice'
  | 'follow_breathing'
  | 'breathe1_inhale'
  | 'breathe1_hold'
  | 'breathe1_exhale'
  | 'between_cycles'
  | 'one_more'
  | 'breathe2_inhale'
  | 'breathe2_hold'
  | 'breathe2_exhale'
  | 'breathe_fadeout'
  | 'in_the_zone'
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
  const [breatheCountdown, setBreatheCountdown] = useState<number | null>(null);
  const countdownIntervalsRef = useRef<ReturnType<typeof setInterval>[]>([]);
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
  // --- Countdown helper ---
  const startCountdown = useCallback((from: number, durationSec: number) => {
    setBreatheCountdown(from);
    let count = from;
    const intervalMs = (durationSec / from) * 1000;
    const iv = setInterval(() => {
      count--;
      if (count <= 0) {
        clearInterval(iv);
        setBreatheCountdown(null);
      } else {
        setBreatheCountdown(count);
      }
    }, intervalMs);
    countdownIntervalsRef.current.push(iv);
  }, []);

  // Start the breathing sequence (called when user picks 'Enter the Void')
  const startBreathingSequence = useCallback(() => {
    const ids: ReturnType<typeof setTimeout>[] = [];
    const q = (fn: () => void, ms: number) => { ids.push(setTimeout(fn, ms)); };

    // 0.0s — 'Follow the breathing' (1.5s)
    setCenterStep('follow_breathing');
    setBreatheCountdown(null);

    // 1.5s — Audio fade-in, brief black
    q(() => {
      startAudio();
      setCenterStep('black');
    }, 1500);

    // 1.7s — Cycle 1 Inhale (4s)
    q(() => {
      setCenterStep('breathe1_inhale');
      startCountdown(4, 4);
    }, 1700);

    // 5.7s — Cycle 1 Hold (7s)
    q(() => {
      setCenterStep('breathe1_hold');
      startCountdown(7, 7);
    }, 5700);

    // 12.7s — Cycle 1 Exhale (8s)
    q(() => {
      setCenterStep('breathe1_exhale');
      startCountdown(8, 8);
    }, 12700);

    // 20.7s — 1s pause
    q(() => {
      setCenterStep('between_cycles');
      setBreatheCountdown(null);
    }, 20700);

    // 21.7s — 'one more' (1.5s)
    q(() => setCenterStep('one_more'), 21700);

    // 23.2s — Cycle 2 Inhale (4s)
    q(() => {
      setCenterStep('breathe2_inhale');
      startCountdown(4, 4);
    }, 23200);

    // 27.2s — Cycle 2 Hold (7s)
    q(() => {
      setCenterStep('breathe2_hold');
      startCountdown(7, 7);
    }, 27200);

    // 34.2s — Cycle 2 Exhale (8s)
    q(() => {
      setCenterStep('breathe2_exhale');
      startCountdown(8, 8);
    }, 34200);

    // 42.2s — Circle fades, audio fades
    q(() => {
      setCenterStep('breathe_fadeout');
      setBreatheCountdown(null);
      fadeOutAudio();
    }, 42200);

    // 44.2s — 'you're in the zone' (2s)
    q(() => setCenterStep('in_the_zone'), 44200);

    // 46.2s — Existing focus sequence: context line
    const contextLine = scriptData.context_line || '';
    q(() => setCenterStep(contextLine ? 'context' : 'opener'), 46200);

    if (contextLine) {
      q(() => setCenterStep('opener'), 50200);
    }

    const openerOffset = contextLine ? 54200 : 50200;
    q(() => setCenterStep('ready'), openerOffset);
    q(() => setCenterStep('done'), openerOffset + 2000);
    q(() => setPhase('teleprompter'), openerOffset + 2500);

    timeoutsRef.current.push(...ids);
  }, [startAudio, fadeOutAudio, scriptData.context_line, startCountdown]);

  // Start the focus sequence directly (skip breathing, go to context → opener → ready)
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
    setBreatheCountdown(null);

    // 0.3s — headphone suggestion (2s)
    q(() => setCenterStep('headphones'), 300);

    // 2.3s — 'Let's get you in the zone' (2s)
    q(() => setCenterStep('zone_intro'), 2300);

    // 4.3s — Show choice screen (waits for user tap)
    q(() => setCenterStep('choice'), 4300);

    timeoutsRef.current = ids;
  }, []);

  useEffect(() => {
    if (phase === 'centering') startCentering();
    return () => {
      timeoutsRef.current.forEach(clearTimeout);
      countdownIntervalsRef.current.forEach(clearInterval);
      countdownIntervalsRef.current = [];
    };
  }, [phase, startCentering]);

  const skipCentering = () => {
    timeoutsRef.current.forEach(clearTimeout);
    countdownIntervalsRef.current.forEach(clearInterval);
    countdownIntervalsRef.current = [];
    stopAudioImmediately();
    setBreatheCountdown(null);
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
    setBreatheCountdown(null);
    countdownIntervalsRef.current.forEach(clearInterval);
    countdownIntervalsRef.current = [];
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

    const strokeBase = isCycle2 ? 0.6 : 0.5;
    const strokePulseHigh = isCycle2 ? 0.8 : 0.7;

    // Determine circle radius for current step
    let circleR = 15;
    let circleDuration = '0s';
    let circleEasing = 'linear';
    if (isInhale) { circleR = 70; circleDuration = '4s'; circleEasing = 'ease-in'; }
    else if (isHold) { circleR = 70; circleDuration = '0s'; }
    else if (isExhale) { circleR = 15; circleDuration = '8s'; circleEasing = 'ease-out'; }

    // Breathing label
    let breatheLabel = '';
    if (isInhale) breatheLabel = 'breathe in';
    else if (isHold) breatheLabel = 'hold';
    else if (isExhale) breatheLabel = 'breathe out';

    const showBreathing = isCycle1 || isCycle2 || isFadeout;

    return (
      <div className="fixed inset-0 z-50 bg-black flex items-center justify-center font-sans select-none">

        {/* Centering phase renders based on centerStep */}

        {/* Headphone suggestion */}
        {centerStep === 'headphones' && (
          <div
            className="text-center"
            style={{ animation: `focusFadeInOut 2s ${APPLE_EASE} forwards` }}
          >
            <p style={{ fontSize: '22px', marginBottom: '6px' }}>🎧</p>
            <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)' }}>
              For the full experience, use headphones
            </p>
          </div>
        )}

        {/* 'Let's get you in the zone' */}
        {centerStep === 'zone_intro' && (
          <p
            className="text-center font-sans"
            style={{
              fontSize: '15px',
              color: 'rgba(255,255,255,0.8)',
              animation: `focusFadeInOut 2s ${APPLE_EASE} forwards`,
            }}
          >
            Let's get you in the zone
          </p>
        )}

        {/* Choice screen */}
        {centerStep === 'choice' && (
          <div
            className="flex flex-col items-center justify-center gap-6 font-sans"
            style={{ animation: `focusFadeIn 0.6s ${APPLE_EASE} forwards` }}
          >
            <button
              onClick={() => {
                timeoutsRef.current.forEach(clearTimeout);
                startBreathingSequence();
              }}
              className="font-sans cursor-pointer transition-all duration-300 hover:scale-105"
              style={{
                fontSize: '14px',
                color: 'rgba(240,237,246,0.6)',
                background: 'rgba(168,85,247,0.1)',
                border: '1px solid rgba(168,85,247,0.2)',
                borderRadius: '999px',
                padding: '12px 32px',
              }}
            >
              Enter the Void
            </button>
            <button
              onClick={() => {
                timeoutsRef.current.forEach(clearTimeout);
                startFocusSequenceDirect();
              }}
              className="font-sans cursor-pointer bg-transparent border-none"
              style={{
                fontSize: '11px',
                color: 'rgba(240,237,246,0.12)',
              }}
            >
              Skip to practice →
            </button>
          </div>
        )}

        {centerStep === 'follow_breathing' && (
          <p
            className="text-center font-sans"
            style={{
              fontSize: '12px',
              color: 'rgba(255,255,255,0.7)',
              animation: `focusFadeInOut 1.5s ${APPLE_EASE} forwards`,
            }}
          >
            Follow the breathing
          </p>
        )}

        {/* Between cycles 'one more' */}
        {centerStep === 'one_more' && (
          <p
            className="text-center font-sans"
            style={{
              fontSize: '12px',
              color: 'rgba(168,85,247,0.7)',
              animation: `focusFadeInOut 1.5s ${APPLE_EASE} forwards`,
            }}
          >
            one more
          </p>
        )}

        {/* 'you're in the zone' after breathing */}
        {centerStep === 'in_the_zone' && (
          <p
            className="text-center font-sans"
            style={{
              fontSize: '14px',
              color: 'rgba(255,255,255,0.8)',
              animation: `focusFadeInOut 2s ${APPLE_EASE} forwards`,
            }}
          >
            you're in the zone
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
            {/* Phase label ABOVE circle */}
            {breatheLabel && !isFadeout && (
              <p
                key={`label-${centerStep}`}
                style={{
                  fontSize: '11px',
                  color: 'rgba(255,255,255,0.7)',
                  marginBottom: '20px',
                  animation: `focusFadeInOut ${isInhale ? '4s' : isHold ? '7s' : '8s'} ${APPLE_EASE} forwards`,
                }}
              >
                {breatheLabel}
              </p>
            )}

            {/* SVG circle with countdown inside */}
            <div style={{ position: 'relative', width: '160px', height: '160px' }}>
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
                    ...(isHold ? {
                      '--pulse-low': `rgba(168,85,247,${strokeBase})`,
                      '--pulse-high': `rgba(168,85,247,${strokePulseHigh})`,
                    } as React.CSSProperties : {}),
                  }}
                />
              </svg>

              {/* Countdown number inside circle */}
              {breatheCountdown !== null && !isFadeout && (
                <span
                  key={`cd-${breatheCountdown}-${centerStep}`}
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    fontSize: '28px',
                    fontWeight: 300,
                    color: isHold ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.8)',
                    fontFamily: "'Be Vietnam Pro', sans-serif",
                    animation: `countdownPulse 1s ${APPLE_EASE} forwards`,
                  }}
                >
                  {breatheCountdown}
                </span>
              )}
            </div>
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
              color: 'rgba(168,85,247,0.8)',
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
          @keyframes countdownPulse {
            0% { opacity: 0; }
            15% { opacity: 1; }
            70% { opacity: 1; }
            100% { opacity: 0; }
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
