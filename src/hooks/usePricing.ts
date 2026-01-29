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
  subscriptionStatus: string | null;
  currentPeriodEnd: Date | null;
  teamId: string | null;
  teamRole: string | null;
}

export interface UsePricingReturn {
  // Data
  userPlan: PlanType;
  pitchCount: number;
  remainingPitches: number | null;
  nudgeMessage: string | null;
  subscriptionStatus: string | null;
  isLoading: boolean;
  
  // Helpers
  canPerformAction: (action: PaywallAction, options?: ActionCheckOptions) => PaywallCheckResult;
  checkAndTriggerPaywall: (action: PaywallAction, options?: ActionCheckOptions) => boolean;
  incrementPitchCount: () => Promise<void>;
  
  // Paywall modal state
  showPaywall: boolean;
  paywallType: 'pitch_limit' | 'feature_locked' | 'slide_limit' | null;
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
    subscriptionStatus: null,
    currentPeriodEnd: null,
    teamId: null,
    teamRole: null,
  });
  
  // Paywall modal state
  const [showPaywall, setShowPaywall] = useState(false);
  const [paywallType, setPaywallType] = useState<'pitch_limit' | 'feature_locked' | 'slide_limit' | null>(null);
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
          .select('plan, plan_interval, pitch_count, subscription_status, current_period_end, team_id, team_role')
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

  // Update nudge visibility based on remaining pitches
  useEffect(() => {
    if (nudgeDismissed) return;
    
    const remaining = getRemainingPitches(pricingData.plan, pricingData.pitchCount);
    if (remaining !== null && remaining <= 1 && pricingData.plan === 'free') {
      setShowNudge(true);
    }
  }, [pricingData.plan, pricingData.pitchCount, nudgeDismissed]);

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
        setPaywallType(result.reason as 'pitch_limit' | 'feature_locked' | 'slide_limit');
        setPaywallMessage(result.upgradeMessage || null);
        setShowPaywall(true);
        return false;
      }
      
      return true;
    },
    [canPerformAction]
  );

  const incrementPitchCount = useCallback(async () => {
    if (!user?.id) return;

    try {
      const newCount = pricingData.pitchCount + 1;
      
      const { error } = await supabase
        .from('profiles')
        .update({
          pitch_count: newCount,
          last_pitch_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) {
        console.error('Error incrementing pitch count:', error);
        return;
      }

      setPricingData(prev => ({
        ...prev,
        pitchCount: newCount,
      }));
    } catch (err) {
      console.error('Error in incrementPitchCount:', err);
    }
  }, [user?.id, pricingData.pitchCount]);

  const dismissNudge = useCallback(() => {
    setShowNudge(false);
    setNudgeDismissed(true);
  }, []);

  const remainingPitches = getRemainingPitches(pricingData.plan, pricingData.pitchCount);
  const nudgeMessage = getNudgeMessage(remainingPitches);

  return {
    // Data
    userPlan: pricingData.plan,
    pitchCount: pricingData.pitchCount,
    remainingPitches,
    nudgeMessage,
    subscriptionStatus: pricingData.subscriptionStatus,
    isLoading,
    
    // Helpers
    canPerformAction,
    checkAndTriggerPaywall,
    incrementPitchCount,
    
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
