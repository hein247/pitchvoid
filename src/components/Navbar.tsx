import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Mic, Menu, X } from 'lucide-react';

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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  // Landing/Auth variant - public pages
  if (variant === 'landing') {
    return (
      <nav className="relative z-10 px-4 sm:px-8 py-4 sm:py-6 flex items-center justify-between max-w-7xl mx-auto">
        <button 
          onClick={() => navigate('/')}
          className="text-xl sm:text-2xl font-semibold font-display"
          style={{ 
            background: 'linear-gradient(135deg, #fff 0%, #D946EF 100%)', 
            WebkitBackgroundClip: 'text', 
            WebkitTextFillColor: 'transparent' 
          }}
        >
          PitchVoid
        </button>
        
        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-8">
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

        {/* Mobile hamburger */}
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 text-foreground"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="absolute top-full left-0 right-0 glassmorphism-dark border-t border-accent/10 p-4 flex flex-col gap-4 md:hidden">
            <a 
              href="#features" 
              className="text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Features
            </a>
            <a 
              href="#pricing" 
              className="text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Pricing
            </a>
            <button 
              onClick={() => { navigate('/auth'); setMobileMenuOpen(false); }} 
              className="text-sm text-foreground/80 hover:text-foreground transition-colors py-2 text-left"
            >
              Log In
            </button>
            <button 
              onClick={() => { navigate('/auth'); setMobileMenuOpen(false); }} 
              className="px-5 py-2.5 rounded-xl text-sm text-white font-medium magenta-gradient hover:opacity-90 transition-opacity"
            >
              Get Started Free
            </button>
          </div>
        )}
      </nav>
    );
  }

  // Dashboard variant - authenticated pages
  if (variant === 'dashboard') {
    return (
      <nav className="glassmorphism px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-4 sm:gap-8">
          <button 
            onClick={() => navigate('/')}
            className="text-lg sm:text-xl font-semibold font-display"
            style={{ 
              background: 'linear-gradient(135deg, #fff 0%, #D946EF 100%)', 
              WebkitBackgroundClip: 'text', 
              WebkitTextFillColor: 'transparent' 
            }}
          >
            PitchVoid
          </button>
          <div className="hidden sm:flex items-center gap-6">
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
        <div className="flex items-center gap-2 sm:gap-4">
          {onQuickPitch && (
            <button 
              onClick={onQuickPitch} 
              className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 rounded-xl text-white text-sm font-medium magenta-gradient hover:opacity-90 transition-opacity"
            >
              <Mic className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Quick Pitch</span>
              <span className="hidden lg:inline text-xs opacity-70">⌘K</span>
            </button>
          )}
          <div 
            className="hidden sm:flex items-center gap-3 px-4 py-2 rounded-xl"
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
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full magenta-gradient flex items-center justify-center text-white text-sm font-medium cursor-pointer hover:opacity-90 transition-opacity"
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
    <nav className="relative z-10 px-4 sm:px-8 py-4 sm:py-6 flex items-center justify-center">
      <button 
        onClick={() => navigate('/')}
        className="text-xl sm:text-2xl font-semibold font-display"
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
