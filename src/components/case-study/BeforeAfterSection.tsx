import { motion, useInView } from "framer-motion";
import { useRef } from "react";

const BeforeAfterSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} className="py-20 md:py-28 px-6" style={{ backgroundColor: "#F8FAFC" }}>
      <div className="max-w-[900px] mx-auto">
        <motion.p
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.5 }}
          className="text-xs tracking-[0.3em] uppercase font-semibold mb-4"
          style={{ color: "#2DD4BF", fontFamily: "Inter, system-ui, sans-serif" }}
        >
          Comparison
        </motion.p>

        <motion.h2
          initial={{ opacity: 0, y: 15 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-2xl md:text-3xl font-bold mb-12"
          style={{ color: "#1E3A8A", fontFamily: "Inter, system-ui, sans-serif" }}
        >
          Before vs After
        </motion.h2>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Before */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="rounded-xl p-6 border"
            style={{ backgroundColor: "#1a1625", borderColor: "#2d2640" }}
          >
            <span
              className="inline-block text-[10px] uppercase tracking-wider font-semibold px-2 py-1 rounded mb-4"
              style={{ backgroundColor: "#2d2640", color: "#a78bfa" }}
            >
              Current
            </span>
            <div className="space-y-3">
              <div className="h-3 w-32 rounded" style={{ backgroundColor: "#2d2640" }} />
              <div className="h-2 w-full rounded" style={{ backgroundColor: "#2d2640" }} />
              <div className="h-2 w-3/4 rounded" style={{ backgroundColor: "#2d2640" }} />
              <div className="h-8 w-28 rounded-lg mt-2" style={{ backgroundColor: "#7c3aed" }} />
              <div className="h-20 w-full rounded-lg mt-3 border" style={{ borderColor: "#2d2640", backgroundColor: "#130f1e" }} />
            </div>
            <ul className="mt-5 space-y-2 text-xs" style={{ color: "#94A3B8" }}>
              <li>• Dark theme reduces readability for text-heavy tasks</li>
              <li>• Small input area doesn't invite detailed descriptions</li>
              <li>• No progress feedback during generation</li>
              <li>• Format differences unclear before selection</li>
            </ul>
          </motion.div>

          {/* After */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="rounded-xl p-6 border bg-white"
            style={{ borderColor: "#E2E8F0" }}
          >
            <span
              className="inline-block text-[10px] uppercase tracking-wider font-semibold px-2 py-1 rounded mb-4"
              style={{ backgroundColor: "#F0FDFA", color: "#2DD4BF" }}
            >
              Proposed
            </span>
            <div className="space-y-3">
              <div className="h-3 w-32 rounded" style={{ backgroundColor: "#1E3A8A" }} />
              <div className="h-2 w-full rounded" style={{ backgroundColor: "#E2E8F0" }} />
              <div className="h-2 w-3/4 rounded" style={{ backgroundColor: "#E2E8F0" }} />
              <div className="h-8 w-28 rounded-lg mt-2" style={{ backgroundColor: "#2DD4BF" }} />
              <div className="h-20 w-full rounded-lg mt-3 border-2" style={{ borderColor: "#2DD4BF", backgroundColor: "#FAFFFE" }} />
            </div>
            <ul className="mt-5 space-y-2 text-xs" style={{ color: "#64748B" }}>
              <li className="flex items-center gap-1.5">
                <span style={{ color: "#2DD4BF" }}>✓</span> Light theme optimized for reading and writing
              </li>
              <li className="flex items-center gap-1.5">
                <span style={{ color: "#2DD4BF" }}>✓</span> Generous input area with character feedback
              </li>
              <li className="flex items-center gap-1.5">
                <span style={{ color: "#2DD4BF" }}>✓</span> 3-phase progress with time estimate
              </li>
              <li className="flex items-center gap-1.5">
                <span style={{ color: "#2DD4BF" }}>✓</span> Side-by-side format comparison with previews
              </li>
            </ul>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default BeforeAfterSection;
