import { useNavigate } from 'react-router-dom';
import { Mic } from 'lucide-react';
import Navbar from '@/components/Navbar';

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen grain-bg hero-gradient relative" style={{ backgroundColor: '#0F0518' }}>
      {/* Navigation */}
      <Navbar variant="landing" />

      {/* Hero Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-8 pt-16 pb-24">
        <div className="grid grid-cols-2 gap-16 items-center">
          {/* Left - Copy */}
          <div className="animate-slideUp">
            <div 
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6"
              style={{ 
                background: 'rgba(217, 70, 239, 0.1)', 
                border: '1px solid rgba(217, 70, 239, 0.2)' 
              }}
            >
              <span className="w-2 h-2 rounded-full magenta-gradient animate-pulse" />
              <span className="text-xs text-primary/80">AI-Powered Pitch Generation</span>
            </div>
            
            <h2 className="text-5xl leading-tight text-foreground mb-6 font-display">
              Turn your ideas into a{' '}
              <span 
                style={{ 
                  background: 'linear-gradient(135deg, #D946EF 0%, #8B5CF6 100%)', 
                  WebkitBackgroundClip: 'text', 
                  WebkitTextFillColor: 'transparent' 
                }}
              >
                tailored pitch
              </span>{' '}
              in minutes
            </h2>
            
            <p className="text-lg text-muted-foreground mb-8 max-w-lg">
              Upload materials, describe your scenario, and let AI craft a beautiful presentation.
            </p>
            
            <div className="flex items-center gap-4 mb-4">
              <button 
                onClick={() => navigate('/dashboard')}
                className="px-8 py-4 rounded-xl text-white font-medium magenta-gradient text-lg flex items-center gap-3 hover:opacity-90 transition-opacity"
              >
                <Mic className="w-6 h-6" />
                Quick Pitch — No Signup
              </button>
              <button 
                onClick={() => navigate('/auth')}
                className="px-6 py-4 rounded-xl text-foreground/80 border border-accent/30 hover:bg-accent/10 transition-colors"
              >
                Create Account
              </button>
            </div>
            
            <p className="text-sm text-muted-foreground">
              <span className="kbd">⌘K</span> to quick pitch anywhere
            </p>
          </div>

          {/* Right - Preview */}
          <div className="relative animate-float">
            <div 
              className="glassmorphism-dark rounded-2xl overflow-hidden"
              style={{ boxShadow: '0 40px 80px rgba(0,0,0,0.5)' }}
            >
              <div className="px-4 py-3 flex items-center gap-2 border-b border-accent/10">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-destructive/60" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                  <div className="w-3 h-3 rounded-full bg-green-500/60" />
                </div>
              </div>
              <div className="p-6 grid grid-cols-2 gap-4">
                {['About Me', 'Challenge', 'Approach', 'Results'].map((title, i) => (
                  <div 
                    key={i} 
                    className="rounded-xl p-4"
                    style={{ 
                      background: 'linear-gradient(145deg, rgba(139, 92, 246, 0.1) 0%, rgba(15, 5, 24, 0.8) 100%)', 
                      border: '1px solid rgba(139, 92, 246, 0.2)' 
                    }}
                  >
                    <span className="text-xs text-muted-foreground">0{i + 1}</span>
                    <p className="text-sm text-foreground mt-1 font-medium">{title}</p>
                    <div className="mt-3 space-y-1.5">
                      <div className="h-1.5 rounded-full bg-accent/20 w-full" />
                      <div className="h-1.5 rounded-full bg-accent/20 w-3/4" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative z-10 max-w-7xl mx-auto px-8 py-24">
        <div className="text-center mb-16">
          <h3 className="text-3xl text-foreground mb-4 font-display">How It Works</h3>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Three simple steps to create stunning presentations
          </p>
        </div>
        
        <div className="grid grid-cols-3 gap-8">
          {[
            { icon: '📁', title: 'Create a Project', desc: 'Name your pitch—interview, proposal, or deck.' },
            { icon: '📎', title: 'Attach Files', desc: 'Upload your resume, case studies, or context.' },
            { icon: '⚡', title: 'Generate', desc: 'AI crafts a tailored presentation in seconds.' },
          ].map((step, i) => (
            <div 
              key={i}
              className="glassmorphism-dark rounded-2xl p-8 text-center hover:border-primary/40 transition-colors"
            >
              <div className="w-16 h-16 mx-auto mb-6 rounded-xl magenta-gradient flex items-center justify-center">
                <span className="text-2xl">{step.icon}</span>
              </div>
              <h4 className="text-xl text-foreground mb-3 font-display">{step.title}</h4>
              <p className="text-muted-foreground text-sm">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section id="pricing" className="relative z-10 max-w-3xl mx-auto px-8 py-24 text-center">
        <h3 className="text-4xl text-foreground mb-6 font-display">Ready to create your pitch?</h3>
        <p className="text-muted-foreground mb-8">
          Sign up now and get 10 free credits to start creating stunning presentations.
        </p>
        <button 
          onClick={() => navigate('/auth')}
          className="px-8 py-4 rounded-xl text-white font-medium magenta-gradient text-lg hover:opacity-90 transition-opacity"
        >
          Get Started Free
        </button>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-accent/10 py-8 px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <span 
            className="text-lg font-display"
            style={{ 
              background: 'linear-gradient(135deg, #fff 0%, #D946EF 100%)', 
              WebkitBackgroundClip: 'text', 
              WebkitTextFillColor: 'transparent' 
            }}
          >
            PitchVoid
          </span>
          <p className="text-sm text-muted-foreground">© 2024 PitchVoid. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
