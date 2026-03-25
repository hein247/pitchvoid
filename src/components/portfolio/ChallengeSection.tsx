import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
const channels = [{
  name: "Email",
  description: "Hero banners, product highlights",
  icon: "📧"
}, {
  name: "Social",
  description: "Instagram, Stories, Pinterest",
  icon: "📱"
}, {
  name: "Web",
  description: "Homepage banners, product pages",
  icon: "🖥️"
}, {
  name: "In-Store",
  description: "Signage, display cards",
  icon: "🏬"
}];
const ChallengeSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, {
    once: true,
    margin: "-100px"
  });
  return <section id="challenge" className="py-32 px-6 bg-muted/30 relative overflow-hidden" ref={ref}>
      {/* Decorative background shapes */}
      <div className="absolute top-0 left-0 w-72 h-72 bg-muted/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-foreground/5 rounded-full blur-3xl translate-x-1/3 translate-y-1/3" />
      
      <div className="max-w-6xl mx-auto relative z-10">
        <motion.div initial={{
        opacity: 0,
        y: 40
      }} animate={isInView ? {
        opacity: 1,
        y: 0
      } : {}} transition={{
        duration: 0.8
      }} className="text-center mb-20">
          <p className="text-xs tracking-[0.25em] uppercase text-muted-foreground mb-6 inline-block px-6 py-2 bg-background/80 border border-border">
            The Challenge
          </p>
          <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-light text-foreground mb-8">
            10 Variations, 4 Channels
          </h2>
          <p className="text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Create efficient, brand-consistent campaign variations from a single source image 
            using AI tools, demonstrating speed without sacrificing quality.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {channels.map((channel, index) => <motion.div key={channel.name} initial={{
          opacity: 0,
          y: 30
        }} animate={isInView ? {
          opacity: 1,
          y: 0
        } : {}} transition={{
          duration: 0.6,
          delay: index * 0.1
        }} className="bg-background p-8 border border-border hover:border-foreground/30 transition-all duration-300 group">
              <div className="w-12 h-12 border border-border flex items-center justify-center mb-5 group-hover:border-foreground/30 transition-colors">
                <span className="text-xl">{channel.icon}</span>
              </div>
              <h3 className="text-sm tracking-[0.15em] uppercase font-medium text-foreground mb-2 group-hover:text-muted-foreground transition-colors">
                {channel.name}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {channel.description}
              </p>
            </motion.div>)}
        </div>

        <motion.div initial={{
        opacity: 0
      }} animate={isInView ? {
        opacity: 1
      } : {}} transition={{
        duration: 0.8,
        delay: 0.5
      }} className="mt-20 text-center">
          <div className="inline-flex items-center gap-6 md:gap-8 text-xs tracking-[0.15em] uppercase text-muted-foreground bg-background border border-border px-8 py-4">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-foreground" />
              <span>AI-Powered</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-foreground" />
              <span>Brand Consistency</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-foreground" />
              <span>Production Ready</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>;
};
export default ChallengeSection;