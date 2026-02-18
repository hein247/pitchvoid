import { motion, useInView } from "framer-motion";
import { useRef } from "react";

const steps = [
  {
    num: 1,
    title: "Enhanced Landing",
    description:
      "Cleaner headline hierarchy with a single, compelling value proposition. Prominent CTA button with clear contrast. Simplified navigation that doesn't distract from the core action.",
    mockup: (
      <div className="rounded-lg border p-4 space-y-3" style={{ borderColor: "#E2E8F0", backgroundColor: "#FFFFFF" }}>
        <div className="h-2 w-20 rounded" style={{ backgroundColor: "#E2E8F0" }} />
        <div className="h-4 w-48 rounded" style={{ backgroundColor: "#1E3A8A" }} />
        <div className="h-3 w-64 rounded" style={{ backgroundColor: "#CBD5E1" }} />
        <div className="h-8 w-32 rounded-lg mt-2" style={{ backgroundColor: "#2DD4BF" }} />
      </div>
    ),
  },
  {
    num: 2,
    title: "Redesigned Input",
    description:
      "Larger, more inviting textarea with real-time character counter. Progress indicator showing AI readiness so users know when to hit generate. Better placeholder text as guidance.",
    mockup: (
      <div className="rounded-lg border p-4 space-y-2" style={{ borderColor: "#E2E8F0", backgroundColor: "#FFFFFF" }}>
        <div className="h-3 w-24 rounded" style={{ backgroundColor: "#CBD5E1" }} />
        <div className="rounded-lg border-2 p-3 h-20" style={{ borderColor: "#2DD4BF" }}>
          <div className="h-2 w-40 rounded mb-1.5" style={{ backgroundColor: "#E2E8F0" }} />
          <div className="h-2 w-32 rounded" style={{ backgroundColor: "#E2E8F0" }} />
        </div>
        <div className="flex justify-between items-center">
          <div className="h-2 w-16 rounded" style={{ backgroundColor: "#CBD5E1" }} />
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: "#2DD4BF" }} />
            <div className="h-2 w-12 rounded" style={{ backgroundColor: "#CBD5E1" }} />
          </div>
        </div>
      </div>
    ),
  },
  {
    num: 3,
    title: "Format Selection",
    description:
      "Side-by-side comparison cards with preview snippets showing what each format produces. Clearer differentiation between One-Pager and Script with example output.",
    mockup: (
      <div className="flex gap-3">
        {["One-Pager", "Script"].map((f) => (
          <div
            key={f}
            className="flex-1 rounded-lg border-2 p-3 space-y-2"
            style={{
              borderColor: f === "One-Pager" ? "#2DD4BF" : "#E2E8F0",
              backgroundColor: "#FFFFFF",
            }}
          >
            <div className="h-3 w-16 rounded" style={{ backgroundColor: f === "One-Pager" ? "#2DD4BF" : "#CBD5E1" }} />
            <div className="h-2 w-full rounded" style={{ backgroundColor: "#F1F5F9" }} />
            <div className="h-2 w-3/4 rounded" style={{ backgroundColor: "#F1F5F9" }} />
          </div>
        ))}
      </div>
    ),
  },
  {
    num: 4,
    title: "Processing Experience",
    description:
      "Transparent 3-phase progress bar (Analyzing → Structuring → Generating) with estimated time remaining. User's input remains visible so they feel in control.",
    mockup: (
      <div className="rounded-lg border p-4 space-y-3" style={{ borderColor: "#E2E8F0", backgroundColor: "#FFFFFF" }}>
        <div className="flex gap-2 items-center">
          {["Analyzing", "Structuring", "Generating"].map((phase, i) => (
            <div key={phase} className="flex items-center gap-1.5">
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold text-white"
                style={{ backgroundColor: i <= 1 ? "#2DD4BF" : "#CBD5E1" }}
              >
                {i + 1}
              </div>
              <span className="text-[10px]" style={{ color: i <= 1 ? "#1E3A8A" : "#94A3B8" }}>
                {phase}
              </span>
            </div>
          ))}
        </div>
        <div className="w-full h-2 rounded-full" style={{ backgroundColor: "#E2E8F0" }}>
          <div className="h-2 rounded-full w-2/3" style={{ backgroundColor: "#2DD4BF" }} />
        </div>
        <div className="h-2 w-20 rounded" style={{ backgroundColor: "#CBD5E1" }} />
      </div>
    ),
  },
  {
    num: 5,
    title: "Output View",
    description:
      "Split-screen concept: original input on the left, polished output on the right. Better editing tools and clearly visible export options. Quick-refine chips for one-tap adjustments.",
    mockup: (
      <div className="flex gap-2">
        <div className="flex-1 rounded-lg border p-3 space-y-2" style={{ borderColor: "#E2E8F0", backgroundColor: "#FEF9C3" }}>
          <div className="h-2 w-10 rounded" style={{ backgroundColor: "#F59E0B" }} />
          <div className="h-2 w-full rounded" style={{ backgroundColor: "#FDE68A" }} />
          <div className="h-2 w-3/4 rounded" style={{ backgroundColor: "#FDE68A" }} />
        </div>
        <div className="flex-1 rounded-lg border p-3 space-y-2" style={{ borderColor: "#2DD4BF", backgroundColor: "#F0FDFA" }}>
          <div className="h-2 w-10 rounded" style={{ backgroundColor: "#2DD4BF" }} />
          <div className="h-2 w-full rounded" style={{ backgroundColor: "#CCFBF1" }} />
          <div className="h-2 w-3/4 rounded" style={{ backgroundColor: "#CCFBF1" }} />
        </div>
      </div>
    ),
  },
];

const ProposedFlowSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} className="py-20 md:py-28 px-6 bg-white">
      <div className="max-w-[900px] mx-auto">
        <motion.p
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.5 }}
          className="text-xs tracking-[0.3em] uppercase font-semibold mb-4"
          style={{ color: "#2DD4BF", fontFamily: "Inter, system-ui, sans-serif" }}
        >
          Proposed Flow
        </motion.p>

        <motion.h2
          initial={{ opacity: 0, y: 15 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-2xl md:text-3xl font-bold mb-12"
          style={{ color: "#1E3A8A", fontFamily: "Inter, system-ui, sans-serif" }}
        >
          A clearer path from idea to output
        </motion.h2>

        <div className="space-y-8">
          {steps.map((step, i) => (
            <motion.div
              key={step.num}
              initial={{ opacity: 0, y: 25 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.15 + i * 0.1 }}
              className="grid md:grid-cols-2 gap-6 items-start rounded-xl border p-6"
              style={{ borderColor: "#E2E8F0" }}
            >
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <span
                    className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white"
                    style={{ backgroundColor: "#2DD4BF" }}
                  >
                    {step.num}
                  </span>
                  <h3
                    className="text-base font-semibold"
                    style={{ color: "#1E3A8A", fontFamily: "Inter, system-ui, sans-serif" }}
                  >
                    {step.title}
                  </h3>
                </div>
                <p className="text-sm leading-relaxed" style={{ color: "#64748B" }}>
                  {step.description}
                </p>
              </div>
              <div>{step.mockup}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProposedFlowSection;
