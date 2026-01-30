import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Crown, CreditCard, User, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { usePricing } from '@/hooks/usePricing';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { PRICING } from '@/lib/pricing';
import Navbar from '@/components/Navbar';

export default function Settings() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { userPlan, pitchCount, remainingPitches, subscriptionStatus, isPro, isTeams, isFree } = usePricing();
  const { toast } = useToast();
  const [isLoadingPortal, setIsLoadingPortal] = useState(false);

  const handleManageSubscription = async () => {
    setIsLoadingPortal(true);
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');
      
      if (error) throw error;
      
      if (data?.url) {
        window.open(data.url, '_blank');
      } else {
        throw new Error('No portal URL returned');
      }
    } catch (err) {
      console.error('Portal error:', err);
      toast({
        title: 'Unable to open billing portal',
        description: 'Please try again or contact support.',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingPortal(false);
    }
  };

  const planDetails = PRICING[userPlan];

  return (
    <div className="min-h-screen bg-background">
      <Navbar variant="dashboard" onSignOut={signOut} />

      <main className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/dashboard')}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        </div>

        {/* Account Card */}
        <Card className="mb-6 bg-card/50 border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Account
            </CardTitle>
            <CardDescription>Your account information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground">Email</label>
              <p className="text-foreground">{user?.email || 'Not signed in'}</p>
            </div>
            <Button variant="outline" onClick={signOut}>
              Sign Out
            </Button>
          </CardContent>
        </Card>

        {/* Subscription Card */}
        <Card className="mb-6 bg-card/50 border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-primary" />
              Subscription
            </CardTitle>
            <CardDescription>Manage your plan and billing</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Current Plan */}
            <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Current Plan</span>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                  isPro || isTeams 
                    ? 'bg-primary/20 text-primary' 
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {planDetails.name}
                </span>
              </div>
              <p className="text-lg font-semibold text-foreground">
                {planDetails.monthlyPrice === 0 
                  ? 'Free' 
                  : `$${planDetails.monthlyPrice}/month`
                }
              </p>
              {subscriptionStatus && subscriptionStatus !== 'active' && (
                <p className="text-xs text-amber-500 mt-1 capitalize">
                  Status: {subscriptionStatus}
                </p>
              )}
            </div>

            {/* Usage Stats */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-foreground">Usage</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg bg-accent/10 border border-accent/20">
                  <p className="text-xs text-muted-foreground">Pitches Created</p>
                  <p className="text-xl font-bold text-foreground">{pitchCount}</p>
                </div>
                <div className="p-3 rounded-lg bg-accent/10 border border-accent/20">
                  <p className="text-xs text-muted-foreground">
                    {isFree ? 'Remaining' : 'Limit'}
                  </p>
                  <p className="text-xl font-bold text-foreground">
                    {remainingPitches !== null ? remainingPitches : '∞'}
                  </p>
                </div>
              </div>
            </div>

            {/* Plan Features */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-foreground">Your Features</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  <span className="text-muted-foreground">
                    {planDetails.limits.totalPitches === null 
                      ? 'Unlimited pitches' 
                      : `${planDetails.limits.totalPitches} pitches`
                    }
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  <span className="text-muted-foreground">
                    Formats: {planDetails.limits.formats.join(', ')}
                  </span>
                </li>
                {planDetails.limits.canExport && (
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                    <span className="text-muted-foreground">Export & download</span>
                  </li>
                )}
              </ul>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-border">
              {isFree ? (
                <Button 
                  onClick={() => navigate('/pricing')}
                  className="flex-1 magenta-gradient text-white"
                >
                  <Crown className="w-4 h-4 mr-2" />
                  Upgrade to Pro
                </Button>
              ) : (
                <Button
                  variant="outline"
                  onClick={handleManageSubscription}
                  disabled={isLoadingPortal}
                  className="flex-1"
                >
                  {isLoadingPortal ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <CreditCard className="w-4 h-4 mr-2" />
                  )}
                  Manage Subscription
                </Button>
              )}
              <Button
                variant="ghost"
                onClick={() => navigate('/pricing')}
              >
                View Plans
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
