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
  return <section id="challenge" className="py-32 px-6 bg-gradient-to-b from-secondary/20 to-secondary/40 relative overflow-hidden" ref={ref}>
      {/* Decorative background shapes */}
      <div className="absolute top-0 left-0 w-72 h-72 bg-accent/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl translate-x-1/3 translate-y-1/3" />
      
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
          <p className="text-sm tracking-[0.3em] uppercase text-muted-foreground mb-4 inline-block px-6 py-2 bg-background/50 rounded-full backdrop-blur-sm">
            The Challenge
          </p>
          <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-light text-foreground mb-6">
            10 Variations, 4 Channels
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Create efficient, brand-consistent campaign variations from a single source image 
            using AI tools — demonstrating speed without sacrificing quality.
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
        }} className="bg-card/80 backdrop-blur-sm p-8 rounded-3xl border border-border/50 hover:border-foreground/20 hover:shadow-xl hover:shadow-accent/5 transition-all duration-300 group">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center mb-5">
                <span className="text-2xl">{channel.icon}</span>
              </div>
              <h3 className="text-xl font-medium text-foreground mb-2 group-hover:text-foreground/80 transition-colors">
                {channel.name}
              </h3>
              <p className="text-sm text-muted-foreground">
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
          <div className="inline-flex items-center gap-6 md:gap-8 text-sm text-muted-foreground bg-background/60 backdrop-blur-sm px-8 py-4 rounded-full border border-border/30">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-accent to-accent/60" />
              <span>AI-Powered</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-accent to-accent/60" />
              <span>Brand Consistency</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-accent to-accent/60" />
              <span>Production Ready</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>;
};
export default ChallengeSection;