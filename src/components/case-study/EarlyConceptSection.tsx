import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Lightbulb, MessageSquare, Zap } from "lucide-react";

const concepts = [
  {
    icon: <Lightbulb className="w-5 h-5" />,
    title: "The Problem",
    description:
      "People pitch constantly — investors, clients, managers — but crafting a compelling narrative takes hours. Most tools focus on slide design, not the actual story.",
  },
  {
    icon: <MessageSquare className="w-5 h-5" />,
    title: "The Insight",
    description:
      'What if you could just describe the situation in one sentence? "I\'m pitching my startup to a VC who focuses on climate tech" — and get a full pitch tailored to that context.',
  },
  {
    icon: <Zap className="w-5 h-5" />,
    title: "The Solution",
    description:
      "PitchVoid: a universal pitch generator. Describe any scenario, add optional context (files, URLs), and get polished output in the format you need — slides, one-pagers, or scripts.",
  },
];

const EarlyConceptSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} className="py-20 md:py-28 px-6" style={{ background: "#F8FAFC" }}>
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="mb-16"
        >
          <p className="text-xs tracking-[0.3em] uppercase mb-4" style={{ color: "#2DD4BF" }}>
            01 — Early Concept
          </p>
          <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: "#0F172A" }}>
            Where it started
          </h2>
          <p className="text-base" style={{ color: "#64748B" }}>
            The initial hypothesis and framing that guided the entire design process.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {concepts.map((c, i) => (
            <motion.div
              key={c.title}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.15 * i }}
              className="p-6 rounded-2xl border"
              style={{ background: "#FFFFFF", borderColor: "#E2E8F0" }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                style={{ background: "#F0FDFA", color: "#2DD4BF" }}
              >
                {c.icon}
              </div>
              <h3 className="text-lg font-semibold mb-2" style={{ color: "#0F172A" }}>
                {c.title}
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: "#64748B" }}>
                {c.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default EarlyConceptSection;
