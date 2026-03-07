import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { lovable } from '@/integrations/lovable';
import { Loader2, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import ShaderBackground from '@/components/ui/ShaderBackground';
import PageTransition from '@/components/ui/PageTransition';

const Auth = () => {
  const navigate = useNavigate();
  const { signIn, signUp, user, loading } = useAuth();
  const { toast } = useToast();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(true);

  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isSignUp) {
        const { error } = await signUp(email, password);
        if (error) {
          toast({ title: "Sign up failed", description: error.message, variant: "destructive" });
        } else {
          navigate('/tour');
        }
      } else {
        const { error } = await signIn(email, password);
        if (error) {
          toast({ title: "Login failed", description: error.message, variant: "destructive" });
        } else {
          navigate('/dashboard');
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setIsLoading(true);
    try {
      const { error, redirected } = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      
      if (redirected) return;
      
      if (error) {
        toast({ title: "Google sign in failed", description: error.message, variant: "destructive" });
        setIsLoading(false);
        return;
      }
      
      navigate('/tour');
    } catch (err) {
      toast({ title: "Google sign in failed", description: "An unexpected error occurred", variant: "destructive" });
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center relative">
        <ShaderBackground />
        <div className="relative z-10">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <PageTransition><div className="min-h-screen flex flex-col relative">
      <ShaderBackground />
      <div className="relative z-10 flex flex-col flex-1">
        {/* Back navigation */}
        <nav className="px-8 py-6">
          <button 
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </button>
        </nav>

        <div className="flex-1 flex items-center justify-center p-4">
          <div className="glassmorphism-dark rounded-2xl p-8 w-full max-w-md animate-slideUp">
            {/* Header */}
            <div className="text-center mb-8">
              <button 
                onClick={() => navigate('/')}
                className="text-2xl font-semibold mb-2 font-display inline-block brand-gradient-text"
              >
                PitchVoid
              </button>
              <p className="text-muted-foreground text-sm">
                {isSignUp ? 'Create your free account' : 'Welcome back'}
              </p>
            </div>

            {/* Google Sign In */}
            <div className="mb-6">
              <button 
                onClick={handleGoogleAuth}
                disabled={isLoading}
                className="social-btn w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl text-foreground text-sm font-medium disabled:opacity-50"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </button>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-4 mb-6">
              <div className="flex-1 h-px bg-accent/20" />
              <span className="text-xs text-muted-foreground">or</span>
              <div className="flex-1 h-px bg-accent/20" />
            </div>

            {/* Email Form */}
            <form onSubmit={handleSubmit} className="space-y-4 mb-6">
              <input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                placeholder="Email" 
                className="input-field w-full px-4 py-3 rounded-xl text-foreground placeholder-muted-foreground text-sm"
                required
              />
              <input 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                placeholder="Password" 
                className="input-field w-full px-4 py-3 rounded-xl text-foreground placeholder-muted-foreground text-sm"
                required
                minLength={6}
              />
              
              <button 
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 rounded-xl text-primary-foreground font-medium magenta-gradient disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {isSignUp ? 'Creating...' : 'Signing in...'}
                  </>
                ) : (
                  isSignUp ? 'Create Account' : 'Sign In'
                )}
              </button>
            </form>

            {/* Toggle mode */}
            <button 
              onClick={() => setIsSignUp(!isSignUp)}
              className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
            </button>
          </div>
        </div>
      </div>
    </div></PageTransition>
  );
};

export default Auth;
