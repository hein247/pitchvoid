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
  return <section id="challenge" className="py-32 px-6 bg-secondary/30" ref={ref}>
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
          <p className="text-sm tracking-[0.3em] uppercase text-muted-foreground mb-4">
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
        }} className="bg-card p-8 rounded-sm border border-border hover:border-foreground/20 transition-colors group">
              <span className="text-3xl mb-4 block">{channel.icon}</span>
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
          <div className="inline-flex items-center gap-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-accent" />
              <span>AI-Powered</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-accent" />
              <span>Brand Consistency</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-accent" />
              <span>Production Ready</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>;
};
export default ChallengeSection;