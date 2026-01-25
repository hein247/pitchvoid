import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Sparkles, Zap, FileText, MessageSquare, ArrowRight, Check } from 'lucide-react';
import GridBackground from '@/components/ui/GridBackground';
import GlassCard from '@/components/ui/GlassCard';
import ShimmerButton from '@/components/ui/ShimmerButton';

const Landing = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: FileText,
      title: 'Upload Your Documents',
      description: 'Drop your PDF or DOCX pitch decks and let AI understand your vision.',
    },
    {
      icon: MessageSquare,
      title: 'Describe Your Scenario',
      description: 'Chat with AI to explain your pitch context, audience, and goals.',
    },
    {
      icon: Zap,
      title: 'Generate Dynamic Slides',
      description: 'Get Anti-Gravity powered presentations with smooth animations.',
    },
  ];

  const benefits = [
    '10 free credits on signup',
    'AI-powered content generation',
    'Anti-Gravity animations',
    'Export to multiple formats',
  ];

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Animated Grid Background */}
      <GridBackground />

      {/* Navigation */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/60 backdrop-blur-xl border-b border-white/[0.05]">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-void-purple to-void-blue rounded-full flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-display text-xl font-medium text-foreground">PitchVoid</span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-4"
          >
            <Button variant="ghost" onClick={() => navigate('/portfolio')} className="text-muted-foreground hover:text-foreground">
              Portfolio
            </Button>
            <Button variant="ghost" onClick={() => navigate('/auth')} className="text-muted-foreground hover:text-foreground">
              Sign In
            </Button>
            <Button 
              onClick={() => navigate('/auth')} 
              className="uppercase-spaced text-xs bg-white/10 hover:bg-white/20 border border-white/10"
            >
              Get Started
            </Button>
          </motion.div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 relative">
        {/* Radial Gradient Glow behind headline */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] pointer-events-none">
          <div 
            className="absolute inset-0 opacity-40"
            style={{
              background: 'radial-gradient(ellipse at center, hsl(263 70% 58% / 0.4) 0%, hsl(217 91% 60% / 0.2) 40%, transparent 70%)',
            }}
          />
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            >
              <span className="inline-block uppercase-spaced text-xs text-muted-foreground mb-6 px-4 py-2 glass rounded-full">
                AI-Powered Pitch Creation
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="font-display text-5xl md:text-7xl font-light leading-[1.1] mb-6 text-foreground"
            >
              Transform your ideas into{' '}
              <span className="italic bg-gradient-to-r from-void-purple via-void-blue to-void-purple bg-clip-text text-transparent">
                stunning pitches
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="text-lg text-muted-foreground mb-10 max-w-xl mx-auto"
            >
              Upload your documents, describe your scenario, and let AI create 
              dynamic presentations with Anti-Gravity animations.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <ShimmerButton onClick={() => navigate('/auth')}>
                Start Creating
                <ArrowRight className="w-4 h-4" />
              </ShimmerButton>
              <Button 
                variant="outline" 
                size="lg"
                onClick={() => navigate('/portfolio')}
                className="h-14 px-8 uppercase-spaced text-sm bg-transparent border-white/20 text-foreground hover:bg-white/5 hover:border-white/30"
              >
                View Portfolio
              </Button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Floating Visual */}
      <section className="py-20 px-6 overflow-hidden relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-5xl mx-auto"
        >
          <GlassCard hover={false} className="aspect-[16/9] flex items-center justify-center relative">
            {/* Inner glow effect */}
            <div 
              className="absolute inset-0 opacity-30"
              style={{
                background: 'radial-gradient(ellipse at center, hsl(263 70% 58% / 0.2) 0%, transparent 60%)',
              }}
            />
            
            <motion.div
              animate={{ 
                y: [0, -10, 0],
                rotate: [0, 1, 0]
              }}
              transition={{ 
                duration: 4, 
                repeat: Infinity,
                ease: 'easeInOut'
              }}
              className="w-3/4 h-3/4 glass border border-white/10 shadow-2xl flex items-center justify-center relative"
            >
              <div className="text-center p-8">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-void-purple to-void-blue rounded-full flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                <p className="font-display text-2xl text-foreground">Your Pitch Preview</p>
                <p className="text-sm text-muted-foreground mt-2">Anti-Gravity animations enabled</p>
              </div>
            </motion.div>
            
            {/* Floating elements */}
            <motion.div
              animate={{ 
                y: [0, -15, 0],
                x: [0, 5, 0]
              }}
              transition={{ 
                duration: 5, 
                repeat: Infinity,
                ease: 'easeInOut',
                delay: 0.5
              }}
              className="absolute top-10 right-10 w-20 h-20 glass border border-white/10 shadow-lg flex items-center justify-center"
            >
              <FileText className="w-8 h-8 text-void-purple" />
            </motion.div>
            
            <motion.div
              animate={{ 
                y: [0, -20, 0],
                x: [0, -5, 0]
              }}
              transition={{ 
                duration: 6, 
                repeat: Infinity,
                ease: 'easeInOut',
                delay: 1
              }}
              className="absolute bottom-10 left-10 w-24 h-24 glass border border-white/10 shadow-lg flex items-center justify-center"
            >
              <MessageSquare className="w-10 h-10 text-void-blue" />
            </motion.div>
          </GlassCard>
        </motion.div>
      </section>

      {/* Features */}
      <section className="py-20 px-6 relative z-10">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <span className="uppercase-spaced text-xs text-muted-foreground">How It Works</span>
            <h2 className="font-display text-4xl md:text-5xl mt-4 text-foreground">Three simple steps</h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <GlassCard className="h-full">
                  <div className="w-14 h-14 bg-gradient-to-br from-void-purple/20 to-void-blue/20 border border-white/10 flex items-center justify-center mb-6">
                    <feature.icon className="w-7 h-7 text-void-purple" />
                  </div>
                  <h3 className="font-display text-xl mb-3 text-foreground">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 relative z-10">
        {/* Gradient glow for CTA section */}
        <div className="absolute inset-0 pointer-events-none">
          <div 
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] opacity-30"
            style={{
              background: 'radial-gradient(ellipse at center, hsl(263 70% 58% / 0.3) 0%, transparent 60%)',
            }}
          />
        </div>

        <div className="max-w-4xl mx-auto text-center relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="font-display text-4xl md:text-5xl mb-6 text-foreground">
              Ready to create your pitch?
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
              Sign up now and get 10 free credits to start creating stunning presentations.
            </p>
            
            <div className="flex flex-wrap justify-center gap-4 mb-10">
              {benefits.map((benefit, index) => (
                <motion.div
                  key={benefit}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className="flex items-center gap-2 px-4 py-2 glass text-sm text-foreground"
                >
                  <Check className="w-4 h-4 text-void-purple" />
                  {benefit}
                </motion.div>
              ))}
            </div>

            <ShimmerButton onClick={() => navigate('/auth')}>
              Get Started Free
              <ArrowRight className="w-4 h-4" />
            </ShimmerButton>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.05] py-12 px-6 relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gradient-to-br from-void-purple to-void-blue rounded-full flex items-center justify-center">
              <Sparkles className="w-3 h-3 text-white" />
            </div>
            <span className="font-display text-lg text-foreground">PitchVoid</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2024 PitchVoid. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
