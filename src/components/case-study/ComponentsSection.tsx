import { motion, useInView } from "framer-motion";
import { useRef } from "react";

const ComponentsSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} className="py-20 md:py-28 px-6" style={{ background: "#F8FAFC" }}>
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="mb-16"
        >
          <p className="text-xs tracking-[0.3em] uppercase mb-4" style={{ color: "#2DD4BF" }}>
            05 — Component System
          </p>
          <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: "#0F172A" }}>
            Building blocks
          </h2>
          <p className="text-base" style={{ color: "#64748B" }}>
            Reusable components that make up PitchVoid's interface, shown in their dark-theme context.
          </p>
        </motion.div>

        {/* Component showcase grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Button component */}
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="rounded-2xl border overflow-hidden"
            style={{ borderColor: "#E2E8F0" }}
          >
            <div className="px-5 py-3 border-b" style={{ borderColor: "#F1F5F9" }}>
              <p className="text-xs font-semibold" style={{ color: "#0F172A" }}>Buttons</p>
            </div>
            <div className="p-6 flex flex-wrap gap-3" style={{ background: "hsl(270, 12%, 4%)" }}>
              <button
                className="px-5 py-2.5 rounded-xl text-sm font-medium"
                style={{ background: "linear-gradient(135deg, hsl(25,75%,65%), hsl(260,45%,50%))", color: "hsl(270,12%,4%)" }}
              >
                Primary CTA
              </button>
              <button
                className="px-5 py-2.5 rounded-xl text-sm font-medium border"
                style={{ borderColor: "rgba(90,60,130,0.3)", color: "hsl(30,15%,92%)", background: "transparent" }}
              >
                Secondary
              </button>
              <button
                className="px-4 py-2 rounded-lg text-xs"
                style={{ background: "rgba(90,60,130,0.15)", color: "hsl(30,10%,58%)" }}
              >
                Ghost
              </button>
            </div>
          </motion.div>

          {/* Card component */}
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="rounded-2xl border overflow-hidden"
            style={{ borderColor: "#E2E8F0" }}
          >
            <div className="px-5 py-3 border-b" style={{ borderColor: "#F1F5F9" }}>
              <p className="text-xs font-semibold" style={{ color: "#0F172A" }}>Project Card</p>
            </div>
            <div className="p-6" style={{ background: "hsl(270, 12%, 4%)" }}>
              <div
                className="p-4 rounded-xl border"
                style={{
                  background: "linear-gradient(145deg, rgba(10,8,16,0.8), rgba(20,14,30,0.9))",
                  borderColor: "rgba(90,60,130,0.18)",
                }}
              >
                <div className="h-2.5 rounded mb-2" style={{ background: "hsl(30,15%,92%)", width: "60%" }} />
                <div className="h-2 rounded mb-3" style={{ background: "hsl(30,10%,58%)", width: "40%", opacity: 0.5 }} />
                <div className="flex gap-2">
                  <span
                    className="px-2 py-1 rounded text-[10px]"
                    style={{ background: "rgba(90,60,130,0.2)", color: "hsl(30,10%,58%)" }}
                  >
                    One-Pager
                  </span>
                  <span
                    className="px-2 py-1 rounded text-[10px]"
                    style={{ background: "rgba(200,150,100,0.1)", color: "hsl(25,75%,65%)" }}
                  >
                    Draft
                  </span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Input component */}
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="rounded-2xl border overflow-hidden"
            style={{ borderColor: "#E2E8F0" }}
          >
            <div className="px-5 py-3 border-b" style={{ borderColor: "#F1F5F9" }}>
              <p className="text-xs font-semibold" style={{ color: "#0F172A" }}>Input & Chips</p>
            </div>
            <div className="p-6" style={{ background: "hsl(270, 12%, 4%)" }}>
              <div
                className="rounded-xl p-3 mb-3 border"
                style={{ background: "rgba(10,8,16,0.6)", borderColor: "rgba(90,60,130,0.2)" }}
              >
                <p className="text-sm" style={{ color: "hsl(30,10%,58%)" }}>
                  Describe your pitch scenario...
                </p>
              </div>
              <div className="flex gap-2 flex-wrap">
                {["Make it shorter", "More data", "Bolder tone"].map((chip) => (
                  <span
                    key={chip}
                    className="px-3 py-1.5 rounded-full text-xs border"
                    style={{ borderColor: "rgba(90,60,130,0.25)", color: "hsl(30,15%,92%)" }}
                  >
                    {chip}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Color palette */}
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.25 }}
            className="rounded-2xl border overflow-hidden"
            style={{ borderColor: "#E2E8F0" }}
          >
            <div className="px-5 py-3 border-b" style={{ borderColor: "#F1F5F9" }}>
              <p className="text-xs font-semibold" style={{ color: "#0F172A" }}>Color Palette</p>
            </div>
            <div className="p-6 grid grid-cols-4 gap-3">
              {[
                { name: "Background", color: "hsl(270,12%,4%)" },
                { name: "Surface", color: "hsl(270,10%,7%)" },
                { name: "Primary", color: "hsl(25,75%,65%)" },
                { name: "Accent", color: "hsl(260,45%,50%)" },
                { name: "Foreground", color: "hsl(30,15%,92%)" },
                { name: "Muted", color: "hsl(30,10%,58%)" },
                { name: "Border", color: "rgba(90,60,130,0.35)" },
                { name: "Destructive", color: "hsl(0,72%,55%)" },
              ].map((c) => (
                <div key={c.name} className="text-center">
                  <div
                    className="w-full aspect-square rounded-xl mb-2 border"
                    style={{ background: c.color, borderColor: "#E2E8F0" }}
                  />
                  <p className="text-[10px]" style={{ color: "#64748B" }}>
                    {c.name}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default ComponentsSection;
