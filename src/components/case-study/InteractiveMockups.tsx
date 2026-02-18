import { motion, useInView } from "framer-motion";
import { useRef, useState } from "react";
import { FileText, ScrollText, Check } from "lucide-react";

const InputMockup = () => {
  const [text, setText] = useState("I need to pitch our new sustainability initiative to the board of directors...");
  const maxChars = 500;
  const readiness = Math.min(100, Math.round((text.length / 80) * 100));

  return (
    <div className="rounded-xl border p-6 bg-white" style={{ borderColor: "#E2E8F0" }}>
      <label className="block text-sm font-medium mb-2" style={{ color: "#1E3A8A", fontFamily: "Inter, system-ui, sans-serif" }}>
        What do you need to pitch?
      </label>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value.slice(0, maxChars))}
        className="w-full h-28 rounded-lg border-2 p-3 text-sm resize-none focus:outline-none transition-colors"
        style={{
          borderColor: readiness >= 100 ? "#2DD4BF" : "#E2E8F0",
          color: "#334155",
          fontFamily: "system-ui, sans-serif",
        }}
      />
      <div className="flex justify-between items-center mt-2">
        <span className="text-xs" style={{ color: "#94A3B8" }}>
          {text.length}/{maxChars}
        </span>
        <div className="flex items-center gap-1.5">
          <div
            className="w-2 h-2 rounded-full transition-colors"
            style={{ backgroundColor: readiness >= 100 ? "#2DD4BF" : "#CBD5E1" }}
          />
          <span className="text-xs font-medium" style={{ color: readiness >= 100 ? "#2DD4BF" : "#94A3B8" }}>
            {readiness >= 100 ? "AI Ready" : `${readiness}% ready`}
          </span>
        </div>
      </div>
    </div>
  );
};

const FormatMockup = () => {
  const [selected, setSelected] = useState<"onepager" | "script">("onepager");

  const formats = [
    {
      id: "onepager" as const,
      title: "One-Pager",
      icon: FileText,
      desc: "Structured document with sections, key points, and supporting details.",
      preview: ["Executive Summary", "Key Points", "Supporting Data", "Next Steps"],
    },
    {
      id: "script" as const,
      title: "Script",
      icon: ScrollText,
      desc: "Conversational talking points with timing and natural transitions.",
      preview: ["Opening Hook", "Core Message", "Evidence", "The Ask"],
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4">
      {formats.map((f) => (
        <button
          key={f.id}
          onClick={() => setSelected(f.id)}
          className="rounded-xl border-2 p-5 text-left transition-all"
          style={{
            borderColor: selected === f.id ? "#2DD4BF" : "#E2E8F0",
            backgroundColor: selected === f.id ? "#F0FDFA" : "#FFFFFF",
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <f.icon className="w-4 h-4" style={{ color: selected === f.id ? "#2DD4BF" : "#94A3B8" }} />
            <span className="text-sm font-semibold" style={{ color: "#1E3A8A", fontFamily: "Inter, system-ui, sans-serif" }}>
              {f.title}
            </span>
            {selected === f.id && <Check className="w-4 h-4 ml-auto" style={{ color: "#2DD4BF" }} />}
          </div>
          <p className="text-xs mb-3" style={{ color: "#64748B" }}>{f.desc}</p>
          <div className="space-y-1.5">
            {f.preview.map((line) => (
              <div key={line} className="flex items-center gap-2">
                <div className="w-1 h-1 rounded-full" style={{ backgroundColor: "#2DD4BF" }} />
                <span className="text-[11px]" style={{ color: "#94A3B8" }}>{line}</span>
              </div>
            ))}
          </div>
        </button>
      ))}
    </div>
  );
};

const ProcessingMockup = () => {
  const phases = ["Analyzing", "Structuring", "Generating"];
  const activePhase = 1;

  return (
    <div className="rounded-xl border p-6 bg-white" style={{ borderColor: "#E2E8F0" }}>
      <div className="flex items-center justify-between mb-4">
        {phases.map((phase, i) => (
          <div key={phase} className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
              style={{
                backgroundColor: i <= activePhase ? "#2DD4BF" : "#E2E8F0",
                color: i <= activePhase ? "#FFFFFF" : "#94A3B8",
              }}
            >
              {i < activePhase ? "✓" : i + 1}
            </div>
            <span
              className="text-xs font-medium hidden sm:inline"
              style={{ color: i <= activePhase ? "#1E3A8A" : "#94A3B8" }}
            >
              {phase}
            </span>
            {i < phases.length - 1 && (
              <div className="w-8 h-0.5 mx-1" style={{ backgroundColor: i < activePhase ? "#2DD4BF" : "#E2E8F0" }} />
            )}
          </div>
        ))}
      </div>
      <div className="w-full h-2 rounded-full" style={{ backgroundColor: "#E2E8F0" }}>
        <motion.div
          className="h-2 rounded-full"
          style={{ backgroundColor: "#2DD4BF" }}
          animate={{ width: ["45%", "65%", "55%"] }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
        />
      </div>
      <p className="text-xs mt-3" style={{ color: "#94A3B8" }}>
        Estimated time remaining: ~8 seconds
      </p>
    </div>
  );
};

const InteractiveMockups = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} className="py-20 md:py-28 px-6 bg-white">
      <div className="max-w-[900px] mx-auto">
        <motion.p
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.5 }}
          className="text-xs tracking-[0.3em] uppercase font-semibold mb-4"
          style={{ color: "#2DD4BF", fontFamily: "Inter, system-ui, sans-serif" }}
        >
          Interactive Mockups
        </motion.p>

        <motion.h2
          initial={{ opacity: 0, y: 15 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-2xl md:text-3xl font-bold mb-4"
          style={{ color: "#1E3A8A", fontFamily: "Inter, system-ui, sans-serif" }}
        >
          Try the proposed components
        </motion.h2>

        <motion.p
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="text-sm mb-12 max-w-xl"
          style={{ color: "#64748B" }}
        >
          These are functional UI mockups — type in the input, select a format, and
          watch the progress animation. No real AI processing happens.
        </motion.p>

        <div className="space-y-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "#94A3B8" }}>
              Input Screen
            </h3>
            <InputMockup />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "#94A3B8" }}>
              Format Selection
            </h3>
            <FormatMockup />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "#94A3B8" }}>
              Processing Experience
            </h3>
            <ProcessingMockup />
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default InteractiveMockups;
