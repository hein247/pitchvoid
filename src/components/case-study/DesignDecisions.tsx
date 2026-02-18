import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Palette, Sun, Type, Accessibility } from "lucide-react";

const decisions = [
  {
    icon: Palette,
    title: "Why Teal Over Purple",
    detail:
      "The current deep purple creates a moody, creative atmosphere but hurts legibility. Teal maintains a modern tech feel while offering better contrast ratios and a sense of clarity and trust.",
  },
  {
    icon: Sun,
    title: "White Backgrounds for Productivity",
    detail:
      "Users come to PitchVoid to get work done — not to be immersed in an experience. Light backgrounds reduce eye strain for document-creation tasks and align with tools like Notion and Google Docs.",
  },
  {
    icon: Type,
    title: "Typography Choices",
    detail:
      "Inter for headings provides geometric precision and excellent screen rendering. System fonts for body text ensure fast loading and native readability across all devices.",
  },
  {
    icon: Accessibility,
    title: "Accessibility (WCAG AA)",
    detail:
      "All text/background combinations meet WCAG AA contrast ratios (4.5:1 for body, 3:1 for large text). Interactive elements have visible focus states and sufficient target sizes.",
  },
];

const DesignDecisions = () => {
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
          Design Decisions
        </motion.p>

        <motion.h2
          initial={{ opacity: 0, y: 15 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-2xl md:text-3xl font-bold mb-12"
          style={{ color: "#1E3A8A", fontFamily: "Inter, system-ui, sans-serif" }}
        >
          Rationale behind the choices
        </motion.h2>

        <div className="grid md:grid-cols-2 gap-6">
          {decisions.map((d, i) => (
            <motion.div
              key={d.title}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.15 + i * 0.08 }}
              className="bg-white rounded-xl p-6 border"
              style={{ borderColor: "#E2E8F0" }}
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center mb-4"
                style={{ backgroundColor: "#F0FDFA" }}
              >
                <d.icon className="w-5 h-5" style={{ color: "#2DD4BF" }} />
              </div>
              <h3
                className="text-sm font-semibold mb-2"
                style={{ color: "#1E3A8A", fontFamily: "Inter, system-ui, sans-serif" }}
              >
                {d.title}
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: "#64748B" }}>
                {d.detail}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default DesignDecisions;
