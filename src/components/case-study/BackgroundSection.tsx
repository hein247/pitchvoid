import { motion, useInView } from "framer-motion";
import { useRef } from "react";

const challenges = [
  "Simplify the input experience for users with messy, unstructured thoughts",
  "Make the AI processing feel transparent and trustworthy",
  "Design clear output formats that users can easily edit and export",
  "Create a design system that scales as the product grows",
];

const BackgroundSection = () => {
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
          Background & Challenge
        </motion.p>

        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-base md:text-lg leading-relaxed mb-10 max-w-2xl"
          style={{ color: "#334155" }}
        >
          PitchVoid is a live AI tool at{" "}
          <a
            href="https://pitchvoid.lovable.app"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium underline decoration-1 underline-offset-2"
            style={{ color: "#2DD4BF" }}
          >
            pitchvoid.com
          </a>{" "}
          that helps users transform scattered thoughts into structured one-pagers
          and scripts. As the product designer, I worked on enhancing the user
          experience to make the transformation process more intuitive and the
          outputs more useful.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <h3 className="text-sm font-bold mb-4" style={{ color: "#0F172A" }}>
            The Challenge:
          </h3>
          <ul className="space-y-3">
            {challenges.map((c, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={isInView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.4, delay: 0.25 + i * 0.06 }}
                className="flex items-start gap-3 text-sm leading-relaxed"
                style={{ color: "#475569" }}
              >
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: "#2DD4BF" }} />
                {c}
              </motion.li>
            ))}
          </ul>
        </motion.div>
      </div>
    </section>
  );
};

export default BackgroundSection;
