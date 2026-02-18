import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { ArrowUpRight } from "lucide-react";

const CaseStudyFooter = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <footer ref={ref} className="py-20 px-6 bg-white" style={{ borderTop: "1px solid #E2E8F0" }}>
      <div className="max-w-[900px] mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="space-y-5"
        >
          <p className="text-sm" style={{ color: "#64748B", fontFamily: "system-ui, sans-serif" }}>
            This is a design exploration by{" "}
            <span className="font-semibold" style={{ color: "#1E3A8A" }}>
              Hein Thant Aung
            </span>
          </p>

          <a
            href="https://pitchvoid.lovable.app"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm font-medium transition-opacity hover:opacity-80"
            style={{ color: "#2DD4BF" }}
          >
            View the live product
            <ArrowUpRight className="w-3.5 h-3.5" />
          </a>

          <p className="text-xs" style={{ color: "#CBD5E1" }}>
            February 2026
          </p>
        </motion.div>
      </div>
    </footer>
  );
};

export default CaseStudyFooter;
