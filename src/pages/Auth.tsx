import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Sparkles, ArrowLeft } from 'lucide-react';
import { z } from 'zod';
import GridBackground from '@/components/ui/GridBackground';
import GlassCard from '@/components/ui/GlassCard';
import ShimmerButton from '@/components/ui/ShimmerButton';

const emailSchema = z.string().email('Please enter a valid email address');
const passwordSchema = z.string().min(6, 'Password must be at least 6 characters');

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  
  const { signIn, signUp, user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};
    
    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) {
      newErrors.email = emailResult.error.errors[0].message;
    }
    
    const passwordResult = passwordSchema.safeParse(password);
    if (!passwordResult.success) {
      newErrors.password = passwordResult.error.errors[0].message;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          toast({
            variant: 'destructive',
            title: 'Sign in failed',
            description: error.message === 'Invalid login credentials' 
              ? 'Invalid email or password. Please try again.'
              : error.message,
          });
        } else {
          toast({
            title: 'Welcome back!',
            description: 'You have successfully signed in.',
          });
        }
      } else {
        const { error } = await signUp(email, password, fullName);
        if (error) {
          if (error.message.includes('already registered')) {
            toast({
              variant: 'destructive',
              title: 'Account exists',
              description: 'This email is already registered. Please sign in instead.',
            });
            setIsLogin(true);
          } else {
            toast({
              variant: 'destructive',
              title: 'Sign up failed',
              description: error.message,
            });
          }
        } else {
          toast({
            title: 'Account created!',
            description: 'Welcome to PitchVoid. You now have 10 free credits.',
          });
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <GridBackground />
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground relative z-10" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
      <GridBackground />

      {/* Header */}
      <header className="p-6 relative z-10">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/')}
          className="gap-2 text-muted-foreground hover:text-foreground hover:bg-[rgba(255,255,255,0.05)]"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
      </header>

      <main className="flex-1 flex items-center justify-center p-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md"
        >
          {/* Logo */}
          <div className="text-center mb-10">
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, type: 'spring' }}
              className="inline-flex items-center gap-3 mb-4"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-[hsl(263,70%,58%)] to-[hsl(217,91%,60%)] rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(139,92,246,0.4)]">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <span className="font-display text-3xl font-medium text-foreground tracking-wide">PitchVoid</span>
            </motion.div>
            <p className="text-muted-foreground">
              {isLogin ? 'Welcome back' : 'Create your account'}
            </p>
          </div>

          {/* Form Card */}
          <GlassCard hover={false} glow={false} className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <AnimatePresence mode="wait">
                {!isLogin && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Label htmlFor="fullName" className="text-sm uppercase tracking-[0.15em] text-muted-foreground">
                      Full Name
                    </Label>
                    <Input
                      id="fullName"
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Enter your name"
                      className="mt-2 bg-[rgba(255,255,255,0.03)] border-[rgba(255,255,255,0.1)] focus:border-[rgba(139,92,246,0.5)] focus:ring-[rgba(139,92,246,0.3)]"
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              <div>
                <Label htmlFor="email" className="text-sm uppercase tracking-[0.15em] text-muted-foreground">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) setErrors(prev => ({ ...prev, email: undefined }));
                  }}
                  placeholder="Enter your email"
                  className="mt-2 bg-[rgba(255,255,255,0.03)] border-[rgba(255,255,255,0.1)] focus:border-[rgba(139,92,246,0.5)] focus:ring-[rgba(139,92,246,0.3)]"
                />
                {errors.email && (
                  <p className="text-destructive text-sm mt-1">{errors.email}</p>
                )}
              </div>

              <div>
                <Label htmlFor="password" className="text-sm uppercase tracking-[0.15em] text-muted-foreground">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password) setErrors(prev => ({ ...prev, password: undefined }));
                  }}
                  placeholder="Enter your password"
                  className="mt-2 bg-[rgba(255,255,255,0.03)] border-[rgba(255,255,255,0.1)] focus:border-[rgba(139,92,246,0.5)] focus:ring-[rgba(139,92,246,0.3)]"
                />
                {errors.password && (
                  <p className="text-destructive text-sm mt-1">{errors.password}</p>
                )}
              </div>

              <ShimmerButton
                onClick={() => {}}
                className="w-full"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  isLogin ? 'Sign In' : 'Create Account'
                )}
              </ShimmerButton>
            </form>

            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setErrors({});
                }}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
              </button>
            </div>
          </GlassCard>
        </motion.div>
      </main>
    </div>
  );
};

export default Auth;
