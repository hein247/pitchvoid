import { motion } from "framer-motion";
import { ExternalLink } from "lucide-react";

const CaseStudyHero = () => (
  <section className="py-20 md:py-32 px-6" style={{ background: "#FFFFFF" }}>
    <div className="max-w-3xl mx-auto text-center">
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-xs tracking-[0.3em] uppercase mb-6"
        style={{ color: "#2DD4BF" }}
      >
        UX Case Study
      </motion.p>
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="text-4xl md:text-6xl font-bold leading-tight mb-6"
        style={{ color: "#0F172A", fontFamily: "'Inter', sans-serif" }}
      >
        PitchVoid
      </motion.h1>
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="text-lg md:text-xl leading-relaxed mb-4"
        style={{ color: "#475569" }}
      >
        Designing an AI-powered pitch generator that turns plain-English scenarios into polished slides, one-pagers, and scripts.
      </motion.p>
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="text-sm mb-8"
        style={{ color: "#94A3B8" }}
      >
        Role: Product Designer & Developer · Timeline: 2025 · Tools: Figma, React, Tailwind, Supabase
      </motion.p>
      <motion.a
        href="https://pitchvoid.lovable.app"
        target="_blank"
        rel="noopener noreferrer"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-medium transition-opacity hover:opacity-80"
        style={{ background: "#0F172A", color: "#FFFFFF" }}
      >
        View Live Product <ExternalLink className="w-4 h-4" />
      </motion.a>
    </div>
  </section>
);

export default CaseStudyHero;
