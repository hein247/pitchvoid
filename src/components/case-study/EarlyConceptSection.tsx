import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { ArrowDown, FileText, StickyNote, Presentation, FileCheck } from "lucide-react";

const EarlyConceptSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  const stickyNotes = [
    { text: "8.5s avg attention span", rotate: -4, color: "bg-yellow-400/80" },
    { text: "73% feel overstimulated daily", rotate: 3, color: "bg-pink-400/70" },
    { text: "ChatGPT writes but doesn't structure", rotate: -2, color: "bg-blue-400/70" },
    { text: "too many tabs open rn", rotate: 5, color: "bg-orange-400/70" },
    { text: "pitch meeting in 2 hours", rotate: -3, color: "bg-green-400/70" },
    { text: "AI fatigue is real", rotate: 2, color: "bg-purple-400/70" },
    { text: "doom-scrolled instead of prepping", rotate: -5, color: "bg-red-400/70" },
    { text: "40% of workers use AI for work", rotate: 4, color: "bg-teal-400/70" },
    { text: "copy-pasted from 5 different docs", rotate: -2, color: "bg-amber-400/80" },
    { text: "info overload = decision paralysis", rotate: 3, color: "bg-indigo-400/70" },
    { text: "need narrative, not bullet points", rotate: -4, color: "bg-rose-400/70" },
    { text: "great idea, zero structure", rotate: 2, color: "bg-cyan-400/70" },
  ];

  return (
    <section ref={ref} className="py-20 md:py-28 px-6 bg-[hsl(270,10%,7%)]">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="mb-16"
        >
          <p className="text-xs tracking-[0.3em] uppercase mb-4 text-primary">
            01 // Early Concept
          </p>
          <h2 className="text-3xl md:text-4xl font-display mb-4 text-foreground">
            Where it started
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-[40%_1fr] gap-10 md:gap-14 items-start">
          {/* Left — Text */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.15 }}
          >
            <p className="text-base md:text-lg leading-relaxed text-muted-foreground mb-6">
              We live in an era of overstimulation. The average attention span has dropped to 8.5 seconds, 73% of knowledge workers report feeling mentally overloaded, and despite having AI tools everywhere, people still struggle to turn scattered thoughts into a clear narrative.
            </p>
            <ul className="space-y-3 mb-6">
              {[
                { icon: <Presentation className="w-4 h-4" />, label: "Pitching an idea with zero prep time" },
                { icon: <FileText className="w-4 h-4" />, label: "Summarizing weeks of research into one page" },
                { icon: <FileCheck className="w-4 h-4" />, label: "Presenting with confidence, not chaos" },
              ].map((item) => (
                <li key={item.label} className="flex items-center gap-3 text-foreground/90">
                  <span className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    {item.icon}
                  </span>
                  <span className="text-sm md:text-base">{item.label}</span>
                </li>
              ))}
            </ul>
            <p className="text-base md:text-lg leading-relaxed text-muted-foreground">
              AI can generate text, but it doesn't think about your audience, your story, or your structure. That gap is where PitchVoid started.
            </p>
          </motion.div>

          {/* Right — Visual: Chaos → Clarity */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col items-center gap-6"
          >
            {/* Chaos */}
            <div className="relative w-full rounded-2xl border border-border bg-background/40 overflow-hidden p-4">
              <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground/60 mb-3">Chaos</p>
              <div className="grid grid-cols-3 gap-2">
                {stickyNotes.map((note, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.7 }}
                    animate={isInView ? { opacity: 1, scale: 1 } : {}}
                    transition={{ duration: 0.4, delay: 0.4 + i * 0.06 }}
                    className={`${note.color} text-black/80 text-[10px] md:text-xs font-medium px-3 py-2 rounded shadow-md`}
                    style={{ transform: `rotate(${note.rotate}deg)` }}
                  >
                    {note.text}
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Arrow */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: 0.9 }}
              className="flex flex-col items-center gap-1 text-primary"
            >
              <ArrowDown className="w-6 h-6" />
              <span className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground/60">PitchVoid</span>
            </motion.div>

            {/* Clarity */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={isInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.5, delay: 1.0 }}
              className="w-full rounded-2xl border border-border bg-background/60 p-5 space-y-3"
            >
              <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground/60 mb-1">Clarity</p>
              <div className="space-y-2">
                <div className="h-3 w-3/4 rounded bg-primary/30" />
                <div className="h-2 w-full rounded bg-muted-foreground/15" />
                <div className="h-2 w-full rounded bg-muted-foreground/15" />
                <div className="h-2 w-5/6 rounded bg-muted-foreground/15" />
              </div>
              <div className="flex gap-2 pt-2">
                <div className="h-7 w-20 rounded-lg bg-primary/20 flex items-center justify-center">
                  <span className="text-[9px] text-primary font-medium">Slide 1</span>
                </div>
                <div className="h-7 w-20 rounded-lg bg-primary/10 flex items-center justify-center">
                  <span className="text-[9px] text-muted-foreground font-medium">Slide 2</span>
                </div>
                <div className="h-7 w-20 rounded-lg bg-primary/10 flex items-center justify-center">
                  <span className="text-[9px] text-muted-foreground font-medium">Slide 3</span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default EarlyConceptSection;
