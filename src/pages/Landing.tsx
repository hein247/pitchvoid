import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import Navbar from '@/components/Navbar';
import HowItWorks from '@/components/landing/HowItWorks';
import AnimatedShaderBackground from '@/components/ui/animated-shader-background';
const Landing = () => {
  const navigate = useNavigate();
  return <div className="min-h-screen relative">
      <AnimatedShaderBackground />
      {/* Navigation */}
      <div className="relative z-10">
        <Navbar variant="landing" />

        {/* Hero Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-8 pt-8 sm:pt-20 pb-16 sm:pb-28">
          <div className="max-w-2xl mx-auto text-center">
            <div className="animate-slideUp">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl leading-[1.1] text-foreground mb-5 sm:mb-7" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
                Too much to say.
                <br />
                <span className="brand-gradient-text">
                  Not enough time to think.
                </span>
              </h1>

              <p className="text-base sm:text-lg text-muted-foreground mb-8 sm:mb-10 max-w-md mx-auto leading-relaxed">Tell us the scenario in plain English. PitchVoid figures out who you're pitching or talking, why it matters, and crafts it for you.</p>

              <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 mb-5 justify-center">
                <button onClick={() => navigate('/dashboard')} className="w-full sm:w-auto px-7 sm:px-8 py-3.5 sm:py-4 rounded-xl text-primary-foreground font-medium magenta-gradient text-base sm:text-lg flex items-center justify-center gap-3 hover:opacity-90 transition-opacity group">
                  Try it free
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
                </button>
                <button onClick={() => navigate('/auth')} className="w-full sm:w-auto px-6 py-3.5 sm:py-4 rounded-xl bg-white text-background font-medium hover:bg-white/90 transition-colors">
                  Create Account
                </button>
              </div>

              <p className="text-sm text-muted-foreground">
                No signup required · <span className="kbd">⌘K</span> to quick pitch anywhere
              </p>
            </div>
          </div>
        </section>

        <HowItWorks />

        {/* CTA Section */}
        <section id="pricing" className="max-w-3xl mx-auto px-4 sm:px-8 py-16 sm:py-24 text-center">
          <h2 className="text-3xl sm:text-4xl text-foreground mb-4 sm:mb-6 font-display">
            Your next pitch is one sentence away.
          </h2>
          <p className="text-muted-foreground mb-6 sm:mb-8 text-sm sm:text-base max-w-lg mx-auto">
            3 free pitches, no credit card. Describe the scenario and let PitchVoid handle the rest.
          </p>
          <button onClick={() => navigate('/dashboard')} className="w-full sm:w-auto px-8 py-4 rounded-xl text-primary-foreground font-medium magenta-gradient text-lg hover:opacity-90 transition-opacity group inline-flex items-center gap-3">
            Start pitching
            <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </section>

        {/* Footer */}
        <footer className="border-t border-accent/10 py-6 sm:py-8 px-4 sm:px-8">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-lg font-display brand-gradient-text">
              PitchVoid
            </span>
            <p className="text-sm text-muted-foreground">© 2025 PitchVoid. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </div>;
};
export default Landing;