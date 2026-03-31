import { motion, useInView } from "framer-motion";
import { useRef } from "react";

const ComponentsSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

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
            05 // Component System
          </p>
          <h2 className="text-3xl md:text-4xl font-display mb-4 text-foreground">
            Building blocks
          </h2>
          <p className="text-base text-muted-foreground">
            Reusable components that make up PitchVoid's interface.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="rounded-2xl border border-border overflow-hidden"
          >
            <div className="px-5 py-3 border-b border-border bg-background">
              <p className="text-xs font-semibold text-foreground">Buttons</p>
            </div>
            <div className="p-6 flex flex-wrap gap-3 bg-background">
              <button className="px-5 py-2.5 rounded-xl text-sm font-medium brand-gradient text-primary-foreground">
                Primary CTA
              </button>
              <button className="px-5 py-2.5 rounded-xl text-sm font-medium border border-border text-foreground bg-transparent">
                Secondary
              </button>
              <button className="px-4 py-2 rounded-lg text-xs bg-accent/15 text-muted-foreground">
                Ghost
              </button>
            </div>
          </motion.div>

          {/* Project Card */}
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="rounded-2xl border border-border overflow-hidden"
          >
            <div className="px-5 py-3 border-b border-border bg-background">
              <p className="text-xs font-semibold text-foreground">Project Card</p>
            </div>
            <div className="p-6 bg-background">
              <div className="project-card p-4 rounded-xl">
                <div className="h-2.5 rounded mb-2 bg-foreground/80" style={{ width: "60%" }} />
                <div className="h-2 rounded mb-3 bg-muted-foreground/40" style={{ width: "40%" }} />
                <div className="flex gap-2">
                  <span className="px-2 py-1 rounded text-[10px] bg-accent/20 text-muted-foreground">
                    One-Pager
                  </span>
                  <span className="px-2 py-1 rounded text-[10px] bg-primary/10 text-primary">
                    Draft
                  </span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Input & Chips */}
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="rounded-2xl border border-border overflow-hidden"
          >
            <div className="px-5 py-3 border-b border-border bg-background">
              <p className="text-xs font-semibold text-foreground">Input & Chips</p>
            </div>
            <div className="p-6 bg-background">
              <div className="input-field rounded-xl p-3 mb-3">
                <p className="text-sm text-muted-foreground">Describe your pitch scenario...</p>
              </div>
              <div className="flex gap-2 flex-wrap">
                {["Make it shorter", "More data", "Bolder tone"].map((chip) => (
                  <span
                    key={chip}
                    className="px-3 py-1.5 rounded-full text-xs border border-border text-foreground"
                  >
                    {chip}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Color Palette */}
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.25 }}
            className="rounded-2xl border border-border overflow-hidden"
          >
            <div className="px-5 py-3 border-b border-border bg-background">
              <p className="text-xs font-semibold text-foreground">Color Palette</p>
            </div>
            <div className="p-6 grid grid-cols-4 gap-3 bg-background">
              {[
                { name: "Background", cls: "bg-background" },
                { name: "Surface", cls: "bg-[hsl(270,10%,7%)]" },
                { name: "Primary", cls: "bg-primary" },
                { name: "Accent", cls: "bg-accent" },
                { name: "Foreground", cls: "bg-foreground" },
                { name: "Muted", cls: "bg-muted-foreground" },
                { name: "Border", cls: "bg-border" },
                { name: "Destructive", cls: "bg-destructive" },
              ].map((c) => (
                <div key={c.name} className="text-center">
                  <div className={`w-full aspect-square rounded-xl mb-2 border border-border ${c.cls}`} />
                  <p className="text-[10px] text-muted-foreground">{c.name}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default ComponentsSection;
