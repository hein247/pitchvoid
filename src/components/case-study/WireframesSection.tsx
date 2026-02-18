import { motion, useInView } from "framer-motion";
import { useRef } from "react";

const LoFiFrame = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="rounded-xl border-2 border-dashed p-5" style={{ borderColor: "#CBD5E1", background: "#F8FAFC" }}>
    <p className="text-[10px] tracking-[0.2em] uppercase mb-3" style={{ color: "#94A3B8" }}>
      {title}
    </p>
    {children}
  </div>
);

const MidFiFrame = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="rounded-2xl border p-5 shadow-sm" style={{ borderColor: "#E2E8F0", background: "#FFFFFF" }}>
    <p className="text-[10px] tracking-[0.2em] uppercase mb-3" style={{ color: "#2DD4BF" }}>
      {title}
    </p>
    {children}
  </div>
);

const WireframesSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} className="py-20 md:py-28 px-6" style={{ background: "#F8FAFC" }}>
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="mb-16"
        >
          <p className="text-xs tracking-[0.3em] uppercase mb-4" style={{ color: "#2DD4BF" }}>
            03 — Wireframes
          </p>
          <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: "#0F172A" }}>
            Lo-fi → Mid-fi exploration
          </h2>
          <p className="text-base" style={{ color: "#64748B" }}>
            Progression from rough structure to refined layouts.
          </p>
        </motion.div>

        {/* Lo-fi wireframes */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="mb-12"
        >
          <p className="text-sm font-semibold mb-4" style={{ color: "#0F172A" }}>
            Lo-fi: Structure & Layout
          </p>
          <div className="grid md:grid-cols-3 gap-4">
            <LoFiFrame title="Landing Page">
              <div className="space-y-2">
                <div className="h-3 rounded" style={{ background: "#CBD5E1", width: "60%" }} />
                <div className="h-2 rounded" style={{ background: "#E2E8F0", width: "80%" }} />
                <div className="h-2 rounded" style={{ background: "#E2E8F0", width: "40%" }} />
                <div className="mt-4 h-10 rounded-lg" style={{ background: "#CBD5E1", width: "45%" }} />
              </div>
            </LoFiFrame>
            <LoFiFrame title="Describe Input">
              <div className="space-y-2">
                <div className="h-20 rounded-lg border-2 border-dashed" style={{ borderColor: "#CBD5E1" }} />
                <div className="flex gap-2">
                  <div className="h-6 rounded-full flex-1" style={{ background: "#E2E8F0" }} />
                  <div className="h-6 rounded-full flex-1" style={{ background: "#E2E8F0" }} />
                  <div className="h-6 rounded-full flex-1" style={{ background: "#E2E8F0" }} />
                </div>
                <div className="h-8 rounded mt-2" style={{ background: "#CBD5E1", width: "35%" }} />
              </div>
            </LoFiFrame>
            <LoFiFrame title="Output View">
              <div className="space-y-2">
                <div className="flex gap-2 mb-3">
                  <div className="h-6 rounded flex-1" style={{ background: "#CBD5E1" }} />
                  <div className="h-6 rounded flex-1" style={{ background: "#E2E8F0" }} />
                </div>
                <div className="h-24 rounded-lg" style={{ background: "#E2E8F0" }} />
                <div className="h-8 rounded mt-2" style={{ background: "#E2E8F0" }} />
              </div>
            </LoFiFrame>
          </div>
        </motion.div>

        {/* Mid-fi wireframes */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <p className="text-sm font-semibold mb-4" style={{ color: "#0F172A" }}>
            Mid-fi: Refined with hierarchy & interactions
          </p>
          <div className="grid md:grid-cols-2 gap-6">
            <MidFiFrame title="Dashboard — Projects List">
              <div className="space-y-3">
                {[1, 2, 3].map((n) => (
                  <div
                    key={n}
                    className="flex items-center gap-3 p-3 rounded-xl border"
                    style={{ borderColor: "#F1F5F9" }}
                  >
                    <div className="w-10 h-10 rounded-lg shrink-0" style={{ background: `hsl(${170 + n * 30}, 50%, 90%)` }} />
                    <div className="flex-1">
                      <div className="h-2.5 rounded mb-1" style={{ background: "#CBD5E1", width: "55%" }} />
                      <div className="h-2 rounded" style={{ background: "#E2E8F0", width: "35%" }} />
                    </div>
                    <div className="h-6 w-14 rounded-full" style={{ background: "#F1F5F9" }} />
                  </div>
                ))}
                <div
                  className="h-11 rounded-xl flex items-center justify-center text-sm font-medium"
                  style={{ background: "#0F172A", color: "#FFFFFF" }}
                >
                  + New Pitch
                </div>
              </div>
            </MidFiFrame>
            <MidFiFrame title="Generation Flow — Quick Tune">
              <div className="space-y-4">
                <div>
                  <p className="text-[11px] font-medium mb-2" style={{ color: "#64748B" }}>Length</p>
                  <div className="flex gap-2">
                    {["Quick", "Standard", "Detailed"].map((l, i) => (
                      <div
                        key={l}
                        className="flex-1 h-9 rounded-lg flex items-center justify-center text-xs font-medium border"
                        style={{
                          background: i === 1 ? "#0F172A" : "#FFFFFF",
                          color: i === 1 ? "#FFFFFF" : "#64748B",
                          borderColor: i === 1 ? "#0F172A" : "#E2E8F0",
                        }}
                      >
                        {l}
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-[11px] font-medium mb-2" style={{ color: "#64748B" }}>Format</p>
                  <div className="flex gap-2">
                    {["One-Pager", "Script"].map((f, i) => (
                      <div
                        key={f}
                        className="flex-1 h-9 rounded-lg flex items-center justify-center text-xs font-medium border"
                        style={{
                          background: i === 0 ? "#F0FDFA" : "#FFFFFF",
                          color: i === 0 ? "#0D9488" : "#64748B",
                          borderColor: i === 0 ? "#99F6E4" : "#E2E8F0",
                        }}
                      >
                        {f}
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-[11px] font-medium mb-2" style={{ color: "#64748B" }}>Tone</p>
                  <div className="h-2 rounded-full" style={{ background: "#E2E8F0" }}>
                    <div className="h-2 rounded-full" style={{ background: "#2DD4BF", width: "60%" }} />
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-[10px]" style={{ color: "#94A3B8" }}>Humble</span>
                    <span className="text-[10px]" style={{ color: "#94A3B8" }}>Bold</span>
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
