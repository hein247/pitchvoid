import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Moon, Type, Palette, Shield } from "lucide-react";

const decisions = [
  {
    icon: <Moon className="w-5 h-5" />,
    title: "Dark-first interface",
    rationale:
      "Users creating pitches often work late or in focused sessions. A dark theme reduces eye strain, feels premium, and differentiates from typical SaaS tools.",
    tradeoff: "Required careful contrast testing. Every text element meets WCAG AA.",
  },
  {
    icon: <Type className="w-5 h-5" />,
    title: "Cormorant Garamond + Be Vietnam Pro",
    rationale:
      "Serif headings (Cormorant Garamond) convey authority and editorial quality. Sans-serif body (Be Vietnam Pro) ensures readability at small sizes.",
    tradeoff: "Two font families increase load; mitigated with display=swap and subsetting.",
  },
  {
    icon: <Palette className="w-5 h-5" />,
    title: "Warm peach & deep violet palette",
    rationale:
      "Warm amber/peach primary signals approachability and creativity. Violet accents add depth without the overused blue-purple gradient trope.",
    tradeoff: "Warm tones on dark backgrounds need higher saturation to remain visible.",
  },
  {
    icon: <Shield className="w-5 h-5" />,
    title: "Progressive disclosure flow",
    rationale:
      "Instead of a single complex form, the 5-step Quick Pitch flow reveals options gradually. Steps 2–3 are optional, reducing friction for quick use cases.",
    tradeoff: "More steps can feel longer, countered with clear progress indicators and skip options.",
  },
];

const DesignDecisionsSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} className="py-20 md:py-28 px-6 bg-background">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="mb-16"
        >
          <p className="text-xs tracking-[0.3em] uppercase mb-4 text-primary">
            04 // Design Decisions
          </p>
          <h2 className="text-3xl md:text-4xl font-display mb-4 text-foreground">
            Why it looks & works this way
          </h2>
          <p className="text-base text-muted-foreground">
            Key decisions with the rationale and trade-offs behind each.
          </p>
        </motion.div>

        <div className="space-y-6">
          {decisions.map((d, i) => (
            <motion.div
              key={d.title}
              initial={{ opacity: 0, y: 25 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.1 * i }}
              className="flex gap-5 p-6 rounded-2xl border border-border glassmorphism"
            >
              <div className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center bg-primary/10 text-primary">
                {d.icon}
              </div>
              <div>
                <h3 className="text-base font-semibold mb-1 text-foreground">
                  {d.title}
                </h3>
                <p className="text-sm leading-relaxed mb-2 text-muted-foreground">
                  {d.rationale}
                </p>
                <p className="text-xs italic text-muted-foreground/60">
                  Trade-off: {d.tradeoff}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default DesignDecisionsSection;
