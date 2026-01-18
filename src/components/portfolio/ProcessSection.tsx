import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
const processSteps = [{
  step: "01",
  title: "Analyze Source Assets",
  description: "Review original campaign image, identify key product elements, lighting characteristics, and brand style cues.",
  time: "5 min",
  icon: "🔍"
}, {
  step: "02",
  title: "Define Channel Requirements",
  description: "Map out specifications for each channel: dimensions, composition rules, text overlay needs, and audience context.",
  time: "10 min",
  icon: "📋"
}, {
  step: "03",
  title: "AI Prompt Engineering",
  description: "Craft detailed prompts that maintain brand consistency while introducing contextual variations for each channel.",
  time: "15 min",
  icon: "✨"
}, {
  step: "04",
  title: "Generate & Curate",
  description: "Generate multiple options per variation, curate the strongest results that align with brand standards.",
  time: "20 min",
  icon: "🎨"
}, {
  step: "05",
  title: "Refine & Polish",
  description: "Fine-tune selected images: color correction, cropping, and ensuring consistency across the campaign set.",
  time: "15 min",
  icon: "💎"
}];
const ProcessSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, {
    once: true,
    margin: "-100px"
  });
  return <section id="process" className="py-32 px-6 bg-background" ref={ref}>
      <div className="max-w-6xl mx-auto">
        <motion.div initial={{
        opacity: 0,
        y: 40
      }} animate={isInView ? {
        opacity: 1,
        y: 0
      } : {}} transition={{
        duration: 0.8
      }} className="text-center mb-20">
          <p className="text-xs tracking-[0.25em] uppercase text-muted-foreground mb-6">
            The Workflow
          </p>
          <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-light text-foreground mb-8">
            AI-Powered Process
          </h2>
          <p className="text-base text-muted-foreground max-w-2xl mx-auto mb-8 leading-relaxed">
            A systematic approach that balances creative exploration with production efficiency.
          </p>
          <p className="text-xs tracking-[0.15em] uppercase text-muted-foreground">FROM 2 SOURCE ASSETS → 6 CAMPAIGN VARIATIONS</p>
        </motion.div>

        {/* Roadmap Timeline */}
        <div className="relative">
          {/* Horizontal line for desktop */}
          <div className="hidden md:block absolute top-16 left-0 right-0 h-px bg-border" />
          
          {/* Vertical line for mobile */}
          <div className="md:hidden absolute left-6 top-0 bottom-0 w-px bg-border" />

          {/* Desktop: Horizontal roadmap */}
          <div className="hidden md:grid grid-cols-5 gap-4">
            {processSteps.map((step, index) => <motion.div key={step.step} initial={{
            opacity: 0,
            y: 30
          }} animate={isInView ? {
            opacity: 1,
            y: 0
          } : {}} transition={{
            duration: 0.6,
            delay: 0.3 + index * 0.1
          }} className="relative flex flex-col items-center text-center">
                {/* Node */}
                <div className="relative z-10 mb-6">
                  <motion.div initial={{
                scale: 0
              }} animate={isInView ? {
                scale: 1
              } : {}} transition={{
                duration: 0.4,
                delay: 0.5 + index * 0.1
              }} className="w-12 h-12 bg-background border border-foreground flex items-center justify-center">
                    <span className="text-lg">{step.icon}</span>
                  </motion.div>
                  {/* Connector dot */}
                  <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-2 h-2 bg-foreground" />
                </div>

                {/* Content card */}
                <div className="pt-8 space-y-3">
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-xs tracking-[0.15em] uppercase font-medium text-foreground">{step.step}</span>
                    <span className="text-xs text-muted-foreground">• {step.time}</span>
                  </div>
                  <h3 className="text-sm font-medium text-foreground leading-tight">
                    {step.title}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </motion.div>)}
          </div>

          {/* Mobile: Vertical roadmap */}
          <div className="md:hidden space-y-8 pl-16">
            {processSteps.map((step, index) => <motion.div key={step.step} initial={{
            opacity: 0,
            x: -20
          }} animate={isInView ? {
            opacity: 1,
            x: 0
          } : {}} transition={{
            duration: 0.6,
            delay: 0.3 + index * 0.1
          }} className="relative">
                {/* Node */}
                <motion.div initial={{
              scale: 0
            }} animate={isInView ? {
              scale: 1
            } : {}} transition={{
              duration: 0.4,
              delay: 0.5 + index * 0.1
            }} className="absolute -left-16 top-0 w-12 h-12 bg-background border border-foreground flex items-center justify-center z-10">
                  <span className="text-lg">{step.icon}</span>
                </motion.div>

                {/* Content */}
                <div className="bg-background border border-border p-5 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs tracking-[0.15em] uppercase font-medium text-foreground">{step.step}</span>
                    <span className="text-xs text-muted-foreground">• {step.time}</span>
                  </div>
                  <h3 className="text-base font-medium text-foreground">
                    {step.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </motion.div>)}
          </div>
        </div>

        {/* Total time summary */}
        <motion.div initial={{
        opacity: 0,
        y: 30
      }} animate={isInView ? {
        opacity: 1,
        y: 0
      } : {}} transition={{
        duration: 0.8,
        delay: 0.9
      }} className="mt-20 text-center">
          <div className="inline-flex items-center gap-8 bg-muted/30 border border-border px-10 py-6">
            <div className="text-center">
              <p className="text-4xl font-display font-light text-foreground">65</p>
              <p className="text-xs tracking-[0.15em] uppercase text-muted-foreground mt-1">minutes</p>
            </div>
            <div className="w-px h-12 bg-border" />
            <div className="text-center">
              <p className="text-4xl font-display font-light text-foreground">6</p>
              <p className="text-xs tracking-[0.15em] uppercase text-muted-foreground mt-1">variations</p>
            </div>
            <div className="w-px h-12 bg-border" />
            <div className="text-center">
              <p className="text-4xl font-display font-light text-foreground">4</p>
              <p className="text-xs tracking-[0.15em] uppercase text-muted-foreground mt-1">channels</p>
            </div>
          </div>
        </motion.div>

        {/* Tools Used */}
        <motion.div initial={{
        opacity: 0,
        y: 40
      }} animate={isInView ? {
        opacity: 1,
        y: 0
      } : {}} transition={{
        duration: 0.8,
        delay: 1
      }} className="mt-16 text-center">
          <p className="text-xs tracking-[0.25em] uppercase text-muted-foreground mb-6">
            Tools Used
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            {["Gemini", "Adobe", "Claude", "Antigravity", "Grok"].map(tool => <span key={tool} className="px-5 py-2 bg-background border border-border text-sm text-foreground hover:bg-muted transition-colors">
                {tool}
              </span>)}
          </div>
        </motion.div>
      </div>
    </section>;
};
export default ProcessSection;