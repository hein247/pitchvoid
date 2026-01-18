import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";

import originalRing from "@/assets/original_ring.png";
import ringHand1 from "@/assets/ring_hand_1.png";

const processSteps = [
  {
    step: "01",
    title: "Analyze Source Assets",
    description: "Review original campaign image, identify key product elements, lighting characteristics, and brand style cues.",
    time: "5 min",
  },
  {
    step: "02",
    title: "Define Channel Requirements",
    description: "Map out specifications for each channel: dimensions, composition rules, text overlay needs, and audience context.",
    time: "10 min",
  },
  {
    step: "03",
    title: "AI Prompt Engineering",
    description: "Craft detailed prompts that maintain brand consistency while introducing contextual variations for each channel.",
    time: "15 min",
  },
  {
    step: "04",
    title: "Generate & Curate",
    description: "Generate multiple options per variation, curate the strongest results that align with brand standards.",
    time: "20 min",
  },
  {
    step: "05",
    title: "Refine & Polish",
    description: "Fine-tune selected images: color correction, cropping, and ensuring consistency across the campaign set.",
    time: "15 min",
  },
];

const ProcessSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="process" className="py-32 px-6" ref={ref}>
      <div className="max-w-7xl mx-auto">
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
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            A systematic approach that balances creative exploration with production efficiency.
          </p>
        </motion.div>

        {/* Source to Variation Comparison */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mb-24"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
              <p className="text-sm tracking-widest uppercase text-muted-foreground">
                Source Assets
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="relative rounded-sm overflow-hidden">
                  <img
                    src={originalRing}
                    alt="Original product shot"
                    className="w-full aspect-square object-cover"
                  />
                  <div className="absolute bottom-2 left-2 bg-background/80 backdrop-blur-sm px-2 py-1 text-xs">
                    Product Shot
                  </div>
                </div>
                <div className="relative rounded-sm overflow-hidden">
                  <img
                    src={ringHand1}
                    alt="Hand reference"
                    className="w-full aspect-square object-cover"
                  />
                  <div className="absolute bottom-2 left-2 bg-background/80 backdrop-blur-sm px-2 py-1 text-xs">
                    Hand Reference
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center">
              <div className="text-center space-y-4">
                <div className="flex items-center justify-center gap-4">
                  <div className="h-px w-12 bg-border" />
                  <span className="text-2xl">→</span>
                  <div className="h-px w-12 bg-border" />
                </div>
                <div className="space-y-2">
                  <p className="text-5xl font-display font-light text-foreground">10</p>
                  <p className="text-sm text-muted-foreground">Campaign Variations</p>
                  <p className="text-xs text-accent">~65 minutes total</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Process Steps */}
        <div className="relative">
          <div className="absolute left-8 top-0 bottom-0 w-px bg-border hidden md:block" />
          
          <div className="space-y-12">
            {processSteps.map((step, index) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, x: -30 }}
                animate={isInView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.3 + index * 0.1 }}
                className="relative grid grid-cols-1 md:grid-cols-[80px_1fr] gap-6 items-start"
              >
                <div className="relative">
                  <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center border border-border">
                    <span className="text-lg font-light text-foreground">{step.step}</span>
                  </div>
                </div>
                
                <div className="bg-card p-6 rounded-sm border border-border hover:border-foreground/20 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-medium text-foreground mb-2">
                        {step.title}
                      </h3>
                      <p className="text-muted-foreground leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-sm text-accent">{step.time}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Tools Used */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="mt-24 text-center"
        >
          <p className="text-sm tracking-widest uppercase text-muted-foreground mb-6">
            Tools Used
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            {["ChatGPT Image Generation", "Adobe Photoshop", "Figma"].map((tool) => (
              <span
                key={tool}
                className="px-4 py-2 bg-secondary rounded-sm text-sm text-foreground"
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
