import { motion, useInView } from "framer-motion";
import { useRef } from "react";

const learnings = [
  "AI interfaces need to balance power with simplicity",
  "Clear feedback during processing reduces user anxiety",
  "Side-by-side comparison helps users validate AI output",
  "Design systems enable rapid iteration",
];

const nextIterations = [
  "Template library for common use cases",
  "Collaborative editing features",
  "Mobile-optimized experience",
  "API for integration with other tools",
];

const ImpactSection = () => {
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
          Impact & Learnings
        </motion.p>

        <div className="grid md:grid-cols-2 gap-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <h3 className="text-lg font-bold mb-5" style={{ color: "#0F172A" }}>
              What I Learned
            </h3>
            <ul className="space-y-3">
              {learnings.map((l, i) => (
                <li key={i} className="flex items-start gap-3 text-sm leading-relaxed" style={{ color: "#475569" }}>
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: "#2DD4BF" }} />
                  {l}
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <h3 className="text-lg font-bold mb-5" style={{ color: "#0F172A" }}>
              Next Iterations
            </h3>
            <ul className="space-y-3">
              {nextIterations.map((n, i) => (
                <li key={i} className="flex items-start gap-3 text-sm leading-relaxed" style={{ color: "#475569" }}>
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: "#F59E0B" }} />
                  {n}
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default ImpactSection;
