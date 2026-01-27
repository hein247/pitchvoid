import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Mic, Menu } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { ThemeToggle } from '@/components/ui/theme-toggle';

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

        {/* Mobile menu using Sheet */}
        <Sheet>
          <SheetTrigger asChild>
            <button className="md:hidden p-2 text-foreground">
              <Menu className="w-6 h-6" />
            </button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[280px] bg-background border-l border-accent/20">
            <SheetHeader>
              <SheetTitle className="text-left font-display" style={{ 
                background: 'linear-gradient(135deg, #fff 0%, #D946EF 100%)', 
                WebkitBackgroundClip: 'text', 
                WebkitTextFillColor: 'transparent' 
              }}>
                PitchVoid
              </SheetTitle>
            </SheetHeader>
            <nav className="flex flex-col gap-4 mt-8">
              <a 
                href="#features" 
                className="text-sm text-muted-foreground hover:text-foreground transition-colors py-3 border-b border-accent/10"
              >
                Features
              </a>
              <a 
                href="#pricing" 
                className="text-sm text-muted-foreground hover:text-foreground transition-colors py-3 border-b border-accent/10"
              >
                Pricing
              </a>
              <button 
                onClick={() => navigate('/auth')} 
                className="text-sm text-foreground/80 hover:text-foreground transition-colors py-3 text-left border-b border-accent/10"
              >
                Log In
              </button>
              <button 
                onClick={() => navigate('/auth')} 
                className="mt-4 px-5 py-3 rounded-xl text-sm text-white font-medium magenta-gradient hover:opacity-90 transition-opacity w-full"
              >
                Get Started Free
              </button>
            </nav>
          </SheetContent>
        </Sheet>
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
          {/* Theme Toggle */}
          <ThemeToggle />
          
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
            className="hidden sm:flex items-center gap-3 px-4 py-2 rounded-xl bg-accent/10 border border-accent/20"
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
