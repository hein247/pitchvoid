import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { ArrowUpRight } from "lucide-react";

const LiveProductSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} className="py-24 md:py-32 px-6" style={{ backgroundColor: "#F8FAFC" }}>
      <div className="max-w-[600px] mx-auto text-center">
        <motion.p
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.5 }}
          className="text-[10px] tracking-[0.3em] uppercase font-semibold mb-4"
          style={{ color: "#2DD4BF" }}
        >
          Live Product
        </motion.p>

        <motion.h2
          initial={{ opacity: 0, y: 15 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-2xl md:text-3xl font-bold mb-4"
          style={{ color: "#0F172A" }}
        >
          See the Live Product
        </motion.h2>

        <motion.p
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="text-sm mb-8"
          style={{ color: "#64748B" }}
        >
          PitchVoid is live and being used by users. This case study shows the
          design thinking behind the user experience.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-3"
        >
          <a
            href="https://pitchvoid.lovable.app"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm font-semibold px-6 py-3 rounded-xl text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: "#2DD4BF" }}
          >
            Visit pitchvoid.com
            <ArrowUpRight className="w-4 h-4" />
          </a>
          <a
            href="#"
            className="inline-flex items-center gap-2 text-sm font-semibold px-6 py-3 rounded-xl border transition-opacity hover:opacity-70"
            style={{ borderColor: "#E2E8F0", color: "#334155" }}
          >
            View Design Process
            <ArrowUpRight className="w-4 h-4" />
          </a>
        </motion.div>
      </div>
    </section>
  );
};

export default LiveProductSection;
