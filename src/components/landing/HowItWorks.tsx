import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import type { MotionValue } from "framer-motion";
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from "framer-motion";
const STEP_DURATION = 6000;
const TYPING_SPEED = 32;
const SCENARIO_TEXT = "interview at a luxury brand for design role, i know adobe well, good at print production, can handle pressure and tight deadlines, want to discuss portfolio";
const PARSED_CARDS = [{
  label: "WHO",
  value: "Creative Director, Luxury Brand"
}, {
  label: "WHAT",
  value: "Design Role Interview"
}, {
  label: "WHY",
  value: "Adobe Expertise + Print Production"
}, {
  label: "HOW",
  value: "Portfolio-Led, Confident"
}];
const OUTPUT_SECTIONS = [{
  title: "Technical Mastery",
  points: [
    "**Expert-level Adobe Creative Suite** — non-destructive editing, clean layer hierarchy.",
    "**Rigorous pre-flight for print**: ink density control, spot-color accuracy."
  ]
}, {
  title: "Working Under Pressure",
  points: [
    "Navigate tight production windows by **catching bottlenecks early** in prototyping.",
    "Reconciled **conflicting stakeholder feedback** into a single cohesive direction."
  ]
}, {
  title: "Next Step",
  points: [
    "Walk through the portfolio — **show how this translates** to the team's current needs."
  ]
}];
const STEPS = [{
  num: "01",
  title: "Drop Your Thoughts",
  sub: "Messy notes in, structured talking points out"
}, {
  num: "02",
  title: "AI Organizes Your Story",
  sub: "Audience, goal, and key points — parsed instantly"
}, {
  num: "03",
  title: "Your Cheat Sheet, Ready",
  sub: "One-pager or script — glance and go"
}];

/* ── Apple-style motion config ── */
const appleEase: [number, number, number, number] = [0.25, 0.1, 0.25, 1.0];
const appleSlow = {
  duration: 0.9,
  ease: appleEase
};
const appleMedium = {
  duration: 0.65,
  ease: appleEase
};
const appleFast = {
  duration: 0.45,
  ease: appleEase
};
const dofVariants = {
  enter: {
    opacity: 0,
    scale: 1.06,
    filter: "blur(12px)",
    y: 0
  },
  center: {
    opacity: 1,
    scale: 1,
    filter: "blur(0px)",
    y: 0,
    transition: {
      opacity: {
        duration: 0.7,
        ease: appleEase
      },
      scale: {
        duration: 0.9,
        ease: appleEase
      },
      filter: {
        duration: 0.8,
        ease: appleEase
      }
    }
  },
  exit: {
    opacity: 0,
    scale: 0.94,
    filter: "blur(12px)",
    y: 0,
    transition: {
      opacity: {
        duration: 0.5,
        ease: [0.25, 0.1, 0.7, 1] as [number, number, number, number]
      },
      scale: {
        duration: 0.6,
        ease: [0.25, 0.1, 0.7, 1] as [number, number, number, number]
      },
      filter: {
        duration: 0.5,
        ease: [0.25, 0.1, 0.7, 1] as [number, number, number, number]
      }
    }
  }
};
const cardMorphContainer = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.14,
      delayChildren: 0.3
    }
  }
};
const cardMorphItem = {
  hidden: {
    opacity: 0,
    scale: 0.82,
    y: 30,
    filter: "blur(8px)",
    rotateY: -8
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    filter: "blur(0px)",
    rotateY: 0,
    transition: {
      opacity: {
        duration: 0.6,
        ease: appleEase
      },
      scale: {
        duration: 0.8,
        ease: appleEase
      },
      y: {
        duration: 0.8,
        ease: appleEase
      },
      filter: {
        duration: 0.7,
        ease: appleEase
      },
      rotateY: {
        duration: 0.9,
        ease: appleEase
      }
    }
  }
};
const outputStagger = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.35
    }
  }
};
const outputItem = {
  hidden: {
    opacity: 0,
    x: 50,
    filter: "blur(6px)"
  },
  visible: {
    opacity: 1,
    x: 0,
    filter: "blur(0px)",
    transition: {
      opacity: {
        duration: 0.6,
        ease: appleEase
      },
      x: {
        duration: 0.75,
        ease: appleEase
      },
      filter: {
        duration: 0.65,
        ease: appleEase
      }
    }
  }
};

/* ── Parallax Layer ── */
function ParallaxLayer({
  children,
  depth = 0,
  mouseX,
  mouseY,
  className = "",
  style = {}
}: {
  children: React.ReactNode;
  depth?: number;
  mouseX: MotionValue<number>;
  mouseY: MotionValue<number>;
  className?: string;
  style?: React.CSSProperties;
}) {
  const factor = depth * 12;
  const x = useTransform(mouseX, [-1, 1], [factor, -factor]);
  const y = useTransform(mouseY, [-1, 1], [factor, -factor]);
  const springX = useSpring(x, {
    stiffness: 60,
    damping: 30
  });
  const springY = useSpring(y, {
    stiffness: 60,
    damping: 30
  });
  return <motion.div style={{
    x: springX,
    y: springY,
    ...style
  }} className={className}>
      {children}
    </motion.div>;
}

/* ── Main component ── */
export default function HowItWorks() {
  const [activeStep, setActiveStep] = useState(0);
  const [typedText, setTypedText] = useState("");
  const [cursorVisible, setCursorVisible] = useState(true);
  const [progress, setProgress] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const progressRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    mouseX.set(x);
    mouseY.set(y);
  }, [mouseX, mouseY]);

  /* cursor blink */
  useEffect(() => {
    const id = setInterval(() => setCursorVisible(v => !v), 530);
    return () => clearInterval(id);
  }, []);

  /* typing */
  useEffect(() => {
    if (activeStep !== 0) return;
    setTypedText("");
    let i = 0;
    typingRef.current = setInterval(() => {
      if (i < SCENARIO_TEXT.length) {
        setTypedText(SCENARIO_TEXT.slice(0, i + 1));
        i++;
      } else if (typingRef.current) clearInterval(typingRef.current);
    }, TYPING_SPEED);
    return () => {
      if (typingRef.current) clearInterval(typingRef.current);
    };
  }, [activeStep]);

  /* progress + auto-advance */
  const startProgress = useCallback(() => {
    startTimeRef.current = Date.now();
    const tick = () => {
      const pct = Math.min((Date.now() - (startTimeRef.current ?? Date.now())) / STEP_DURATION, 1);
      setProgress(pct);
      if (pct < 1) progressRef.current = requestAnimationFrame(tick);
    };
    progressRef.current = requestAnimationFrame(tick);
    timerRef.current = setTimeout(() => {
      setActiveStep(s => (s + 1) % 3);
      setProgress(0);
    }, STEP_DURATION);
  }, []);
  const stopProgress = useCallback(() => {
    if (progressRef.current) cancelAnimationFrame(progressRef.current);
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);
  useEffect(() => {
    if (!isHovered) startProgress();
    return stopProgress;
  }, [activeStep, isHovered, startProgress, stopProgress]);
  const handleStepClick = (idx: number) => {
    stopProgress();
    setActiveStep(idx);
    setProgress(0);
  };
  const glowPositions = useMemo(() => [{
    x: "35%",
    y: "40%",
    color: "rgba(168,85,247,0.07)"
  }, {
    x: "55%",
    y: "35%",
    color: "rgba(139,92,246,0.08)"
  }, {
    x: "60%",
    y: "50%",
    color: "rgba(168,85,247,0.06)"
  }], []);
  return <section ref={containerRef} onMouseMove={handleMouseMove} onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => {
    setIsHovered(false);
    mouseX.set(0);
    mouseY.set(0);
  }} className="relative overflow-hidden cursor-default" style={{
    background: "linear-gradient(180deg, transparent 0%, rgba(15,13,25,0.6) 20%, rgba(17,14,28,0.8) 60%, transparent 100%)",
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "clamp(48px, 10vw, 100px) 16px"
  }}>
      {/* Ambient glow */}
      <motion.div animate={{
      left: glowPositions[activeStep].x,
      top: glowPositions[activeStep].y,
      background: `radial-gradient(circle, ${glowPositions[activeStep].color} 0%, transparent 70%)`
    }} transition={{
      duration: 2,
      ease: appleEase
    }} className="absolute pointer-events-none" style={{
      width: 800,
      height: 800,
      borderRadius: "50%",
      transform: "translate(-50%, -50%)"
    }} />

      {/* Grain */}
      <div className="absolute inset-0 pointer-events-none z-0" style={{
      backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E")`
    }} />

      {/* Header */}
      <ParallaxLayer depth={0.5} mouseX={mouseX} mouseY={mouseY} className="text-center relative z-[1]" style={{
      marginBottom: "clamp(36px, 6vw, 72px)"
    }}>
        <motion.div initial={{
        opacity: 0,
        y: 30
      }} whileInView={{
        opacity: 1,
        y: 0
      }} viewport={{
        once: true,
        margin: "-80px"
      }} transition={{
        duration: 1,
        ease: appleEase
      }}>
          
           <h2 className="text-foreground leading-[1.15] m-0" style={{
          fontSize: "clamp(28px, 5.2vw, 60px)",
          fontWeight: 400
        }}>From scattered to structured
            <br />
            <motion.span initial={{
            opacity: 0,
            filter: "blur(8px)"
          }} whileInView={{
            opacity: 1,
            filter: "blur(0px)"
          }} viewport={{
            once: true
          }} transition={{
            duration: 1,
            delay: 0.3,
            ease: appleEase
          }} className="text-primary font-serif font-medium text-center" style={{
            fontSize: "clamp(36px, 8vw, 128px)"
          }}>
              in seconds.
            </motion.span>
          </h2>
        </motion.div>
      </ParallaxLayer>

      {/* Main layout */}
      <div className="flex gap-6 lg:gap-14 max-w-[1400px] w-full relative z-[1] flex-col lg:flex-row">
        {/* Left: Step selector */}
        <ParallaxLayer depth={0.3} mouseX={mouseX} mouseY={mouseY} className="flex flex-col gap-1 w-full lg:min-w-[360px] lg:flex-[0_0_360px]">
          {STEPS.map((step, idx) => {
          const isActive = idx === activeStep;
          return <motion.button key={idx} onClick={() => handleStepClick(idx)} animate={{
            borderColor: isActive ? "rgba(168,85,247,0.25)" : "rgba(168,85,247,0.0)",
            background: isActive ? "rgba(168,85,247,0.05)" : "rgba(168,85,247,0.0)"
          }} whileHover={{
            background: isActive ? "rgba(168,85,247,0.07)" : "rgba(168,85,247,0.03)",
            x: 3
          }} transition={{
            duration: 0.5,
            ease: appleEase
          }} className="flex items-start gap-4 sm:gap-5 p-5 sm:p-7 rounded-[20px] border border-transparent cursor-pointer text-left relative overflow-hidden outline-none">
                {/* progress bar */}
                <motion.div className="absolute bottom-0 left-4 right-4 h-[2px] rounded-[1px]" style={{
              background: "rgba(168,85,247,0.4)",
              transformOrigin: "left",
              scaleX: isActive ? progress : 0,
              opacity: isActive ? 1 : 0
            }} transition={{
              scaleX: {
                duration: 0.05
              },
              opacity: appleMedium
            }} />

                <motion.span animate={{
              color: isActive ? "#a855f7" : "rgba(168,85,247,0.18)",
              scale: isActive ? 1 : 0.95
            }} transition={appleSlow} className="font-display text-4xl font-normal leading-none relative">
                  {step.num}
                </motion.span>

                <div className="relative">
                  <motion.p animate={{
                color: isActive ? "#f0edf6" : "rgba(240,237,246,0.25)"
              }} transition={appleMedium} className="text-lg font-semibold m-0 leading-[1.3] font-sans">
                    {step.title}
                  </motion.p>
                  <motion.p animate={{
                color: isActive ? "rgba(240,237,246,0.45)" : "rgba(240,237,246,0.1)",
                height: isActive ? "auto" : 0,
                opacity: isActive ? 1 : 0,
                marginTop: isActive ? 8 : 0
              }} transition={appleMedium} className="text-base m-0 leading-[1.4] overflow-hidden font-sans">
                    {step.sub}
                  </motion.p>
                </div>
              </motion.button>;
        })}
        </ParallaxLayer>

        {/* Right: Demo viewport */}
        <ParallaxLayer depth={0.8} mouseX={mouseX} mouseY={mouseY} className="flex-1 min-h-[400px] sm:min-h-[470px] lg:min-h-[550px] relative">
          <motion.div animate={{
          boxShadow: ["0 0 60px rgba(168,85,247,0.04), 0 0 120px rgba(168,85,247,0.02)", "0 0 80px rgba(168,85,247,0.06), 0 0 160px rgba(168,85,247,0.03)", "0 0 60px rgba(168,85,247,0.04), 0 0 120px rgba(168,85,247,0.02)"]
        }} transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut"
        }} className="rounded-3xl relative overflow-hidden h-full min-h-[400px] sm:min-h-[470px] lg:min-h-[550px]" style={{
          border: "1px solid rgba(168,85,247,0.12)",
          background: "rgba(14,12,24,0.85)",
          backdropFilter: "blur(24px)"
        }}>
            {/* top highlight */}
            <motion.div animate={{
            opacity: [0.2, 0.5, 0.2]
          }} transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }} className="absolute top-0 left-[10%] right-[10%] h-px z-[3]" style={{
            background: "linear-gradient(90deg, transparent, rgba(168,85,247,0.4), transparent)"
          }} />

            {/* vignette */}
            <div className="absolute inset-0 pointer-events-none z-[2] rounded-3xl" style={{
            background: "radial-gradient(ellipse at center, transparent 50%, rgba(8,6,16,0.4) 100%)"
          }} />

            <AnimatePresence mode="wait">
              {/* STEP 0: Typing */}
              {activeStep === 0 && <motion.div key="typing" variants={dofVariants} initial="enter" animate="center" exit="exit" className="absolute inset-0 p-6 sm:p-10 lg:p-12 flex flex-col justify-center z-[1]">
                  <motion.p initial={{
                opacity: 0,
                y: -6
              }} animate={{
                opacity: 0.6,
                y: 0
              }} transition={{
                ...appleMedium,
                delay: 0.2
              }} className="text-sm font-semibold text-primary uppercase tracking-[0.12em] mb-5 font-sans">
                    Describe your scenario
                  </motion.p>

                  <motion.div initial={{
                opacity: 0,
                y: 16,
                filter: "blur(6px)"
              }} animate={{
                opacity: 1,
                y: 0,
                filter: "blur(0px)"
              }} transition={{
                duration: 0.8,
                delay: 0.25,
                ease: appleEase
              }} className="rounded-2xl relative min-h-[210px]" style={{
                border: "1px solid rgba(168,85,247,0.15)",
                background: "linear-gradient(135deg, rgba(168,85,247,0.04), rgba(168,85,247,0.01))",
                padding: "35px"
              }}>
                    <div className="absolute inset-0 rounded-2xl pointer-events-none" style={{
                  background: "radial-gradient(ellipse at top left, rgba(168,85,247,0.05), transparent 60%)"
                }} />
                    <p className="text-lg text-foreground/90 leading-[1.75] m-0 relative font-sans">
                      {typedText}
                      <motion.span animate={{
                    opacity: cursorVisible ? 1 : 0
                  }} transition={{
                    duration: 0.06
                  }} className="inline-block w-[2px] h-[24px] ml-[1px] align-text-bottom rounded-[1px]" style={{
                    background: "linear-gradient(180deg, #a855f7, #7c3aed)",
                    boxShadow: "0 0 8px rgba(168,85,247,0.4)"
                  }} />
                    </p>
                  </motion.div>

                  <motion.div initial={{
                opacity: 0
              }} animate={{
                opacity: 1
              }} transition={{
                duration: 0.8,
                delay: 0.5,
                ease: appleEase
              }} className="flex gap-2 mt-5 flex-wrap">
                    {["Voice", "Files", "URL"].map((label, i) => <motion.span key={label} initial={{
                  opacity: 0,
                  y: 6
                }} animate={{
                  opacity: 1,
                  y: 0
                }} transition={{
                  duration: 0.5,
                  delay: 0.6 + i * 0.08,
                  ease: appleEase
                }} whileHover={{
                  borderColor: "rgba(168,85,247,0.3)",
                  color: "rgba(240,237,246,0.6)",
                  transition: appleFast
                }} className="text-sm cursor-pointer font-sans" style={{
                  color: "rgba(240,237,246,0.3)",
                  padding: "9px 20px",
                  borderRadius: 24,
                  border: "1px solid rgba(168,85,247,0.1)"
                }}>
                        {label}
                      </motion.span>)}
                  </motion.div>
                </motion.div>}

              {/* STEP 1: Parsed Cards */}
              {activeStep === 1 && <motion.div key="cards" variants={dofVariants} initial="enter" animate="center" exit="exit" className="absolute inset-0 p-6 sm:p-10 lg:p-12 flex flex-col justify-center z-[1]">
                  <motion.p initial={{
                opacity: 0,
                y: -6
              }} animate={{
                opacity: 0.6,
                y: 0
              }} transition={{
                ...appleMedium,
                delay: 0.2
              }} className="text-sm font-semibold text-primary uppercase tracking-[0.12em] mb-6 font-sans">
                    AI-parsed structure
                  </motion.p>

                  <motion.div variants={cardMorphContainer} initial="hidden" animate="visible" className="grid grid-cols-2 gap-4" style={{
                perspective: 1000
              }}>
                    {PARSED_CARDS.map(card => <motion.div key={card.label} variants={cardMorphItem} whileHover={{
                  scale: 1.03,
                  borderColor: "rgba(168,85,247,0.35)",
                  boxShadow: "0 8px 32px rgba(168,85,247,0.08)",
                  transition: {
                    duration: 0.4,
                    ease: appleEase
                  }
                }} className="rounded-2xl cursor-default relative overflow-hidden" style={{
                  border: "1px solid rgba(168,85,247,0.18)",
                  background: "linear-gradient(145deg, rgba(168,85,247,0.08), rgba(168,85,247,0.02))",
                  padding: "28px 25px",
                  transformStyle: "preserve-3d"
                }}>
                        <div className="absolute pointer-events-none" style={{
                    top: -20,
                    right: -20,
                    width: 80,
                    height: 80,
                    borderRadius: "50%",
                    background: "radial-gradient(circle, rgba(168,85,247,0.08), transparent)"
                  }} />
                        <div className="flex items-center gap-3 mb-3 relative">
                          <span className="text-xs font-bold text-primary tracking-[0.1em] font-sans">{card.label}</span>
                        </div>
                        <p className="text-base text-foreground/90 m-0 leading-[1.45] font-medium relative font-sans">{card.value}</p>
                      </motion.div>)}
                  </motion.div>

                  <motion.div initial={{
                opacity: 0,
                x: -16,
                filter: "blur(4px)"
              }} animate={{
                opacity: 1,
                x: 0,
                filter: "blur(0px)"
              }} transition={{
                duration: 0.7,
                delay: 1,
                ease: appleEase
              }} className="flex items-center gap-3 mt-6">
                    <motion.div animate={{
                  boxShadow: ["0 0 0px rgba(34,197,94,0.3)", "0 0 10px rgba(34,197,94,0.5)", "0 0 0px rgba(34,197,94,0.3)"]
                }} transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }} className="w-2 h-2 rounded-full flex-shrink-0" style={{
                  background: "#22c55e"
                }} />
                    <span className="text-sm font-medium font-sans" style={{
                  color: "rgba(34,197,94,0.7)"
                }}>
                      Structure confirmed — ready to generate
                    </span>
                  </motion.div>
                </motion.div>}

              {/* STEP 2: Output Preview */}
              {activeStep === 2 && <motion.div key="output" variants={dofVariants} initial="enter" animate="center" exit="exit" className="absolute inset-0 p-6 sm:p-10 lg:p-12 flex flex-col justify-center z-[1]">
                  {/* format tabs */}
                  <motion.div initial={{
                opacity: 0,
                y: -8
              }} animate={{
                opacity: 1,
                y: 0
              }} transition={{
                duration: 0.7,
                delay: 0.15,
                ease: appleEase
              }} className="flex gap-1.5 mb-6">
                    {["One-Pager", "Script"].map((fmt, i) => <motion.span key={fmt} whileHover={{
                  scale: 1.04,
                  transition: appleFast
                }} className="text-sm cursor-pointer font-sans" style={{
                  fontWeight: i === 0 ? 600 : 400,
                  color: i === 0 ? "#f0edf6" : "rgba(240,237,246,0.3)",
                  padding: "10px 22px",
                  borderRadius: 12,
                  background: i === 0 ? "rgba(168,85,247,0.12)" : "transparent",
                  border: `1px solid ${i === 0 ? "rgba(168,85,247,0.2)" : "transparent"}`
                }}>
                        {fmt}
                      </motion.span>)}
                  </motion.div>

                  {/* output card */}
                  <motion.div initial={{
                opacity: 0,
                y: 20,
                scale: 0.97,
                filter: "blur(6px)"
              }} animate={{
                opacity: 1,
                y: 0,
                scale: 1,
                filter: "blur(0px)"
              }} transition={{
                duration: 0.85,
                delay: 0.2,
                ease: appleEase
              }} className="rounded-2xl overflow-hidden" style={{
                border: "1px solid rgba(168,85,247,0.12)",
                background: "rgba(8,6,16,0.5)"
              }}>
                    <div className="flex flex-col gap-1" style={{
                  padding: "22px 28px",
                  borderBottom: "1px solid rgba(168,85,247,0.08)"
                }}>
                      <h4 className="font-display text-xl text-foreground m-0 font-normal tracking-[-0.01em]">
                        Tiffany Design Interview
                      </h4>
                      <span className="text-xs font-sans" style={{ color: "rgba(240,237,246,0.25)" }}>
                        Design capability overview for hiring manager
                      </span>
                    </div>

                    <motion.div variants={outputStagger} initial="hidden" animate="visible">
                      {OUTPUT_SECTIONS.map((section, idx) => <motion.div key={section.title} variants={outputItem} style={{
                    padding: "20px 28px",
                    borderBottom: idx < OUTPUT_SECTIONS.length - 1 ? "1px solid rgba(168,85,247,0.05)" : "none"
                  }}>
                          <p className="text-[11px] font-medium uppercase tracking-[0.15em] m-0 mb-3 font-sans" style={{ color: "rgba(168,85,247,0.45)" }}>
                            {section.title}
                          </p>
                          <div className="space-y-2">
                            {section.points.map((point, pIdx) => (
                              <div key={pIdx} className="flex items-start gap-3">
                                <div className="w-[3px] rounded-full flex-shrink-0 mt-1" style={{
                                  height: 16,
                                  background: "linear-gradient(180deg, rgba(168,85,247,0.6), rgba(168,85,247,0.15))"
                                }} />
                                <p className="text-sm text-muted-foreground m-0 leading-[1.55] font-sans">{point.replace(/\*\*/g, '')}</p>
                              </div>
                            ))}
                          </div>
                        </motion.div>)}
                    </motion.div>
                  </motion.div>

                  {/* refine chips */}
                  <motion.div initial={{
                opacity: 0
              }} animate={{
                opacity: 1
              }} transition={{
                duration: 0.7,
                delay: 0.7,
                ease: appleEase
              }} className="flex gap-2.5 mt-5 flex-wrap">
                    {["Shorter", "Bolder", "Simpler", "Refine..."].map((chip, i) => <motion.span key={chip} initial={{
                  opacity: 0,
                  scale: 0.9
                }} animate={{
                  opacity: 1,
                  scale: 1
                }} transition={{
                  duration: 0.5,
                  delay: 0.75 + i * 0.06,
                  ease: appleEase
                }} whileHover={{
                  borderColor: "rgba(168,85,247,0.3)",
                  color: "rgba(240,237,246,0.65)",
                  scale: 1.05,
                  transition: appleFast
                }} className="text-sm cursor-pointer font-sans" style={{
                  color: "rgba(240,237,246,0.35)",
                  padding: "9px 20px",
                  borderRadius: 24,
                  border: "1px solid rgba(168,85,247,0.1)"
                }}>
                        {chip}
                      </motion.span>)}
                  </motion.div>
                </motion.div>}
            </AnimatePresence>
          </motion.div>
        </ParallaxLayer>
      </div>
    </section>;
}