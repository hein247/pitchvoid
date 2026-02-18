import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { ArrowRight } from "lucide-react";

const steps = ["Landing", "Input", "Format Selection", "Processing", "Output", "Edit / Export"];

const UserFlowSection = () => {
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
          User Flow
        </motion.p>

        <motion.h2
          initial={{ opacity: 0, y: 15 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-2xl md:text-3xl font-bold mb-4"
          style={{ color: "#0F172A" }}
        >
          Redesigned User Journey
        </motion.h2>

        <motion.p
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="text-sm mb-12"
          style={{ color: "#64748B" }}
        >
          Simplified flow from scattered input to polished deliverable
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="rounded-2xl border p-6 md:p-10 bg-white overflow-x-auto"
          style={{ borderColor: "#E2E8F0" }}
        >
          <div className="flex items-center gap-2 md:gap-3 min-w-max mx-auto justify-center">
            {steps.map((step, i) => (
              <div key={step} className="flex items-center gap-2 md:gap-3">
                <div className="flex flex-col items-center gap-2">
                  <div
                    className="w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center text-xs font-bold text-white"
                    style={{ backgroundColor: "#2DD4BF" }}
                  >
                    {i + 1}
                  </div>
                  <span className="text-[10px] md:text-xs font-medium text-center max-w-[70px]" style={{ color: "#334155" }}>
                    {step}
                  </span>
                </div>
                {i < steps.length - 1 && (
                  <ArrowRight className="w-4 h-4 shrink-0 -mt-5" style={{ color: "#CBD5E1" }} />
                )}
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default UserFlowSection;
