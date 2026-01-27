import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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
          toast({
            title: "Sign up failed",
            description: error.message,
            variant: "destructive"
          });
        } else {
          navigate('/tour');
        }
      } else {
        const { error } = await signIn(email, password);
        if (error) {
          toast({
            title: "Login failed",
            description: error.message,
            variant: "destructive"
          });
        } else {
          navigate('/dashboard');
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialAuth = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      navigate('/tour');
    }, 1500);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#0F0518' }}>
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen grain-bg hero-gradient flex flex-col" style={{ backgroundColor: '#0F0518' }}>
      {/* Back navigation */}
      <nav className="relative z-10 px-8 py-6">
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
              className="text-2xl font-semibold mb-2 font-display inline-block"
              style={{ 
                background: 'linear-gradient(135deg, #fff 0%, #D946EF 100%)', 
                WebkitBackgroundClip: 'text', 
                WebkitTextFillColor: 'transparent' 
              }}
            >
              PitchVoid
            </button>
            <p className="text-muted-foreground text-sm">
              {isSignUp ? 'Create your free account' : 'Welcome back'}
            </p>
          </div>

          {/* Social Buttons */}
          <div className="space-y-3 mb-6">
            <button 
              onClick={handleSocialAuth}
              className="social-btn w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl text-foreground text-sm font-medium"
            >
              🔵 Continue with Google
            </button>
            <button 
              onClick={handleSocialAuth}
              className="social-btn w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl text-foreground text-sm font-medium"
            >
              💼 Continue with LinkedIn
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
              placeholder="you@company.com" 
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
              className="w-full py-3.5 rounded-xl text-white font-medium magenta-gradient disabled:opacity-50 flex items-center justify-center gap-2"
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
  );
};

export default Auth;
