import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import PageTransition from '@/components/ui/PageTransition';
import AnimatedShaderBackground from '@/components/ui/animated-shader-background';
import { motion } from 'framer-motion';

const Blog = () => {
  return (
    <PageTransition>
      <div className="min-h-screen relative bg-[radial-gradient(ellipse_at_top,_hsl(25_75%_65%/0.08)_0%,_transparent_50%),_radial-gradient(ellipse_at_bottom_right,_hsl(260_60%_55%/0.06)_0%,_transparent_50%)]">
        <AnimatedShaderBackground />
        <div className="relative z-10">
          <Navbar variant="landing" />

          <section className="max-w-2xl mx-auto px-4 sm:px-8 pt-24 sm:pt-36 pb-32 sm:pb-48 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="space-y-6"
            >
              <p className="text-xs tracking-[0.25em] uppercase text-primary/75 font-bold">
                Blog
              </p>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl text-foreground font-display leading-[1.15]">
                Coming Soon
              </h1>
              <p className="text-base sm:text-lg text-muted-foreground max-w-md mx-auto leading-relaxed">
                We're working on something. Stories, ideas, and lessons from the void. Stay tuned.
              </p>
            </motion.div>
          </section>

          <Footer />
        </div>
      </div>
    </PageTransition>
  );
};

export default Blog;
