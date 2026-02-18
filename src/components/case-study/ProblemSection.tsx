import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Eye, Route, Layers } from "lucide-react";

const problems = [
  {
    icon: Eye,
    title: "Dark Theme Accessibility",
    description:
      "Low contrast text on dark backgrounds makes content hard to scan. Important CTAs blend into the interface rather than standing out.",
  },
  {
    icon: Route,
    title: "Unclear User Flow",
    description:
      "Users aren't sure what happens next after entering their pitch description. The transition from input to output lacks transparency.",
  },
  {
    icon: Layers,
    title: "Format Confusion",
    description:
      "The difference between One-Pager and Script isn't obvious. Users pick a format without understanding what they'll get.",
  },
];

const ProblemSection = () => {
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
          The Problem
        </motion.p>

        <motion.h2
          initial={{ opacity: 0, y: 15 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-2xl md:text-3xl font-bold mb-4"
          style={{ color: "#1E3A8A", fontFamily: "Inter, system-ui, sans-serif" }}
        >
          What could be improved?
        </motion.h2>

        <motion.p
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="text-sm mb-12 max-w-xl"
          style={{ color: "#64748B", fontFamily: "system-ui, sans-serif" }}
        >
          After auditing the current PitchVoid experience, three core areas emerged
          as opportunities for meaningful improvement.
        </motion.p>

        <div className="grid md:grid-cols-3 gap-6">
          {problems.map((p, i) => (
            <motion.div
              key={p.title}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.2 + i * 0.1 }}
              className="bg-white rounded-xl p-6 border"
              style={{ borderColor: "#E2E8F0" }}
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center mb-4"
                style={{ backgroundColor: "#F0FDFA" }}
              >
                <p.icon className="w-5 h-5" style={{ color: "#2DD4BF" }} />
              </div>
              <h3
                className="text-sm font-semibold mb-2"
                style={{ color: "#1E3A8A", fontFamily: "Inter, system-ui, sans-serif" }}
              >
                {p.title}
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: "#64748B" }}>
                {p.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProblemSection;
