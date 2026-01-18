import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";

const processSteps = [
  {
    step: "01",
    title: "Analyze Source Assets",
    description: "Review original campaign image, identify key product elements, lighting characteristics, and brand style cues.",
    time: "5 min",
    icon: "🔍",
  },
  {
    step: "02",
    title: "Define Channel Requirements",
    description: "Map out specifications for each channel: dimensions, composition rules, text overlay needs, and audience context.",
    time: "10 min",
    icon: "📋",
  },
  {
    step: "03",
    title: "AI Prompt Engineering",
    description: "Craft detailed prompts that maintain brand consistency while introducing contextual variations for each channel.",
    time: "15 min",
    icon: "✨",
  },
  {
    step: "04",
    title: "Generate & Curate",
    description: "Generate multiple options per variation, curate the strongest results that align with brand standards.",
    time: "20 min",
    icon: "🎨",
  },
  {
    step: "05",
    title: "Refine & Polish",
    description: "Fine-tune selected images: color correction, cropping, and ensuring consistency across the campaign set.",
    time: "15 min",
    icon: "💎",
  },
];

const ProcessSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="process" className="py-32 px-6" ref={ref}>
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <p className="text-sm tracking-[0.3em] uppercase text-muted-foreground mb-4">
            The Workflow
          </p>
          <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-light text-foreground mb-6">
            AI-Powered Process
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            A systematic approach that balances creative exploration with production efficiency.
          </p>
          <p className="text-sm text-accent">
            From 2 source assets → 10 campaign variations
          </p>
        </motion.div>

        {/* Roadmap Timeline */}
        <div className="relative">
          {/* Horizontal line for desktop */}
          <div className="hidden md:block absolute top-16 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-border to-transparent" />
          
          {/* Vertical line for mobile */}
          <div className="md:hidden absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-transparent via-border to-transparent" />

          {/* Desktop: Horizontal roadmap */}
          <div className="hidden md:grid grid-cols-5 gap-4">
            {processSteps.map((step, index) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.3 + index * 0.1 }}
                className="relative flex flex-col items-center text-center"
              >
                {/* Node */}
                <div className="relative z-10 mb-6">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={isInView ? { scale: 1 } : {}}
                    transition={{ duration: 0.4, delay: 0.5 + index * 0.1 }}
                    className="w-14 h-14 rounded-full bg-card border-2 border-accent flex items-center justify-center shadow-lg"
                  >
                    <span className="text-2xl">{step.icon}</span>
                  </motion.div>
                  {/* Connector dot */}
                  <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-accent" />
                </div>

                {/* Content card */}
                <div className="pt-8 space-y-3">
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-xs font-medium text-accent">{step.step}</span>
                    <span className="text-xs text-muted-foreground">• {step.time}</span>
                  </div>
                  <h3 className="text-sm font-medium text-foreground leading-tight">
                    {step.title}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Mobile: Vertical roadmap */}
          <div className="md:hidden space-y-8 pl-16">
            {processSteps.map((step, index) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, x: -20 }}
                animate={isInView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.3 + index * 0.1 }}
                className="relative"
              >
                {/* Node */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={isInView ? { scale: 1 } : {}}
                  transition={{ duration: 0.4, delay: 0.5 + index * 0.1 }}
                  className="absolute -left-16 top-0 w-12 h-12 rounded-full bg-card border-2 border-accent flex items-center justify-center shadow-lg z-10"
                >
                  <span className="text-xl">{step.icon}</span>
                </motion.div>

                {/* Content */}
                <div className="bg-card border border-border rounded-lg p-5 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-accent">{step.step}</span>
                    <span className="text-xs text-muted-foreground">• {step.time}</span>
                  </div>
                  <h3 className="text-base font-medium text-foreground">
                    {step.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Total time summary */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.9 }}
          className="mt-20 text-center"
        >
          <div className="inline-flex items-center gap-6 bg-secondary/50 rounded-full px-8 py-4">
            <div className="text-center">
              <p className="text-3xl font-display font-light text-foreground">65</p>
              <p className="text-xs text-muted-foreground">minutes</p>
            </div>
            <div className="w-px h-10 bg-border" />
            <div className="text-center">
              <p className="text-3xl font-display font-light text-foreground">10</p>
              <p className="text-xs text-muted-foreground">variations</p>
            </div>
            <div className="w-px h-10 bg-border" />
            <div className="text-center">
              <p className="text-3xl font-display font-light text-foreground">4</p>
              <p className="text-xs text-muted-foreground">channels</p>
            </div>
          </div>
        </motion.div>

        {/* Tools Used */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 1 }}
          className="mt-16 text-center"
        >
          <p className="text-sm tracking-widest uppercase text-muted-foreground mb-6">
            Tools Used
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            {["Gemini", "Adobe Photoshop", "Figma"].map((tool) => (
              <span
                key={tool}
                className="px-4 py-2 bg-secondary rounded-full text-sm text-foreground"
              >
                {tool}
              </span>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default ProcessSection;
