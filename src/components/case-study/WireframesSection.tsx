import { motion, useInView } from "framer-motion";
import { useRef } from "react";

const wireframes = [
  {
    label: "Landing Page",
    caption: "Before research → After iterations",
    content: (
      <div className="space-y-3 p-5">
        <div className="h-2 w-16 rounded" style={{ backgroundColor: "#CBD5E1" }} />
        <div className="h-4 w-48 rounded" style={{ backgroundColor: "#94A3B8" }} />
        <div className="h-2 w-full rounded" style={{ backgroundColor: "#E2E8F0" }} />
        <div className="h-2 w-3/4 rounded" style={{ backgroundColor: "#E2E8F0" }} />
        <div className="h-8 w-28 rounded-lg mt-3" style={{ backgroundColor: "#94A3B8" }} />
      </div>
    ),
  },
  {
    label: "Format Selection",
    caption: "Before research → After iterations",
    content: (
      <div className="flex gap-3 p-5">
        {[1, 2].map((n) => (
          <div key={n} className="flex-1 rounded-lg p-3 space-y-2" style={{ border: "2px solid #CBD5E1" }}>
            <div className="h-3 w-14 rounded" style={{ backgroundColor: "#94A3B8" }} />
            <div className="h-2 w-full rounded" style={{ backgroundColor: "#E2E8F0" }} />
            <div className="h-2 w-2/3 rounded" style={{ backgroundColor: "#E2E8F0" }} />
          </div>
        ))}
      </div>
    ),
  },
  {
    label: "Output Comparison",
    caption: "Before research → After iterations",
    content: (
      <div className="flex gap-3 p-5">
        <div className="flex-1 rounded-lg p-3 space-y-2" style={{ backgroundColor: "#F1F5F9" }}>
          <div className="h-2 w-10 rounded" style={{ backgroundColor: "#CBD5E1" }} />
          <div className="h-2 w-full rounded" style={{ backgroundColor: "#E2E8F0" }} />
          <div className="h-2 w-3/4 rounded" style={{ backgroundColor: "#E2E8F0" }} />
        </div>
        <div className="flex-1 rounded-lg p-3 space-y-2" style={{ backgroundColor: "#F0FDFA" }}>
          <div className="h-2 w-10 rounded" style={{ backgroundColor: "#2DD4BF" }} />
          <div className="h-2 w-full rounded" style={{ backgroundColor: "#CCFBF1" }} />
          <div className="h-2 w-3/4 rounded" style={{ backgroundColor: "#CCFBF1" }} />
        </div>
      </div>
    ),
  },
];

const WireframesSection = () => {
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
          Wireframes
        </motion.p>

        <motion.h2
          initial={{ opacity: 0, y: 15 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-2xl md:text-3xl font-bold mb-12"
          style={{ color: "#0F172A" }}
        >
          From sketches to structure
        </motion.h2>

        <div className="grid md:grid-cols-3 gap-6">
          {wireframes.map((w, i) => (
            <motion.div
              key={w.label}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.15 + i * 0.08 }}
              className="rounded-xl border overflow-hidden"
              style={{ borderColor: "#E2E8F0" }}
            >
              <div className="aspect-[4/3] flex items-center justify-center" style={{ backgroundColor: "#F8FAFC" }}>
                {w.content}
              </div>
              <div className="p-4">
                <p className="text-sm font-semibold" style={{ color: "#0F172A" }}>{w.label}</p>
                <p className="text-[11px] mt-1" style={{ color: "#94A3B8" }}>{w.caption}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WireframesSection;
