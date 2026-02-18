import { motion } from "framer-motion";
import { ExternalLink } from "lucide-react";

const CaseStudyHero = () =>
<section className="py-20 md:py-32 px-6 bg-background">
    <div className="max-w-3xl mx-auto text-center">
      <motion.p
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="text-xs tracking-[0.3em] uppercase mb-6 text-primary">

        UX Case Study
      </motion.p>
      <motion.h1
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.1 }}
      className="text-4xl md:text-6xl font-bold leading-tight mb-6 text-foreground font-display">

        PitchVoid
      </motion.h1>
      <motion.p
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className="text-lg md:text-xl leading-relaxed mb-4 text-muted-foreground">

        Designing an AI-powered pitch generator that turns plain-English scenarios into polished slides, one-pagers, and scripts.
      </motion.p>
      <motion.p
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.3 }}
      className="text-sm mb-8 text-muted-foreground/60">Role: Creator · Timeline: 2026 · Tools: Figma, Lovable, React, Tailwind and other components as they deemed fit


    </motion.p>
      <motion.a
      href="https://pitchvoid.lovable.app"
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.4 }}
      className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-medium transition-opacity hover:opacity-80 magenta-gradient text-primary-foreground">

        View Live Product <ExternalLink className="w-4 h-4" />
      </motion.a>
    </div>
  </section>;


export default CaseStudyHero;