// Pricing tier definitions and paywall logic

export type PlanType = 'free' | 'pro' | 'teams';
export type PlanInterval = 'month' | 'year' | null;

export interface PlanLimits {
  totalPitches: number | null; // null = unlimited
  maxSlides: number;
  formats: ('slides' | 'one-pager' | 'script')[];
  canExport: boolean;
  hasWatermark: boolean;
  hasPracticeMode: boolean;
  hasVersionHistory: boolean;
  hasPriorityGeneration: boolean;
}

export interface PlanDefinition {
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  limits: PlanLimits;
  popular?: boolean;
}

export const PRICING: Record<PlanType, PlanDefinition> = {
  free: {
    name: 'Free',
    description: 'Get started with AI-powered pitches',
    monthlyPrice: 0,
    yearlyPrice: 0,
    limits: {
      totalPitches: 3,
      maxSlides: 4,
      formats: ['slides'],
      canExport: false,
      hasWatermark: true,
      hasPracticeMode: false,
      hasVersionHistory: false,
      hasPriorityGeneration: false,
    },
  },
  pro: {
    name: 'Pro',
    description: 'Unlimited pitches with all formats',
    monthlyPrice: 9,
    yearlyPrice: 90,
    popular: true,
    limits: {
      totalPitches: null, // unlimited
      maxSlides: 12,
      formats: ['slides', 'one-pager', 'script'],
      canExport: true,
      hasWatermark: false,
      hasPracticeMode: true,
      hasVersionHistory: true,
      hasPriorityGeneration: true,
    },
  },
  teams: {
    name: 'Teams',
    description: 'Everything in Pro plus team features',
    monthlyPrice: 19,
    yearlyPrice: 190,
    limits: {
      totalPitches: null, // unlimited
      maxSlides: 15,
      formats: ['slides', 'one-pager', 'script'],
      canExport: true,
      hasWatermark: false,
      hasPracticeMode: true,
      hasVersionHistory: true,
      hasPriorityGeneration: true,
    },
  },
};

export type PaywallAction =
  | 'create_pitch'
  | 'use_format'
  | 'add_slide'
  | 'export'
  | 'practice_mode'
  | 'version_history';

export interface ActionCheckOptions {
  format?: 'slides' | 'one-pager' | 'script';
  currentSlideCount?: number;
}

export interface PaywallCheckResult {
  allowed: boolean;
  reason?: string;
  upgradeMessage?: string;
  requiredPlan?: PlanType;
}

/**
 * Check if a user can perform an action based on their plan
 */
export function canUserPerformAction(
  plan: PlanType,
  pitchCount: number,
  action: PaywallAction,
  options: ActionCheckOptions = {}
): PaywallCheckResult {
  const limits = PRICING[plan].limits;

  switch (action) {
    case 'create_pitch':
      if (limits.totalPitches !== null && pitchCount >= limits.totalPitches) {
        return {
          allowed: false,
          reason: 'pitch_limit',
          upgradeMessage: `You've used all ${limits.totalPitches} free pitches`,
          requiredPlan: 'pro',
        };
      }
      return { allowed: true };

    case 'use_format':
      if (options.format && !limits.formats.includes(options.format)) {
        const formatName = options.format === 'one-pager' ? 'One-Pager' : 'Script';
        return {
          allowed: false,
          reason: 'feature_locked',
          upgradeMessage: `${formatName} is a Pro feature`,
          requiredPlan: 'pro',
        };
      }
      return { allowed: true };

    case 'add_slide':
      if (options.currentSlideCount !== undefined && options.currentSlideCount >= limits.maxSlides) {
        return {
          allowed: false,
          reason: 'slide_limit',
          upgradeMessage: `Free tier is limited to ${limits.maxSlides} slides`,
          requiredPlan: 'pro',
        };
      }
      return { allowed: true };

    case 'export':
      if (!limits.canExport) {
        return {
          allowed: false,
          reason: 'feature_locked',
          upgradeMessage: 'Export is a Pro feature',
          requiredPlan: 'pro',
        };
      }
      return { allowed: true };

    case 'practice_mode':
      if (!limits.hasPracticeMode) {
        return {
          allowed: false,
          reason: 'feature_locked',
          upgradeMessage: 'Practice mode is a Pro feature',
          requiredPlan: 'pro',
        };
      }
      return { allowed: true };

    case 'version_history':
      if (!limits.hasVersionHistory) {
        return {
          allowed: false,
          reason: 'feature_locked',
          upgradeMessage: 'Version history is a Pro feature',
          requiredPlan: 'pro',
        };
      }
      return { allowed: true };

    default:
      return { allowed: true };
  }
}

/**
 * Get remaining pitches for a user
 */
export function getRemainingPitches(plan: PlanType, pitchCount: number): number | null {
  const limit = PRICING[plan].limits.totalPitches;
  if (limit === null) return null; // unlimited
  return Math.max(0, limit - pitchCount);
}

/**
 * Get nudge message based on remaining pitches
 */
export function getNudgeMessage(remaining: number | null): string | null {
  if (remaining === null) return null; // unlimited
  if (remaining === 1) return '1 free pitch left';
  if (remaining === 0) return 'Last free pitch!';
  return null;
}

/**
 * Calculate yearly savings percentage
 */
export function getYearlySavings(plan: PlanType): number {
  const { monthlyPrice, yearlyPrice } = PRICING[plan];
  if (monthlyPrice === 0) return 0;
  const yearlyMonthly = monthlyPrice * 12;
  return Math.round(((yearlyMonthly - yearlyPrice) / yearlyMonthly) * 100);
}
