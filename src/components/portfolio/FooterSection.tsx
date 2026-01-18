import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
const FooterSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, {
    once: true,
    margin: "-100px"
  });
  return <footer className="py-32 px-6 bg-foreground text-background" ref={ref}>
      <div className="max-w-4xl mx-auto text-center">
        <motion.div initial={{
        opacity: 0,
        y: 40
      }} animate={isInView ? {
        opacity: 1,
        y: 0
      } : {}} transition={{
        duration: 0.8
      }} className="space-y-8">
          <p className="text-xs tracking-[0.25em] uppercase text-background/50">PROPOSAL</p>
          
          <h2 className="font-display text-4xl md:text-5xl font-light">
            Thank You
          </h2>
          
          <p className="text-base text-background/60 max-w-xl mx-auto leading-relaxed">This presentation demonstrates how AI tools can accelerate my creative workflows while maintaining the quality and brand consistency that defines Mejuri.</p>

          <div className="pt-8 border-t border-background/10">
            <div className="space-y-4">
              <p className="font-display text-2xl">Ready to discuss</p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-background/60">
                <a className="hover:text-background transition-colors" href="mailto:heinthantaung.1993@gmail.com">
                  ​Email
                </a>
                <span className="hidden sm:inline">•</span>
                <a href="https://www.linkedin.com/in/heinthantaung/" target="_blank" rel="noopener noreferrer" className="hover:text-background transition-colors">
                  LinkedIn
                </a>
                <span className="hidden sm:inline">•</span>
                <a href="https://heinforever.com" target="_blank" rel="noopener noreferrer" className="hover:text-background transition-colors">
                  Portfolio
                </a>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div initial={{
        opacity: 0
      }} animate={isInView ? {
        opacity: 1
      } : {}} transition={{
        duration: 0.8,
        delay: 0.4
      }} className="mt-20 pt-8 border-t border-background/10">
          <p className="text-xs text-background/40">
            Campaign variations created using AI tools for demonstration purposes only.
            <br />
            Mejuri brand assets used for portfolio/test purposes.
          </p>
        </motion.div>
      </div>
    </footer>;
};
export default FooterSection;