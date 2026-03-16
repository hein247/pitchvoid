import { useState, useRef, useEffect, useCallback } from "react";

interface ScriptSection {
  title: string;
  points: string[];
  coaching?: string;
}

interface TeleprompterProps {
  sections: ScriptSection[];
  onExit: () => void;
  onComplete?: () => void;
}

export default function Teleprompter({ sections, onExit, onComplete }: TeleprompterProps) {
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(40);
  const [elapsed, setElapsed] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef(200);
  const animRef = useRef<number | null>(null);
  const lastTsRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const draggingRef = useRef(false);
  const dragStartYRef = useRef(0);
  const dragStartOffsetRef = useRef(0);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const getPixelsPerSec = useCallback(() => {
    const s = 0.2 + (speed / 100) * 1.8;
    return 40 * s;
  }, [speed]);

  const getSpeedLabel = useCallback(() => {
    return (0.2 + (speed / 100) * 1.8).toFixed(1) + "x";
  }, [speed]);

  const updateTrack = useCallback(() => {
    if (trackRef.current) {
      trackRef.current.style.transform = `translateY(${offsetRef.current}px)`;
    }
  }, []);

  const scroll = useCallback((ts: number) => {
    if (!playing) return;
    if (!lastTsRef.current) lastTsRef.current = ts;
    if (!startTimeRef.current) startTimeRef.current = ts;

    const dt = (ts - lastTsRef.current) / 1000;
    lastTsRef.current = ts;

    offsetRef.current -= getPixelsPerSec() * dt;

    const track = trackRef.current;
    const viewport = viewportRef.current;
    if (track && viewport) {
      const maxScroll = -(track.scrollHeight - viewport.clientHeight + 50);
      if (offsetRef.current < maxScroll) {
        offsetRef.current = maxScroll;
        setPlaying(false);
        onComplete?.();
        return;
      }
    }

    updateTrack();
    setElapsed(Math.floor((ts - startTimeRef.current) / 1000));
    animRef.current = requestAnimationFrame(scroll);
  }, [playing, getPixelsPerSec, updateTrack, onComplete]);

  useEffect(() => {
    if (playing) {
      lastTsRef.current = null;
      animRef.current = requestAnimationFrame(scroll);
    }
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [playing, scroll]);

  const handleDragStart = useCallback((clientY: number) => {
    if (playing) setPlaying(false);
    draggingRef.current = true;
    dragStartYRef.current = clientY;
    dragStartOffsetRef.current = offsetRef.current;
  }, [playing]);

  const handleDragMove = useCallback((clientY: number) => {
    if (!draggingRef.current) return;
    const dy = clientY - dragStartYRef.current;
    offsetRef.current = dragStartOffsetRef.current + dy;
    updateTrack();
  }, [updateTrack]);

  const handleDragEnd = useCallback(() => {
    draggingRef.current = false;
  }, []);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (playing) setPlaying(false);
      offsetRef.current -= e.deltaY * 0.5;
      updateTrack();
    };

    viewport.addEventListener("wheel", onWheel, { passive: false });
    return () => viewport.removeEventListener("wheel", onWheel);
  }, [playing, updateTrack]);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => handleDragMove(e.clientY);
    const onMouseUp = () => handleDragEnd();
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [handleDragMove, handleDragEnd]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const handleReset = () => {
    setPlaying(false);
    offsetRef.current = 200;
    updateTrack();
    setElapsed(0);
    startTimeRef.current = null;
    onExit();
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col relative overflow-hidden"
      style={{ background: "#06050b", minHeight: "100vh" }}>

      {/* Background */}
      <div className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse 60% 40% at 50% 30%, rgba(128,60,220,0.07) 0%, transparent 70%), radial-gradient(ellipse 40% 50% at 60% 70%, rgba(100,40,200,0.04) 0%, transparent 55%)"
        }} />

      {/* Top bar */}
      <div className="flex justify-between items-center px-6 pt-5 pb-3 z-10">
        <span className="text-[10px] font-light uppercase tracking-[0.2em]"
          style={{ color: "rgba(168,85,247,0.4)" }}>
          teleprompter
        </span>
        <span className="text-[12px] font-extralight tabular-nums"
          style={{ color: "rgba(240,237,246,0.2)" }}>
          {formatTime(elapsed)}
        </span>
      </div>

      {/* Scroll viewport */}
      <div ref={viewportRef}
        className="flex-1 relative overflow-hidden z-10 cursor-default"
        style={{ minHeight: 440 }}
        onMouseDown={(e) => handleDragStart(e.clientY)}
        onTouchStart={(e) => handleDragStart(e.touches[0].clientY)}
        onTouchMove={(e) => { e.preventDefault(); handleDragMove(e.touches[0].clientY); }}
        onTouchEnd={handleDragEnd}>

        {/* Fade top */}
        <div className="absolute top-0 left-0 right-0 h-20 z-30 pointer-events-none"
          style={{ background: "linear-gradient(to bottom, #06050b 0%, transparent 100%)" }} />

        {/* Focus zone */}
        <div className="absolute left-0 right-0 pointer-events-none z-20"
          style={{
            top: "30%",
            height: "16%",
            background: "linear-gradient(to bottom, rgba(168,85,247,0) 0%, rgba(168,85,247,0.03) 40%, rgba(168,85,247,0.03) 60%, rgba(168,85,247,0) 100%)"
          }} />
        <div className="absolute left-0 right-0 z-20 pointer-events-none"
          style={{ top: "38%", height: 1, background: "rgba(168,85,247,0.12)" }} />

        {/* Fade bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-24 z-30 pointer-events-none"
          style={{ background: "linear-gradient(to top, #06050b 0%, transparent 100%)" }} />

        {/* Script track */}
        <div ref={trackRef} className="absolute left-0 right-0 px-8"
          style={{ transform: `translateY(${offsetRef.current}px)`, willChange: "transform" }}>

          {sections.map((section, sIdx) => (
            <div key={sIdx}>
              {sIdx > 0 && (
                <p className="text-center my-9"
                  style={{ color: "rgba(168,85,247,0.15)", fontSize: 14, letterSpacing: "0.5em" }}>
                  . . .
                </p>
              )}

              <p className="text-[11px] uppercase tracking-[0.2em] font-light mb-5"
                style={{
                  color: "rgba(168,85,247,0.55)",
                  marginTop: sIdx === 0 ? 0 : 12,
                }}>
                {section.title}
              </p>

              {section.points.map((point, pIdx) => (
                <p key={pIdx}
                  className="text-[22px] font-light mb-7"
                  style={{
                    color: "rgba(240,237,246,0.85)",
                    lineHeight: 1.65,
                    letterSpacing: "0.01em",
                  }}
                  dangerouslySetInnerHTML={{
                    __html: point.replace(/\*\*(.*?)\*\*/g, '<strong style="color:rgba(255,255,255,1);font-weight:500">$1</strong>')
                  }} />
              ))}

              {section.coaching && (
                <p className="text-[14px] italic mb-7"
                  style={{
                    color: "rgba(168,85,247,0.35)",
                    fontFamily: "'Cormorant Garamond', serif",
                    letterSpacing: "0.02em",
                  }}>
                  &#9670; {section.coaching}
                </p>
              )}
            </div>
          ))}

          {/* Bottom spacer */}
          <div style={{ height: 300 }} />
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-5 px-6 pt-4 pb-6 z-10">
        <button onClick={handleReset}
          className="bg-transparent border-none text-[11px] font-extralight cursor-pointer transition-colors duration-200"
          style={{ color: "rgba(240,237,246,0.15)", letterSpacing: "0.1em" }}>
          exit
        </button>

        <div className="flex items-center gap-3">
          <span className="text-[10px] font-extralight min-w-[32px] text-center tabular-nums"
            style={{ color: "rgba(240,237,246,0.2)", letterSpacing: "0.1em" }}>
            {getSpeedLabel()}
          </span>
          <input type="range" min={0} max={100} value={speed}
            onChange={(e) => setSpeed(parseInt(e.target.value))}
            className="w-[120px] h-[2px] appearance-none outline-none cursor-pointer rounded"
            style={{
              background: "rgba(168,85,247,0.15)",
              accentColor: "rgba(168,85,247,0.5)",
            }} />
        </div>

        <button onClick={() => setPlaying(!playing)}
          className="w-11 h-11 rounded-full flex items-center justify-center cursor-pointer transition-all duration-200"
          style={{
            background: "rgba(168,85,247,0.1)",
            border: "1px solid rgba(168,85,247,0.25)",
          }}>
          {playing ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="rgba(240,237,246,0.6)">
              <rect x="5" y="3" width="4" height="18" />
              <rect x="15" y="3" width="4" height="18" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="rgba(240,237,246,0.6)">
              <polygon points="6,3 20,12 6,21" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
