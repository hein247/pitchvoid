import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { usePricing } from '@/hooks/usePricing';
import { Mic, Menu, Crown, Settings } from 'lucide-react';
import pitchvoidLogo from '@/assets/pitchvoid-logo.png';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

interface NavbarProps {
  variant?: 'landing' | 'dashboard' | 'minimal';
  onQuickPitch?: () => void;
  onSignOut?: () => void;
}

const Navbar = ({
  variant = 'landing',
  onQuickPitch,
  onSignOut
}: NavbarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { userPlan, isFree, credits } = usePricing();
  
  const isActive = (path: string) => location.pathname === path;

  // Landing/Auth variant - public pages
  if (variant === 'landing') {
    return (
      <nav className="relative z-10 px-4 sm:px-8 py-4 sm:py-6 flex items-center justify-between max-w-7xl mx-auto">
        <button
          onClick={() => navigate('/')}
          className="flex items-center"
        >
          <img src={pitchvoidLogo} alt="PitchVoid" className="h-7 sm:h-8" />
        </button>
        
        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-8">
          <button
            onClick={() => navigate('/why')}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Why The Void?
          </button>
          <button
            onClick={() => navigate('/pricing')}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Pricing
          </button>
          <button
            onClick={() => navigate('/blog')}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Blog
          </button>
          {user ? (
            <button
              onClick={() => navigate('/dashboard')}
              className="w-9 h-9 rounded-full brand-gradient flex items-center justify-center text-primary-foreground text-sm font-medium cursor-pointer hover:opacity-90 transition-opacity"
              title="Go to Dashboard"
            >
              {user.email?.charAt(0).toUpperCase()}
            </button>
          ) : (
            <>
              <button
                onClick={() => navigate('/auth')}
                className="text-sm text-foreground/80 hover:text-foreground transition-colors"
              >
                Log In
              </button>
              <button
                onClick={() => navigate('/auth')}
                className="px-5 py-2.5 rounded-xl text-sm text-primary-foreground font-medium brand-gradient hover:opacity-90 transition-opacity"
              >
                Get Started Free
              </button>
            </>
          )}
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
              <SheetTitle className="text-left">
                <img src={pitchvoidLogo} alt="PitchVoid" className="h-12" />
              </SheetTitle>
            </SheetHeader>
            <nav className="flex flex-col gap-4 mt-8">
              <button
                onClick={() => navigate('/why')}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors py-3 text-left border-b border-accent/10"
              >
                Why The Void?
              </button>
              <button
                onClick={() => navigate('/pricing')}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors py-3 text-left border-b border-accent/10"
              >
                Pricing
              </button>
              <button
                onClick={() => navigate('/blog')}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors py-3 text-left border-b border-accent/10"
              >
                Blog
              </button>
              {user ? (
                <button
                  onClick={() => navigate('/dashboard')}
                  className="mt-4 px-5 py-3 rounded-xl text-sm text-primary-foreground font-medium brand-gradient hover:opacity-90 transition-opacity w-full"
                >
                  Go to Dashboard
                </button>
              ) : (
                <>
                  <button
                    onClick={() => navigate('/auth')}
                    className="text-sm text-foreground/80 hover:text-foreground transition-colors py-3 text-left border-b border-accent/10"
                  >
                    Log In
                  </button>
                  <button
                    onClick={() => navigate('/auth')}
                    className="mt-4 px-5 py-3 rounded-xl text-sm text-primary-foreground font-medium brand-gradient hover:opacity-90 transition-opacity w-full"
                  >
                    Get Started Free
                  </button>
                </>
              )}
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
        <button
          onClick={() => navigate('/')}
          className="flex items-center"
        >
          <img src={pitchvoidLogo} alt="PitchVoid" className="h-10 sm:h-12" />
        </button>
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Credit pill — tappable, goes to pricing */}
          <button
            onClick={() => navigate('/pricing')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] transition-colors cursor-pointer ${
              credits <= 1 && credits > 0
                ? 'text-[rgba(234,179,8,0.6)]'
                : credits === 0
                  ? 'text-destructive/60'
                  : 'text-foreground'
            }`}
            title="Get more credits"
          >
            {credits} credit{credits !== 1 ? 's' : ''}
          </button>
          
          {/* Settings */}
          <button
            onClick={() => navigate('/settings')}
            className="p-2 text-muted-foreground hover:text-foreground transition-colors"
            title="Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
          
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-full brand-gradient flex items-center justify-center text-primary-foreground text-sm font-medium cursor-pointer hover:opacity-90 transition-opacity"
                  title="Account"
                >
                  {user.email?.charAt(0).toUpperCase()}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-popover border-border z-50">
                {!isFree && (
                  <DropdownMenuItem className="gap-2">
                    <Crown className="w-4 h-4 text-primary" />
                    <span className="capitalize">{userPlan} Plan</span>
                  </DropdownMenuItem>
                )}
                {isFree && (
                  <DropdownMenuItem onClick={() => navigate('/pricing')} className="gap-2">
                    <Crown className="w-4 h-4 text-primary" />
                    Upgrade to Pro
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onSignOut} className="gap-2 text-destructive focus:text-destructive">
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
        className="flex items-center"
      >
        <img src={pitchvoidLogo} alt="PitchVoid" className="h-12 sm:h-14" />
      </button>
    </nav>
  );
};

export default Navbar;
