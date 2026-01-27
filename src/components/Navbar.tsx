import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Mic } from 'lucide-react';

interface NavbarProps {
  variant?: 'landing' | 'dashboard' | 'minimal';
  credits?: { used: number; total: number };
  onQuickPitch?: () => void;
  onSignOut?: () => void;
}

const Navbar = ({ 
  variant = 'landing', 
  credits = { used: 0, total: 50 },
  onQuickPitch,
  onSignOut
}: NavbarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const isActive = (path: string) => location.pathname === path;

  // Landing/Auth variant - public pages
  if (variant === 'landing') {
    return (
      <nav className="relative z-10 px-8 py-6 flex items-center justify-between max-w-7xl mx-auto">
        <button 
          onClick={() => navigate('/')}
          className="text-2xl font-semibold font-display"
          style={{ 
            background: 'linear-gradient(135deg, #fff 0%, #D946EF 100%)', 
            WebkitBackgroundClip: 'text', 
            WebkitTextFillColor: 'transparent' 
          }}
        >
          PitchVoid
        </button>
        <div className="flex items-center gap-8">
          <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Features
          </a>
          <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Pricing
          </a>
          <button 
            onClick={() => navigate('/auth')} 
            className="text-sm text-foreground/80 hover:text-foreground transition-colors"
          >
            Log In
          </button>
          <button 
            onClick={() => navigate('/auth')} 
            className="px-5 py-2.5 rounded-xl text-sm text-white font-medium magenta-gradient hover:opacity-90 transition-opacity"
          >
            Get Started Free
          </button>
        </div>
      </nav>
    );
  }

  // Dashboard variant - authenticated pages
  if (variant === 'dashboard') {
    return (
      <nav className="glassmorphism px-6 py-4 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-8">
          <button 
            onClick={() => navigate('/dashboard')}
            className="text-xl font-semibold font-display"
            style={{ 
              background: 'linear-gradient(135deg, #fff 0%, #D946EF 100%)', 
              WebkitBackgroundClip: 'text', 
              WebkitTextFillColor: 'transparent' 
            }}
          >
            PitchVoid
          </button>
          <div className="flex items-center gap-6">
            <button 
              onClick={() => navigate('/dashboard')}
              className={`text-sm transition-colors ${
                isActive('/dashboard') ? 'text-foreground font-medium' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Dashboard
            </button>
            <button 
              onClick={() => {}}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Templates
            </button>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {onQuickPitch && (
            <button 
              onClick={onQuickPitch} 
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-medium magenta-gradient hover:opacity-90 transition-opacity"
            >
              <Mic className="w-5 h-5" />
              Quick Pitch <span className="text-xs opacity-70">⌘K</span>
            </button>
          )}
          <div 
            className="flex items-center gap-3 px-4 py-2 rounded-xl"
            style={{ background: 'rgba(139, 92, 246, 0.1)', border: '1px solid rgba(139, 92, 246, 0.2)' }}
          >
            <span className="text-sm text-foreground/80">{credits.total - credits.used} credits</span>
            <div className="w-16 h-1.5 credit-bar rounded-full overflow-hidden">
              <div 
                className="h-full credit-fill" 
                style={{ width: `${((credits.total - credits.used) / credits.total) * 100}%` }} 
              />
            </div>
          </div>
          {user && (
            <div 
              onClick={onSignOut}
              className="w-9 h-9 rounded-full magenta-gradient flex items-center justify-center text-white text-sm font-medium cursor-pointer hover:opacity-90 transition-opacity"
              title="Sign out"
            >
              {user.email?.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
      </nav>
    );
  }

  // Minimal variant - for auth/tour pages
  return (
    <nav className="relative z-10 px-8 py-6 flex items-center justify-center">
      <button 
        onClick={() => navigate('/')}
        className="text-2xl font-semibold font-display"
        style={{ 
          background: 'linear-gradient(135deg, #fff 0%, #D946EF 100%)', 
          WebkitBackgroundClip: 'text', 
          WebkitTextFillColor: 'transparent' 
        }}
      >
        PitchVoid
      </button>
    </nav>
  );
};

export default Navbar;
