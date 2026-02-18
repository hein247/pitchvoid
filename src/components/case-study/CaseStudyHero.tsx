import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";

const CaseStudyHero = () => {
  return (
    <section className="py-24 md:py-32 px-6 bg-white">
      <div className="max-w-[900px] mx-auto text-center">
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-xs tracking-[0.3em] uppercase font-semibold mb-6"
          style={{ color: "#2DD4BF", fontFamily: "Inter, system-ui, sans-serif" }}
        >
          Design Case Study
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 leading-[1.1]"
          style={{ color: "#1E3A8A", fontFamily: "Inter, system-ui, sans-serif" }}
        >
          Redesigning PitchVoid
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-base md:text-lg max-w-2xl mx-auto mb-10 leading-relaxed"
          style={{ color: "#475569", fontFamily: "system-ui, sans-serif" }}
        >
          A UX design exploration of an existing live product. PitchVoid transforms
          scattered thoughts into clear one-pagers and scripts — this case study
          explores how its interface could be improved for clarity, accessibility,
          and delight.
        </motion.p>

        <motion.a
          href="https://pitchvoid.lovable.app"
          target="_blank"
          rel="noopener noreferrer"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="inline-flex items-center gap-2 text-sm font-medium px-5 py-2.5 rounded-full border transition-colors"
          style={{
            color: "#1E3A8A",
            borderColor: "#CBD5E1",
            fontFamily: "Inter, system-ui, sans-serif",
          }}
        >
          View Live Product
          <ArrowUpRight className="w-4 h-4" />
        </motion.a>
      </div>
    </section>
  );
};

export default CaseStudyHero;
