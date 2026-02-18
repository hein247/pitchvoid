import { motion, useInView } from "framer-motion";
import { useRef } from "react";

const designs = [
  {
    title: "Redesigned Landing Page",
    rationale: "Clear value proposition with prominent CTA. Simplified navigation removes cognitive load so users focus on the core action: describing their pitch.",
    mockup: (
      <div className="w-full p-6 md:p-10 flex flex-col items-center gap-3" style={{ backgroundColor: "#FAFFFE" }}>
        <div className="h-2 w-14 rounded" style={{ backgroundColor: "#2DD4BF" }} />
        <div className="h-4 w-60 rounded" style={{ backgroundColor: "#1E3A8A" }} />
        <div className="h-2 w-72 max-w-full rounded" style={{ backgroundColor: "#CBD5E1" }} />
        <div className="h-20 w-full max-w-xs rounded-xl border-2 mt-2" style={{ borderColor: "#E2E8F0" }}>
          <div className="p-3 space-y-1.5">
            <div className="h-1.5 w-3/4 rounded" style={{ backgroundColor: "#E2E8F0" }} />
            <div className="h-1.5 w-1/2 rounded" style={{ backgroundColor: "#E2E8F0" }} />
          </div>
        </div>
        <div className="h-8 w-32 rounded-lg mt-1" style={{ backgroundColor: "#2DD4BF" }} />
      </div>
    ),
  },
  {
    title: "Enhanced Input Experience",
    rationale: "Larger textarea with real-time character counter and AI readiness indicator. Users see exactly when their input is rich enough to generate quality output.",
    mockup: (
      <div className="w-full p-6 md:p-10" style={{ backgroundColor: "#FFFFFF" }}>
        <div className="max-w-xs mx-auto space-y-2">
          <div className="h-2 w-20 rounded" style={{ backgroundColor: "#1E3A8A" }} />
          <div className="rounded-xl border-2 p-4 h-28" style={{ borderColor: "#2DD4BF" }}>
            <div className="space-y-1.5">
              <div className="h-1.5 w-full rounded" style={{ backgroundColor: "#E2E8F0" }} />
              <div className="h-1.5 w-3/4 rounded" style={{ backgroundColor: "#E2E8F0" }} />
              <div className="h-1.5 w-1/2 rounded" style={{ backgroundColor: "#E2E8F0" }} />
            </div>
          </div>
          <div className="flex justify-between items-center">
            <div className="h-1.5 w-10 rounded" style={{ backgroundColor: "#CBD5E1" }} />
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: "#2DD4BF" }} />
              <div className="h-1.5 w-10 rounded" style={{ backgroundColor: "#2DD4BF" }} />
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    title: "Improved Output Comparison",
    rationale: "Split-screen view shows original input alongside the polished output. Users can validate the AI's work and make quick edits with inline refinement chips.",
    mockup: (
      <div className="w-full p-6 md:p-10 flex gap-3" style={{ backgroundColor: "#FFFFFF" }}>
        <div className="flex-1 rounded-lg p-3 space-y-2" style={{ backgroundColor: "#FEF9C3" }}>
          <div className="h-2 w-8 rounded" style={{ backgroundColor: "#F59E0B" }} />
          <div className="h-1.5 w-full rounded" style={{ backgroundColor: "#FDE68A" }} />
          <div className="h-1.5 w-3/4 rounded" style={{ backgroundColor: "#FDE68A" }} />
          <div className="h-1.5 w-1/2 rounded" style={{ backgroundColor: "#FDE68A" }} />
        </div>
        <div className="flex-1 rounded-lg p-3 space-y-2" style={{ backgroundColor: "#F0FDFA" }}>
          <div className="h-2 w-8 rounded" style={{ backgroundColor: "#2DD4BF" }} />
          <div className="h-1.5 w-full rounded" style={{ backgroundColor: "#CCFBF1" }} />
          <div className="h-1.5 w-3/4 rounded" style={{ backgroundColor: "#CCFBF1" }} />
          <div className="h-1.5 w-1/2 rounded" style={{ backgroundColor: "#CCFBF1" }} />
        </div>
      </div>
    ),
  },
];

const FinalDesignsSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} className="py-24 md:py-32 px-6 bg-white">
      <div className="max-w-[900px] mx-auto">
        <motion.p
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.5 }}
          className="text-[10px] tracking-[0.3em] uppercase font-semibold mb-4"
          style={{ color: "#2DD4BF" }}
        >
          Final Designs
        </motion.p>

        <motion.h2
          initial={{ opacity: 0, y: 15 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-2xl md:text-3xl font-bold mb-12"
          style={{ color: "#0F172A" }}
        >
          Polished screens with rationale
        </motion.h2>

        <div className="space-y-12">
          {designs.map((d, i) => (
            <motion.div
              key={d.title}
              initial={{ opacity: 0, y: 25 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.15 + i * 0.1 }}
              className="rounded-2xl border overflow-hidden"
              style={{ borderColor: "#E2E8F0" }}
            >
              <div className="aspect-[16/9] flex items-center justify-center" style={{ backgroundColor: "#F8FAFC" }}>
                {d.mockup}
              </div>
              <div className="p-6">
                <h3 className="text-sm font-bold mb-2" style={{ color: "#0F172A" }}>{d.title}</h3>
                <p className="text-xs leading-relaxed" style={{ color: "#64748B" }}>{d.rationale}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FinalDesignsSection;
