import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Navbar from '@/components/Navbar';
import HowItWorks from '@/components/landing/HowItWorks';
import LiveDemo from '@/components/landing/LiveDemo';

import Footer from '@/components/Footer';
import PageTransition from '@/components/ui/PageTransition';
const ROTATING_WORDS = ['process', 'analyze', 'prepare', 'articulate', 'connect'];

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.045, delayChildren: 0.02 }
  },
  exit: {
    transition: { duration: 0.18 }
  }
};

const letterVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring' as const,
      damping: 20,
      stiffness: 300
    }
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: { duration: 0.12, ease: 'easeIn' as const }
  }
};

const Landing = () => {
  const [wordIndex, setWordIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setWordIndex((prev) => (prev + 1) % ROTATING_WORDS.length);
    }, 1800);
    return () => clearInterval(interval);
  }, []);
  return <PageTransition><div className="min-h-screen relative bg-[radial-gradient(ellipse_at_top,_hsl(25_75%_65%/0.08)_0%,_transparent_50%),_radial-gradient(ellipse_at_bottom_right,_hsl(260_60%_55%/0.06)_0%,_transparent_50%)]">
      {/* Video background */}
      <div className="fixed inset-0 z-0 overflow-hidden">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover opacity-20"
          src="/videos/hero-bg.mp4"
        />
        <div className="absolute inset-0 bg-background/60" />
      </div>
      {/* Navigation */}
      <div className="relative z-10">
        <Navbar variant="landing" />

        {/* Hero Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-8 pt-8 sm:pt-20 pb-8 sm:pb-12">
          <div className="max-w-2xl mx-auto text-center">
            <div className="animate-slideUp">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.05] text-foreground mb-8 sm:mb-10 tracking-tight">
                Too much to say.
                <br />
                <span className="brand-gradient-text">
                  Not enough time to{' '}
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={ROTATING_WORDS[wordIndex]}
                      variants={containerVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      className="inline-flex brand-gradient-text">
                      
                      {ROTATING_WORDS[wordIndex].split('').map((char, i) =>
                      <motion.span key={i} variants={letterVariants}>
                          {char}
                        </motion.span>
                      )}
                      <motion.span variants={letterVariants}>.</motion.span>
                      <span className="animate-blink text-primary">|</span>
                    </motion.span>
                  </AnimatePresence>
                </span>
              </h1>
            </div>
          </div>

          <LiveDemo />

          <div className="max-w-2xl mx-auto text-center mt-10 sm:mt-12">
            <p className="text-base sm:text-lg text-muted-foreground mb-4 max-w-md mx-auto leading-relaxed">Dump your scattered thoughts. PitchVoid turns them into something you can actually walk in and say.</p>

            <p className="text-sm text-muted-foreground">
              3 free credits · works for meetings, ideas, conversations, and everything in between
            </p>
          </div>
        </section>
        <HowItWorks />


        <Footer />
      </div>
    </div></PageTransition>;
};
export default Landing;