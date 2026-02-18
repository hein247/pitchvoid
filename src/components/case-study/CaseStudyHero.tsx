import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";

const CaseStudyHero = () => {
  return (
    <section className="pt-32 pb-20 md:pt-40 md:pb-28 px-6 bg-white">
      <div className="max-w-[900px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-3 mb-6"
        >
          <span
            className="text-[10px] tracking-[0.2em] uppercase font-semibold px-3 py-1 rounded-full"
            style={{ backgroundColor: "#F0FDFA", color: "#2DD4BF" }}
          >
            Live Product
          </span>
          <span className="text-xs" style={{ color: "#94A3B8" }}>
            User Research • UI/UX Redesign • Live at pitchvoid.com
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.05 }}
          className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.05] mb-3"
          style={{ color: "#0F172A" }}
        >
          PitchVoid
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-xl md:text-2xl font-medium mb-2"
          style={{ color: "#334155" }}
        >
          Redesigning an AI Communication Tool
        </motion.p>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="text-sm mb-10"
          style={{ color: "#94A3B8" }}
        >
          Product Designer · 2025
        </motion.p>

        {/* Hero image placeholder — redesigned interface screenshot */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="w-full aspect-[16/9] rounded-2xl overflow-hidden"
          style={{ backgroundColor: "#F8FAFC", border: "1px solid #E2E8F0" }}
        >
          <div className="w-full h-full flex flex-col">
            {/* Mock browser chrome */}
            <div className="h-8 flex items-center px-4 gap-1.5" style={{ backgroundColor: "#F1F5F9" }}>
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "#E2E8F0" }} />
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "#E2E8F0" }} />
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "#E2E8F0" }} />
              <div className="mx-auto h-4 w-48 rounded" style={{ backgroundColor: "#E2E8F0" }} />
            </div>
            {/* Mock app content */}
            <div className="flex-1 p-8 md:p-12 flex flex-col items-center justify-center gap-4">
              <div className="h-3 w-20 rounded" style={{ backgroundColor: "#2DD4BF" }} />
              <div className="h-5 w-72 rounded" style={{ backgroundColor: "#1E3A8A" }} />
              <div className="h-3 w-96 max-w-full rounded" style={{ backgroundColor: "#CBD5E1" }} />
              <div className="h-3 w-80 max-w-full rounded" style={{ backgroundColor: "#E2E8F0" }} />
              <div className="mt-4 h-24 w-full max-w-md rounded-xl border-2" style={{ borderColor: "#2DD4BF", backgroundColor: "#FAFFFE" }}>
                <div className="p-4 space-y-2">
                  <div className="h-2 w-3/4 rounded" style={{ backgroundColor: "#E2E8F0" }} />
                  <div className="h-2 w-1/2 rounded" style={{ backgroundColor: "#E2E8F0" }} />
                </div>
              </div>
              <div className="h-10 w-40 rounded-lg mt-2" style={{ backgroundColor: "#2DD4BF" }} />
            </div>
          </div>
        </motion.div>

        <motion.a
          href="https://pitchvoid.lovable.app"
          target="_blank"
          rel="noopener noreferrer"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="inline-flex items-center gap-1.5 text-xs font-medium mt-6 transition-opacity hover:opacity-70"
          style={{ color: "#2DD4BF" }}
        >
          Visit live product
          <ArrowUpRight className="w-3.5 h-3.5" />
        </motion.a>
      </div>
    </section>
  );
};

export default CaseStudyHero;
