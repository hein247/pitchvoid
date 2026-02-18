import { motion, useInView } from "framer-motion";
import { useRef } from "react";

const steps = [
  { label: "Landing", desc: "User arrives, sees value prop, clicks CTA" },
  { label: "Auth", desc: "Sign up / sign in via email or Google OAuth" },
  { label: "Dashboard", desc: "View past pitches or start a new one" },
  { label: "Describe", desc: "Type or speak the pitch scenario" },
  { label: "AI Parse", desc: "AI extracts audience, goal, tone, format" },
  { label: "Add Context", desc: "Optional: upload files, paste URLs" },
  { label: "Quick Tune", desc: "Adjust length, format, and tone" },
  { label: "Generate", desc: "AI creates slides / one-pager / script" },
  { label: "Refine", desc: "Iterate with natural language changes" },
  { label: "Share", desc: "Publish link, QR code, or export PDF" },
];

const UserFlowSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} className="py-20 md:py-28 px-6" style={{ background: "#FFFFFF" }}>
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="mb-16"
        >
          <p className="text-xs tracking-[0.3em] uppercase mb-4" style={{ color: "#2DD4BF" }}>
            02 — User Flow
          </p>
          <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: "#0F172A" }}>
            End-to-end journey
          </h2>
          <p className="text-base" style={{ color: "#64748B" }}>
            The complete path from landing to sharing a polished pitch.
          </p>
        </motion.div>

        {/* Flow diagram */}
        <div className="relative">
          {/* Connecting line */}
          <div
            className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px -translate-x-1/2"
            style={{ background: "#E2E8F0" }}
          />

          <div className="space-y-4 md:space-y-0 md:grid md:grid-cols-2 md:gap-x-16 md:gap-y-6">
            {steps.map((step, i) => {
              const isLeft = i % 2 === 0;
              return (
                <motion.div
                  key={step.label}
                  initial={{ opacity: 0, x: isLeft ? -30 : 30 }}
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.4, delay: 0.08 * i }}
                  className={`relative flex items-start gap-4 p-4 rounded-xl border ${
                    isLeft ? "md:text-right md:flex-row-reverse md:col-start-1" : "md:col-start-2"
                  }`}
                  style={{ background: "#FFFFFF", borderColor: "#F1F5F9" }}
                >
                  <div
                    className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{ background: "#0F172A", color: "#FFFFFF" }}
                  >
                    {i + 1}
                  </div>
                  <div>
                    <p className="font-semibold text-sm" style={{ color: "#0F172A" }}>
                      {step.label}
                    </p>
                    <p className="text-xs mt-1" style={{ color: "#94A3B8" }}>
                      {step.desc}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default UserFlowSection;
