import { useEffect, useRef, useCallback } from 'react';

const NUM_OUTER = 12;
const NUM_INNER = 6;
const PHASES = [
  { label: 'Inhale', dur: 4000 },
  { label: 'Hold', dur: 7000 },
  { label: 'Exhale', dur: 8000 },
];
const TOTAL = PHASES.reduce((s, p) => s + p.dur, 0);
const CX = 140, CY = 140;
const OUTER_R_MIN = 100, OUTER_R_MAX = 50;
const INNER_R_MIN = 50, INNER_R_MAX = 24;

function easeInOut(t: number) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

function getBreathState(elapsed: number) {
  let acc = 0;
  for (let i = 0; i < PHASES.length; i++) {
    if (elapsed < acc + PHASES[i].dur) {
      return { phase: i, prog: easeInOut((elapsed - acc) / PHASES[i].dur) };
    }
    acc += PHASES[i].dur;
  }
  return { phase: 0, prog: 0 };
}

interface BreathingCanvasProps {
  /** 'idle' = static rings, 'breathing' = animated, 'stopped' = no rendering */
  state: 'idle' | 'breathing' | 'stopped';
  cycles?: number;
  onCycleUpdate?: (cycle: number) => void;
  onPhaseUpdate?: (phase: number, prog: number) => void;
  onComplete?: () => void;
  size?: number;
}

const BreathingCanvas = ({
  state,
  cycles = 3,
  onCycleUpdate,
  onPhaseUpdate,
  onComplete,
  size = 280,
}: BreathingCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const startTimeRef = useRef<number | null>(null);
  const lastTsRef = useRef<number | null>(null);
  const outerSpinRef = useRef(0);
  const innerSpinRef = useRef(0);
  const prevCycleRef = useRef(-1);

  const drawDot = useCallback((ctx: CanvasRenderingContext2D, x: number, y: number, r: number, alpha: number, glowR: number) => {
    if (glowR > 0) {
      const g = ctx.createRadialGradient(x, y, 0, x, y, glowR);
      g.addColorStop(0, `rgba(200,160,255,${alpha * 0.5})`);
      g.addColorStop(0.4, `rgba(168,85,247,${alpha * 0.2})`);
      g.addColorStop(1, `rgba(168,85,247,0)`);
      ctx.beginPath();
      ctx.arc(x, y, glowR, 0, Math.PI * 2);
      ctx.fillStyle = g;
      ctx.fill();
    }
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(220,195,255,${alpha})`;
    ctx.fill();
  }, []);

  const drawRingTrace = useCallback((ctx: CanvasRenderingContext2D, radius: number, alpha: number) => {
    ctx.beginPath();
    ctx.arc(CX, CY, radius, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(168,85,247,${alpha})`;
    ctx.lineWidth = 0.5;
    ctx.stroke();
  }, []);

  const drawIdle = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, size, size);

    drawRingTrace(ctx, OUTER_R_MIN, 0.04);
    drawRingTrace(ctx, INNER_R_MIN, 0.025);
    for (let i = 0; i < NUM_OUTER; i++) {
      const a = (i / NUM_OUTER) * Math.PI * 2 - Math.PI / 2;
      drawDot(ctx, CX + Math.cos(a) * OUTER_R_MIN, CY + Math.sin(a) * OUTER_R_MIN, 3.5, 0.25, 8);
    }
    for (let i = 0; i < NUM_INNER; i++) {
      const a = (i / NUM_INNER) * Math.PI * 2 - Math.PI / 2;
      drawDot(ctx, CX + Math.cos(a) * INNER_R_MIN, CY + Math.sin(a) * INNER_R_MIN, 2.5, 0.15, 5);
    }
    drawDot(ctx, CX, CY, 2, 0.18, 6);
  }, [size, drawDot, drawRingTrace]);

  useEffect(() => {
    if (state === 'idle') {
      drawIdle();
    }
    if (state === 'breathing') {
      startTimeRef.current = null;
      lastTsRef.current = null;
      outerSpinRef.current = 0;
      innerSpinRef.current = 0;
      prevCycleRef.current = -1;

      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const drawFrame = (ts: number) => {
        if (!startTimeRef.current) {
          startTimeRef.current = ts;
          lastTsRef.current = ts;
        }
        const dt = (ts - lastTsRef.current!) / 1000;
        lastTsRef.current = ts;

        const totalElapsed = ts - startTimeRef.current;
        const cycleNum = Math.floor(totalElapsed / TOTAL);
        if (cycleNum >= cycles) {
          onComplete?.();
          return;
        }

        if (cycleNum !== prevCycleRef.current) {
          prevCycleRef.current = cycleNum;
          onCycleUpdate?.(cycleNum);
        }

        const elapsed = totalElapsed % TOTAL;
        const { phase, prog } = getBreathState(elapsed);
        onPhaseUpdate?.(phase, prog);

        ctx.clearRect(0, 0, size, size);

        let outerSpeed: number, innerSpeed: number;
        if (phase === 0) {
          outerSpeed = 0.15 + prog * 0.55;
          innerSpeed = -(0.2 + prog * 0.7);
        } else if (phase === 1) {
          outerSpeed = 0.06;
          innerSpeed = -0.045;
        } else {
          outerSpeed = -(0.15 + prog * 0.6);
          innerSpeed = 0.2 + prog * 0.8;
        }
        outerSpinRef.current += outerSpeed * dt;
        innerSpinRef.current += innerSpeed * dt;

        let outerR: number, innerR: number, centerR: number, brightness: number;
        if (phase === 0) {
          outerR = OUTER_R_MIN - prog * (OUTER_R_MIN - OUTER_R_MAX);
          innerR = INNER_R_MIN - prog * (INNER_R_MIN - INNER_R_MAX);
          centerR = 1.5 + prog * 5;
          brightness = 0.35 + prog * 0.55;
        } else if (phase === 1) {
          outerR = OUTER_R_MAX;
          innerR = INNER_R_MAX;
          centerR = 6.5;
          brightness = 0.9;
        } else {
          outerR = OUTER_R_MAX + prog * (OUTER_R_MIN - OUTER_R_MAX);
          innerR = INNER_R_MAX + prog * (INNER_R_MIN - INNER_R_MAX);
          centerR = 6.5 - prog * 5;
          brightness = 0.9 - prog * 0.55;
        }

        // Ring traces
        drawRingTrace(ctx, outerR, brightness * 0.08);
        drawRingTrace(ctx, innerR, brightness * 0.05);

        // Connector web on outer ring
        if (brightness > 0.35) {
          ctx.strokeStyle = `rgba(180,130,255,${(brightness - 0.35) * 0.08})`;
          ctx.lineWidth = 0.4;
          for (let i = 0; i < NUM_OUTER; i++) {
            const a1 = (i / NUM_OUTER) * Math.PI * 2 + outerSpinRef.current;
            const a2 = ((i + 1) / NUM_OUTER) * Math.PI * 2 + outerSpinRef.current;
            ctx.beginPath();
            ctx.moveTo(CX + Math.cos(a1) * outerR, CY + Math.sin(a1) * outerR);
            ctx.lineTo(CX + Math.cos(a2) * outerR, CY + Math.sin(a2) * outerR);
            ctx.stroke();
          }
        }

        // Cross connections (outer to inner) at peak brightness
        if (brightness > 0.6) {
          ctx.strokeStyle = `rgba(168,85,247,${(brightness - 0.6) * 0.05})`;
          ctx.lineWidth = 0.3;
          for (let i = 0; i < NUM_INNER; i++) {
            const aI = (i / NUM_INNER) * Math.PI * 2 + innerSpinRef.current;
            const aO = (i * 2 / NUM_OUTER) * Math.PI * 2 + outerSpinRef.current;
            ctx.beginPath();
            ctx.moveTo(CX + Math.cos(aI) * innerR, CY + Math.sin(aI) * innerR);
            ctx.lineTo(CX + Math.cos(aO) * outerR, CY + Math.sin(aO) * outerR);
            ctx.stroke();
          }
        }

        // Outer dots
        for (let i = 0; i < NUM_OUTER; i++) {
          const a = (i / NUM_OUTER) * Math.PI * 2 + outerSpinRef.current;
          const x = CX + Math.cos(a) * outerR;
          const y = CY + Math.sin(a) * outerR;
          const sz = 3 + brightness * 3.5;
          drawDot(ctx, x, y, sz, brightness * 0.85, sz * 3.5);
        }

        // Inner dots
        for (let i = 0; i < NUM_INNER; i++) {
          const a = (i / NUM_INNER) * Math.PI * 2 + innerSpinRef.current;
          const x = CX + Math.cos(a) * innerR;
          const y = CY + Math.sin(a) * innerR;
          const sz = 2 + brightness * 2.5;
          drawDot(ctx, x, y, sz, brightness * 0.7, sz * 3);
        }

        // Center orb
        drawDot(ctx, CX, CY, centerR, brightness * 0.95, centerR * 4.5);

        animRef.current = requestAnimationFrame(drawFrame);
      };

      animRef.current = requestAnimationFrame(drawFrame);
    }

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [state, cycles, size, drawDot, drawRingTrace, drawIdle, onCycleUpdate, onPhaseUpdate, onComplete]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      style={{ width: size, height: size }}
    />
  );
};

export default BreathingCanvas;
