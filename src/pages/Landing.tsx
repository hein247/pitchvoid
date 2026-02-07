import { useNavigate } from 'react-router-dom';
import { ArrowRight, Brain, FileText, Zap } from 'lucide-react';
import Navbar from '@/components/Navbar';
import ShaderBackground from '@/components/ui/ShaderBackground';
import HeroDemoInput from '@/components/landing/HeroDemoInput';

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen relative">
      <ShaderBackground />
      {/* Navigation */}
      <div className="relative z-10">
        <Navbar variant="landing" />

        {/* Hero Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-8 pt-8 sm:pt-20 pb-16 sm:pb-28">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            {/* Left - Copy */}
            <div className="animate-slideUp text-center lg:text-left">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl leading-[1.1] text-foreground mb-5 sm:mb-7 font-display">
                Describe your pitch.{' '}
                <span className="brand-gradient-text">
                  We build it.
                </span>
              </h1>

              <p className="text-base sm:text-lg text-muted-foreground mb-8 sm:mb-10 max-w-md mx-auto lg:mx-0 leading-relaxed">
                Tell us the scenario in plain English. PitchVoid figures out who you're pitching, why it matters, and crafts it for you.
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 mb-5 justify-center lg:justify-start">
                <button
                  onClick={() => navigate('/dashboard')}
                  className="w-full sm:w-auto px-7 sm:px-8 py-3.5 sm:py-4 rounded-xl text-primary-foreground font-medium magenta-gradient text-base sm:text-lg flex items-center justify-center gap-3 hover:opacity-90 transition-opacity group"
                >
                  Try it free
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
                </button>
                <button
                  onClick={() => navigate('/auth')}
                  className="w-full sm:w-auto px-6 py-3.5 sm:py-4 rounded-xl text-foreground/80 border border-border hover:bg-accent/10 transition-colors"
                >
                  Create Account
                </button>
              </div>

              <p className="text-sm text-muted-foreground">
                No signup required · <span className="kbd">⌘K</span> to quick pitch anywhere
              </p>
            </div>

            {/* Right - Live Demo */}
            <div className="animate-slideUp" style={{ animationDelay: '0.15s' }}>
              <HeroDemoInput />
            </div>
          </div>
        </section>

        {/* How It Works — rewritten */}
        <section id="features" className="max-w-7xl mx-auto px-4 sm:px-8 py-16 sm:py-24">
          <div className="text-center mb-10 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl text-foreground mb-4 font-display">
              You talk. The AI thinks. The pitch writes itself.
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto text-sm sm:text-base">
              No templates to fill, no slides to arrange — just describe the situation.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {[
              {
                icon: <Brain className="w-6 h-6 text-primary-foreground" />,
                title: 'Describe the scenario',
                desc: '"I\'m pitching to the board next Tuesday about Q3 results." That\'s all we need.',
              },
              {
                icon: <Zap className="w-6 h-6 text-primary-foreground" />,
                title: 'AI parses the intent',
                desc: 'We extract audience, subject, goal, and tone — then recommend the perfect format.',
              },
              {
                icon: <FileText className="w-6 h-6 text-primary-foreground" />,
                title: 'Get a tailored pitch',
                desc: 'A polished one-pager or timed script, ready to share, refine, or present.',
              },
            ].map((step, i) => (
              <div
                key={i}
                className="glassmorphism-dark rounded-2xl p-6 sm:p-8 text-center hover:border-primary/40 transition-colors"
              >
                <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-4 sm:mb-6 rounded-xl magenta-gradient flex items-center justify-center">
                  {step.icon}
                </div>
                <h3 className="text-lg sm:text-xl text-foreground mb-2 sm:mb-3 font-display">{step.title}</h3>
                <p className="text-muted-foreground text-sm">{step.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section id="pricing" className="max-w-3xl mx-auto px-4 sm:px-8 py-16 sm:py-24 text-center">
          <h2 className="text-3xl sm:text-4xl text-foreground mb-4 sm:mb-6 font-display">
            Your next pitch is one sentence away.
          </h2>
          <p className="text-muted-foreground mb-6 sm:mb-8 text-sm sm:text-base max-w-lg mx-auto">
            3 free pitches, no credit card. Describe the scenario and let PitchVoid handle the rest.
          </p>
          <button 
            onClick={() => navigate('/dashboard')}
            className="w-full sm:w-auto px-8 py-4 rounded-xl text-primary-foreground font-medium magenta-gradient text-lg hover:opacity-90 transition-opacity group inline-flex items-center gap-3"
          >
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
    </div>
  );
};

export default Landing;
