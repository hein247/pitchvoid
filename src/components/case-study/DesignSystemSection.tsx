import { motion, useInView } from "framer-motion";
import { useRef } from "react";

const colors = [
  { name: "Teal", hex: "#2DD4BF", rationale: "Clarity and transformation" },
  { name: "Deep Blue", hex: "#1E3A8A", rationale: "Trust and professionalism" },
  { name: "Gold", hex: "#F59E0B", rationale: "Refinement and value" },
];

const components = [
  {
    label: "Primary Button",
    el: (
      <div className="h-9 px-5 rounded-lg flex items-center justify-center text-xs font-semibold text-white" style={{ backgroundColor: "#2DD4BF" }}>
        Get Started
      </div>
    ),
  },
  {
    label: "Secondary Button",
    el: (
      <div className="h-9 px-5 rounded-lg flex items-center justify-center text-xs font-semibold border" style={{ borderColor: "#E2E8F0", color: "#334155" }}>
        Learn More
      </div>
    ),
  },
  {
    label: "Input Field",
    el: (
      <div className="h-9 px-3 rounded-lg border-2 flex items-center text-xs" style={{ borderColor: "#2DD4BF", color: "#94A3B8" }}>
        Type your pitch idea...
      </div>
    ),
  },
  {
    label: "Card",
    el: (
      <div className="rounded-lg border p-3 space-y-1.5" style={{ borderColor: "#E2E8F0" }}>
        <div className="h-2 w-16 rounded" style={{ backgroundColor: "#1E3A8A" }} />
        <div className="h-1.5 w-full rounded" style={{ backgroundColor: "#E2E8F0" }} />
        <div className="h-1.5 w-3/4 rounded" style={{ backgroundColor: "#E2E8F0" }} />
      </div>
    ),
  },
  {
    label: "Loading State",
    el: (
      <div className="space-y-2">
        <div className="w-full h-1.5 rounded-full" style={{ backgroundColor: "#E2E8F0" }}>
          <div className="h-1.5 rounded-full w-3/5" style={{ backgroundColor: "#2DD4BF" }} />
        </div>
        <div className="text-[10px]" style={{ color: "#94A3B8" }}>Generating...</div>
      </div>
    ),
  },
  {
    label: "Badge",
    el: (
      <div className="inline-flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-full" style={{ backgroundColor: "#F0FDFA", color: "#2DD4BF" }}>
        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "#2DD4BF" }} />
        AI Ready
      </div>
    ),
  },
];

const DesignSystemSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} className="py-24 md:py-32 px-6" style={{ backgroundColor: "#F8FAFC" }}>
      <div className="max-w-[900px] mx-auto">
        <motion.p
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.5 }}
          className="text-[10px] tracking-[0.3em] uppercase font-semibold mb-4"
          style={{ color: "#2DD4BF" }}
        >
          Design System
        </motion.p>

        <motion.h2
          initial={{ opacity: 0, y: 15 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-2xl md:text-3xl font-bold mb-12"
          style={{ color: "#0F172A" }}
        >
          Building blocks
        </motion.h2>

        {/* Colors */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="mb-12"
        >
          <h3 className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: "#64748B" }}>
            Colors
          </h3>
          <div className="grid grid-cols-3 gap-4">
            {colors.map((c) => (
              <div key={c.hex} className="rounded-xl border overflow-hidden" style={{ borderColor: "#E2E8F0" }}>
                <div className="h-20" style={{ backgroundColor: c.hex }} />
                <div className="p-3 bg-white">
                  <p className="text-xs font-semibold" style={{ color: "#0F172A" }}>{c.name}</p>
                  <p className="text-[10px] font-mono" style={{ color: "#94A3B8" }}>{c.hex}</p>
                  <p className="text-[10px] mt-1" style={{ color: "#64748B" }}>{c.rationale}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Typography */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-12"
        >
          <h3 className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: "#64748B" }}>
            Typography
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="rounded-xl border p-5 bg-white" style={{ borderColor: "#E2E8F0" }}>
              <p className="text-2xl font-bold mb-1" style={{ color: "#0F172A", fontFamily: "Inter, sans-serif" }}>
                Inter
              </p>
              <p className="text-[10px] uppercase tracking-wider font-semibold mb-2" style={{ color: "#2DD4BF" }}>
                Headings
              </p>
              <p className="text-xs" style={{ color: "#64748B" }}>
                Clean, modern, professional
              </p>
            </div>
            <div className="rounded-xl border p-5 bg-white" style={{ borderColor: "#E2E8F0" }}>
              <p className="text-2xl font-bold mb-1" style={{ color: "#0F172A", fontFamily: "system-ui, sans-serif" }}>
                System UI
              </p>
              <p className="text-[10px] uppercase tracking-wider font-semibold mb-2" style={{ color: "#2DD4BF" }}>
                Body
              </p>
              <p className="text-xs" style={{ color: "#64748B" }}>
                Familiar, accessible, readable
              </p>
            </div>
          </div>
        </motion.div>

        {/* Component Library */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.25 }}
        >
          <h3 className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: "#64748B" }}>
            Component Library
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {components.map((c) => (
              <div key={c.label} className="rounded-xl border p-4 bg-white" style={{ borderColor: "#E2E8F0" }}>
                <div className="mb-3">{c.el}</div>
                <p className="text-[10px] font-medium" style={{ color: "#94A3B8" }}>{c.label}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default DesignSystemSection;
