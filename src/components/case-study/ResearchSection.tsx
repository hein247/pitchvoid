import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Puzzle, Eye, Settings2 } from "lucide-react";

const insights = [
  {
    icon: Puzzle,
    title: "Users Think in Fragments",
    points: [
      "Initial ideas are rarely structured",
      "The tool needs to accept chaos gracefully",
    ],
  },
  {
    icon: Eye,
    title: "Processing Anxiety",
    points: [
      "Users want to know what's happening",
      "Transparency builds trust",
    ],
  },
  {
    icon: Settings2,
    title: "Output Flexibility",
    points: [
      "Different use cases need different formats",
      "Easy editing is crucial",
    ],
  },
];

const ResearchSection = () => {
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
          Research & Discovery
        </motion.p>

        <motion.h2
          initial={{ opacity: 0, y: 15 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-2xl md:text-3xl font-bold mb-12"
          style={{ color: "#0F172A" }}
        >
          User Insights
        </motion.h2>

        <div className="grid md:grid-cols-3 gap-6">
          {insights.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.15 + i * 0.08 }}
              className="rounded-xl border p-6"
              style={{ borderColor: "#E2E8F0" }}
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center mb-4"
                style={{ backgroundColor: "#F0FDFA" }}
              >
                <item.icon className="w-5 h-5" style={{ color: "#2DD4BF" }} />
              </div>
              <h3 className="text-sm font-bold mb-3" style={{ color: "#0F172A" }}>
                {item.title}
              </h3>
              <ul className="space-y-2">
                {item.points.map((p) => (
                  <li key={p} className="text-xs leading-relaxed" style={{ color: "#64748B" }}>
                    {p}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ResearchSection;
