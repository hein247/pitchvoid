import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import PageTransition from '@/components/ui/PageTransition';
import AnimatedShaderBackground from '@/components/ui/animated-shader-background';
import { motion } from 'framer-motion';

const Why = () => {
  return (
    <PageTransition>
      <div className="min-h-screen relative bg-[radial-gradient(ellipse_at_top,_hsl(25_75%_65%/0.08)_0%,_transparent_50%),_radial-gradient(ellipse_at_bottom_right,_hsl(260_60%_55%/0.06)_0%,_transparent_50%)]">
        <AnimatedShaderBackground />
        <div className="relative z-10">
          <Navbar variant="landing" />

          <section className="max-w-2xl mx-auto px-4 sm:px-8 pt-12 sm:pt-24 pb-20 sm:pb-32">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            >
              <h1 className="text-3xl sm:text-4xl lg:text-5xl text-foreground mb-10 sm:mb-14 font-display leading-[1.15]">
                Why The Void?
              </h1>

              <div className="space-y-8 text-base sm:text-lg text-muted-foreground leading-relaxed">
                <p>
                  Every AI tool wants to give you <em className="text-foreground not-italic font-medium">more</em>. More words. More paragraphs. More suggestions. More.
                </p>

                <p className="text-foreground text-lg sm:text-xl font-medium">
                  PitchVoid gives you less.
                </p>

                <p>
                  Dump whatever's in your head, a pitch, an idea, a conversation you've been avoiding, a half-baked thought you'll forget by tomorrow. PitchVoid finds the structure hiding inside your mess and hands it back clean. Three sections. Your words. Nothing invented.
                </p>

                <p>
                  It's not a writing tool and it doesn't think for you. It shows you what you're already thinking, and just organized enough to actually use.
                </p>
              </div>
            </motion.div>
          </section>

          <Footer />
        </div>
      </div>
    </PageTransition>
  );
};

export default Why;
