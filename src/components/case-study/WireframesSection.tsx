import { motion, useInView } from "framer-motion";
import { useRef } from "react";

const LoFiFrame = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="rounded-xl border-2 border-dashed border-border p-5 bg-[hsl(270,10%,7%)]">
    <p className="text-[10px] tracking-[0.2em] uppercase mb-3 text-muted-foreground">
      {title}
    </p>
    {children}
  </div>
);

const MidFiFrame = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="rounded-2xl border border-border p-5 shadow-sm glassmorphism">
    <p className="text-[10px] tracking-[0.2em] uppercase mb-3 text-primary">
      {title}
    </p>
    {children}
  </div>
);

const WireframesSection = () => {
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
            03 // Wireframes
          </p>
          <h2 className="text-3xl md:text-4xl font-display mb-4 text-foreground">
            Lo-fi → Mid-fi exploration
          </h2>
          <p className="text-base text-muted-foreground">
            Progression from rough structure to refined layouts.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="mb-12"
        >
          <p className="text-sm font-semibold mb-4 text-foreground">
            Lo-fi: Structure & Layout
          </p>
          <div className="grid md:grid-cols-3 gap-4">
            <LoFiFrame title="Landing Page">
              <div className="space-y-2">
                <div className="h-3 rounded bg-muted-foreground/30" style={{ width: "60%" }} />
                <div className="h-2 rounded bg-muted-foreground/15" style={{ width: "80%" }} />
                <div className="h-2 rounded bg-muted-foreground/15" style={{ width: "40%" }} />
                <div className="mt-4 h-10 rounded-lg bg-muted-foreground/20" style={{ width: "45%" }} />
              </div>
            </LoFiFrame>
            <LoFiFrame title="Describe Input">
              <div className="space-y-2">
                <div className="h-20 rounded-lg border-2 border-dashed border-muted-foreground/20" />
                <div className="flex gap-2">
                  <div className="h-6 rounded-full flex-1 bg-muted-foreground/15" />
                  <div className="h-6 rounded-full flex-1 bg-muted-foreground/15" />
                  <div className="h-6 rounded-full flex-1 bg-muted-foreground/15" />
                </div>
                <div className="h-8 rounded mt-2 bg-muted-foreground/20" style={{ width: "35%" }} />
              </div>
            </LoFiFrame>
            <LoFiFrame title="Output View">
              <div className="space-y-2">
                <div className="flex gap-2 mb-3">
                  <div className="h-6 rounded flex-1 bg-muted-foreground/30" />
                  <div className="h-6 rounded flex-1 bg-muted-foreground/15" />
                </div>
                <div className="h-24 rounded-lg bg-muted-foreground/15" />
                <div className="h-8 rounded mt-2 bg-muted-foreground/15" />
              </div>
            </LoFiFrame>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <p className="text-sm font-semibold mb-4 text-foreground">
            Mid-fi: Refined with hierarchy & interactions
          </p>
          <div className="grid md:grid-cols-2 gap-6">
            <MidFiFrame title="Dashboard // Projects List">
              <div className="space-y-3">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="flex items-center gap-3 p-3 rounded-xl border border-border">
                    <div className="w-10 h-10 rounded-lg shrink-0 bg-primary/20" />
                    <div className="flex-1">
                      <div className="h-2.5 rounded mb-1 bg-foreground/40" style={{ width: "55%" }} />
                      <div className="h-2 rounded bg-muted-foreground/30" style={{ width: "35%" }} />
                    </div>
                    <div className="h-6 w-14 rounded-full bg-muted-foreground/10" />
                  </div>
                ))}
                <div className="h-11 rounded-xl flex items-center justify-center text-sm font-medium brand-gradient text-primary-foreground">
                  + New Pitch
                </div>
              </div>
            </MidFiFrame>
            <MidFiFrame title="Generation Flow // Quick Tune">
              <div className="space-y-4">
                <div>
                  <p className="text-[11px] font-medium mb-2 text-muted-foreground">Length</p>
                  <div className="flex gap-2">
                    {["Quick", "Standard", "Detailed"].map((l, i) => (
                      <div
                        key={l}
                        className={`flex-1 h-9 rounded-lg flex items-center justify-center text-xs font-medium border ${
                          i === 1
                            ? "brand-gradient text-primary-foreground border-transparent"
                            : "border-border text-muted-foreground"
                        }`}
                      >
                        {l}
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-[11px] font-medium mb-2 text-muted-foreground">Format</p>
                  <div className="flex gap-2">
                    {["One-Pager", "Script"].map((f, i) => (
                      <div
                        key={f}
                        className={`flex-1 h-9 rounded-lg flex items-center justify-center text-xs font-medium border ${
                          i === 0
                            ? "bg-primary/15 text-primary border-primary/30"
                            : "border-border text-muted-foreground"
                        }`}
                      >
                        {f}
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-[11px] font-medium mb-2 text-muted-foreground">Tone</p>
                  <div className="h-2 rounded-full bg-muted-foreground/15">
                    <div className="h-2 rounded-full bg-primary" style={{ width: "60%" }} />
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-[10px] text-muted-foreground">Humble</span>
                    <span className="text-[10px] text-muted-foreground">Bold</span>
                  </div>
                </div>
              </div>
            </MidFiFrame>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default WireframesSection;
