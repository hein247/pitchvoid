import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Navbar from '@/components/Navbar';
import HowItWorks from '@/components/landing/HowItWorks';
import AnimatedShaderBackground from '@/components/ui/animated-shader-background';
import Footer from '@/components/Footer';
import VoidTransition from '@/components/ui/VoidTransition';
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
  const navigate = useNavigate();
  const [wordIndex, setWordIndex] = useState(0);
  const [voidActive, setVoidActive] = useState(false);

  const enterVoid = useCallback(() => {
    setVoidActive(true);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setWordIndex((prev) => (prev + 1) % ROTATING_WORDS.length);
    }, 1800);
    return () => clearInterval(interval);
  }, []);
  return <PageTransition><div className="min-h-screen relative bg-[radial-gradient(ellipse_at_top,_hsl(25_75%_65%/0.08)_0%,_transparent_50%),_radial-gradient(ellipse_at_bottom_right,_hsl(260_60%_55%/0.06)_0%,_transparent_50%)]">
      <AnimatedShaderBackground />
      <VoidTransition isActive={voidActive} onComplete={() => navigate('/dashboard')} />
      {/* Navigation */}
      <div className="relative z-10">
        <Navbar variant="landing" />

        {/* Hero Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-8 pt-8 sm:pt-20 pb-16 sm:pb-28">
          <div className="max-w-2xl mx-auto text-center">
            <div className="animate-slideUp">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl leading-[1.1] text-foreground mb-5 sm:mb-7">
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

              <p className="text-base sm:text-lg text-muted-foreground mb-8 sm:mb-10 max-w-md mx-auto leading-relaxed">Dump your scattered thoughts. PitchVoid turns them into something you can actually walk in and say.</p>

              <div className="flex items-center gap-3 sm:gap-4 mb-5 justify-center">
                <button onClick={enterVoid} className="px-7 sm:px-8 py-3.5 sm:py-4 rounded-xl text-primary-foreground font-medium magenta-gradient text-base sm:text-lg inline-flex items-center gap-3 hover:opacity-90 transition-opacity group">
                  Try it free
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
                </button>
                
              </div>

              <p className="text-sm text-muted-foreground">
                3 free credits · works for meetings, ideas, conversations, and everything in between
              </p>
            </div>
          </div>
        </section>

        <HowItWorks />

        {/* CTA Section */}
        <section id="pricing" className="max-w-3xl mx-auto px-4 sm:px-8 py-8 sm:py-12 text-center">
          <h2 className="text-3xl sm:text-4xl text-foreground mb-4 sm:mb-6 font-display">
            Your next conversation is one brain dump away.
          </h2>
          <p className="text-muted-foreground mb-6 sm:mb-8 text-sm sm:text-base max-w-lg mx-auto">
            Concept, Investor pitch. Job interview. Difficult conversation. Whatever it is, just dump the mess and get the clarity.
          </p>
          <button onClick={enterVoid} className="px-8 py-4 rounded-xl text-primary-foreground font-medium magenta-gradient text-base sm:text-lg hover:opacity-90 transition-opacity group inline-flex items-center gap-3">
            Enter the void
            <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </section>

        <Footer />
      </div>
    </div></PageTransition>;
};
export default Landing;