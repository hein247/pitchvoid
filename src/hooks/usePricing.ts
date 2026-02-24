import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import {
  PlanType,
  PlanInterval,
  PaywallAction,
  ActionCheckOptions,
  PaywallCheckResult,
  canUserPerformAction,
  getRemainingPitches,
  getNudgeMessage,
  PRICING,
} from '@/lib/pricing';

export interface UserPricingData {
  plan: PlanType;
  planInterval: PlanInterval;
  pitchCount: number;
  credits: number;
  subscriptionStatus: string | null;
  currentPeriodEnd: Date | null;
  teamId: string | null;
  teamRole: string | null;
}

export interface UsePricingReturn {
  // Data
  userPlan: PlanType;
  credits: number;
  pitchCount: number;
  nudgeMessage: string | null;
  subscriptionStatus: string | null;
  isLoading: boolean;
  
  // Helpers
  canPerformAction: (action: PaywallAction, options?: ActionCheckOptions) => PaywallCheckResult;
  checkAndTriggerPaywall: (action: PaywallAction, options?: ActionCheckOptions) => boolean;
  optimisticDecrementCredits: () => void;
  refreshCredits: () => Promise<void>;
  
  // Paywall modal state
  showPaywall: boolean;
  paywallType: 'pitch_limit' | 'feature_locked' | null;
  paywallMessage: string | null;
  setShowPaywall: (show: boolean) => void;
  
  // Nudge state
  showNudge: boolean;
  dismissNudge: () => void;
  
  // Plan info
  planLimits: typeof PRICING[PlanType]['limits'];
  isPro: boolean;
  isTeams: boolean;
  isFree: boolean;
}

export function usePricing(): UsePricingReturn {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [pricingData, setPricingData] = useState<UserPricingData>({
    plan: 'free',
    planInterval: null,
    pitchCount: 0,
    credits: 3,
    subscriptionStatus: null,
    currentPeriodEnd: null,
    teamId: null,
    teamRole: null,
  });
  
  // Paywall modal state
  const [showPaywall, setShowPaywall] = useState(false);
  const [paywallType, setPaywallType] = useState<'pitch_limit' | 'feature_locked' | null>(null);
  const [paywallMessage, setPaywallMessage] = useState<string | null>(null);
  
  // Nudge state
  const [showNudge, setShowNudge] = useState(false);
  const [nudgeDismissed, setNudgeDismissed] = useState(false);

  // Fetch user pricing data from database
  useEffect(() => {
    async function fetchPricingData() {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('plan, plan_interval, pitch_count, credits, subscription_status, current_period_end, team_id, team_role')
          .eq('id', user.id)
          .maybeSingle();

        if (error) {
          console.error('Error fetching pricing data:', error);
          return;
        }

        if (data) {
          setPricingData({
            plan: (data.plan as PlanType) || 'free',
            planInterval: data.plan_interval as PlanInterval,
            pitchCount: data.pitch_count || 0,
            credits: data.credits ?? 3,
            subscriptionStatus: data.subscription_status,
            currentPeriodEnd: data.current_period_end ? new Date(data.current_period_end) : null,
            teamId: data.team_id,
            teamRole: data.team_role,
          });
        }
      } catch (err) {
        console.error('Error in fetchPricingData:', err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchPricingData();
  }, [user?.id]);

  // Update nudge visibility based on credits
  useEffect(() => {
    if (nudgeDismissed) return;
    
    if (pricingData.credits <= 1 && pricingData.credits >= 0) {
      setShowNudge(true);
    }
  }, [pricingData.credits, nudgeDismissed]);

  const canPerformAction = useCallback(
    (action: PaywallAction, options: ActionCheckOptions = {}): PaywallCheckResult => {
      return canUserPerformAction(pricingData.plan, pricingData.pitchCount, action, options);
    },
    [pricingData.plan, pricingData.pitchCount]
  );

  const checkAndTriggerPaywall = useCallback(
    (action: PaywallAction, options: ActionCheckOptions = {}): boolean => {
      const result = canPerformAction(action, options);
      
      if (!result.allowed) {
        setPaywallType(result.reason === 'pitch_limit' ? 'pitch_limit' : 'feature_locked');
        setPaywallMessage(result.upgradeMessage || null);
        setShowPaywall(true);
        return false;
      }
      
      return true;
    },
    [canPerformAction]
  );

  /**
   * Optimistic UI update for credits after generation.
   * The actual decrement happens server-side in edge functions.
   */
  const optimisticDecrementCredits = useCallback(() => {
    setPricingData(prev => ({
      ...prev,
      credits: Math.max(0, prev.credits - 1),
      pitchCount: prev.pitchCount + 1,
    }));
  }, []);

  /**
   * Refresh credits from the server to sync with database
   */
  const refreshCredits = useCallback(async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('pitch_count, credits')
        .eq('id', user.id)
        .single();

      if (!error && data) {
        setPricingData(prev => ({
          ...prev,
          pitchCount: data.pitch_count || 0,
          credits: data.credits ?? 0,
        }));
      }
    } catch (err) {
      console.error('Error refreshing credits:', err);
    }
  }, [user?.id]);

  const dismissNudge = useCallback(() => {
    setShowNudge(false);
    setNudgeDismissed(true);
  }, []);

  const nudgeMessage = pricingData.credits === 1 ? '1 credit left' : null;

  return {
    // Data
    userPlan: pricingData.plan,
    credits: pricingData.credits,
    pitchCount: pricingData.pitchCount,
    nudgeMessage,
    subscriptionStatus: pricingData.subscriptionStatus,
    isLoading,
    
    // Helpers
    canPerformAction,
    checkAndTriggerPaywall,
    optimisticDecrementCredits,
    refreshCredits,
    
    // Paywall modal state
    showPaywall,
    paywallType,
    paywallMessage,
    setShowPaywall,
    
    // Nudge state
    showNudge,
    dismissNudge,
    
    // Plan info
    planLimits: PRICING[pricingData.plan].limits,
    isPro: pricingData.plan === 'pro',
    isTeams: pricingData.plan === 'teams',
    isFree: pricingData.plan === 'free',
  };
}
