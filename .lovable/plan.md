
# PitchVoid Pricing System Implementation Plan

## Overview

This plan implements a complete subscription-based pricing system for PitchVoid with three tiers (Free, Pro, Teams), Stripe payment integration, paywall enforcement, and usage tracking.

---

## Architecture Summary

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                           FRONTEND                                          │
│  ┌─────────────┐  ┌────────────────┐  ┌─────────────────┐                   │
│  │ PricingPage │  │ PaywallModal   │  │ UpgradeNudge    │                   │
│  │ /pricing    │  │ (blocks action)│  │ (soft reminder) │                   │
│  └─────────────┘  └────────────────┘  └─────────────────┘                   │
│         │                │                    │                             │
│         ▼                ▼                    ▼                             │
│  ┌──────────────────────────────────────────────────────────────────┐       │
│  │                     usePricing Hook                               │       │
│  │  • canPerformAction(action, options)                              │       │
│  │  • userPlan, pitchCount, remaining                               │       │
│  │  • checkAndTriggerPaywall(action)                                │       │
│  └──────────────────────────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        EDGE FUNCTIONS                                       │
│  ┌──────────────────┐  ┌─────────────────────┐  ┌────────────────────┐      │
│  │ create-checkout  │  │ stripe-webhook      │  │ customer-portal    │      │
│  │ Stripe Checkout  │  │ Handle subscriptions│  │ Manage billing     │      │
│  └──────────────────┘  └─────────────────────┘  └────────────────────┘      │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         DATABASE                                            │
│  profiles (updated)         │         teams (new)                           │
│  ─────────────────          │         ───────────                           │
│  + plan                     │         + id                                  │
│  + plan_interval            │         + name                                │
│  + stripe_customer_id       │         + owner_id                            │
│  + stripe_subscription_id   │         + stripe_customer_id                  │
│  + subscription_status      │         + seat_count                          │
│  + current_period_end       │         + subscription_status                 │
│  + pitch_count              │         + current_period_end                  │
│  + last_pitch_at            │                                               │
│  + team_id                  │                                               │
│  + team_role                │                                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Implementation Phases

### Phase 1: Database Schema Updates

**Modify `profiles` table** to add billing and usage fields:

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| `plan` | TEXT | 'free' | Current plan tier |
| `plan_interval` | TEXT | null | 'month' or 'year' |
| `stripe_customer_id` | TEXT | null | Stripe customer ID |
| `stripe_subscription_id` | TEXT | null | Active subscription ID |
| `subscription_status` | TEXT | null | 'active', 'past_due', 'cancelled' |
| `current_period_end` | TIMESTAMPTZ | null | Subscription renewal date |
| `pitch_count` | INTEGER | 0 | Total pitches created |
| `last_pitch_at` | TIMESTAMPTZ | null | Last pitch timestamp |
| `team_id` | UUID | null | Reference to teams table |
| `team_role` | TEXT | null | 'owner', 'admin', 'member' |

**Create `teams` table** for organizational subscriptions:

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| `id` | UUID | gen_random_uuid() | Primary key |
| `name` | TEXT | NOT NULL | Team name |
| `owner_id` | UUID | NOT NULL | Reference to profiles |
| `stripe_customer_id` | TEXT | null | Stripe customer ID |
| `stripe_subscription_id` | TEXT | null | Subscription ID |
| `subscription_status` | TEXT | null | Status |
| `seat_count` | INTEGER | 2 | Number of seats |
| `current_period_end` | TIMESTAMPTZ | null | Renewal date |
| `created_at` | TIMESTAMPTZ | NOW() | Creation timestamp |

**RLS Policies:**
- Profiles: Users can read/update their own profile
- Teams: Team members can read, owners/admins can update

---

### Phase 2: Pricing Constants and Paywall Logic

**Create `src/lib/pricing.ts`** with:

1. **PRICING constant** - All tier definitions with limits
2. **canUserPerformAction()** - Central paywall check function
3. **Plan limits:**

| Feature | Free | Pro | Teams |
|---------|------|-----|-------|
| Total Pitches | 3 | Unlimited | Unlimited |
| Formats | Slides only | All 3 | All 3 |
| Max Slides | 4 | 12 | 15 |
| Export | No | Yes | Yes |
| Watermark | Yes | No | No |
| Practice Mode | No | Yes | Yes |
| Version History | No | Yes | Yes |
| Priority Gen | No | Yes | Yes |

---

### Phase 3: Stripe Integration (Edge Functions)

**Prerequisites:** User must connect Stripe via the built-in connector (provides `STRIPE_SECRET_KEY`)

**Edge Function: `create-checkout`**
- Creates Stripe Checkout Session
- Accepts: userId, userEmail, priceId, isTeams, seatCount
- Returns: checkout URL

**Edge Function: `stripe-webhook`**
- Handles events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`
- Updates profiles table with subscription status

**Edge Function: `customer-portal`**
- Creates Stripe Billing Portal session
- Returns: portal URL for managing subscription

---

### Phase 4: Frontend Components

**New Components:**

1. **`src/pages/Pricing.tsx`**
   - Three-tier pricing cards with monthly/yearly toggle
   - Feature comparison
   - "Most Popular" badge on Pro
   - 17% yearly savings callout
   - Guarantees section (no CC for free, cancel anytime, 7-day refund)

2. **`src/components/pricing/PaywallModal.tsx`**
   - Triggered when user hits a limit
   - Two variants: `pitch_limit` and `feature_locked`
   - Shows Pro benefits preview
   - "Upgrade — $9/mo" CTA

3. **`src/components/pricing/UpgradeNudge.tsx`**
   - Non-blocking banner for soft reminders
   - Shows at 1 remaining and 0 remaining pitches
   - Dismissable

4. **`src/hooks/usePricing.ts`**
   - Fetches user plan and usage from database
   - Provides `canPerformAction()` helper
   - Manages paywall modal state

---

### Phase 5: Integration Points

**Dashboard.tsx Modifications:**

1. **Quick Pitch Generation:**
   - Check `canPerformAction('create_pitch')` before generation
   - Increment `pitch_count` on successful generation
   - Show `UpgradeNudge` when 1 or 0 pitches remaining

2. **Format Selection:**
   - Check `canPerformAction('use_format', { format })` 
   - Lock One-Pager and Script for Free users
   - Show lock icon with "Pro" badge

3. **Slide Limit:**
   - Enforce max 4 slides for Free tier
   - Show "Upgrade to add more slides" message

4. **Export (future):**
   - Check `canPerformAction('export')` before allowing download

5. **Practice Mode:**
   - Check `canPerformAction('practice_mode')` before entering

6. **Watermark:**
   - Add "Made with PitchVoid" watermark to Free tier outputs
   - Remove for Pro/Teams

---

### Phase 6: Navbar and Settings

**Navbar Updates:**
- Add "Upgrade" button for Free users (magenta gradient)
- Replace credits display with plan badge for Pro/Teams
- Add Settings link for subscription management

**Settings Page (`src/pages/Settings.tsx`):**
- Display current plan
- Show usage stats
- "Manage Subscription" button (opens Stripe portal)
- "View Pricing" link

---

## File Structure

```text
src/
├── lib/
│   └── pricing.ts              # Pricing constants and paywall logic
├── hooks/
│   └── usePricing.ts           # Pricing hook with DB queries
├── components/
│   └── pricing/
│       ├── PaywallModal.tsx    # Blocking upgrade modal
│       ├── UpgradeNudge.tsx    # Non-blocking nudge banner
│       └── PricingCard.tsx     # Reusable pricing card component
├── pages/
│   ├── Pricing.tsx             # Pricing page
│   └── Settings.tsx            # User settings with billing
└── ...

supabase/
└── functions/
    ├── create-checkout/
    │   └── index.ts            # Create Stripe checkout
    ├── stripe-webhook/
    │   └── index.ts            # Handle Stripe events
    └── customer-portal/
        └── index.ts            # Billing portal session
```

---

## Upgrade Prompt Triggers (UX)

| Moment | Type | Message |
|--------|------|---------|
| 2nd pitch created | Nudge | "1 free pitch left" |
| 3rd pitch created | Nudge | "Last free pitch!" |
| 4th pitch attempted | Modal | "You've used all 3 free pitches" |
| Click One-Pager/Script | Modal | "This format is a Pro feature" |
| Practice Mode click | Modal | "Practice mode is a Pro feature" |
| After generation (free) | Nudge | "Love it? Get unlimited for $9/mo" |

---

## Technical Requirements

### Stripe Setup Required

Before implementing the billing Edge Functions, you'll need to:

1. **Connect Stripe** via Settings → Connectors
2. **Create Products/Prices in Stripe Dashboard:**
   - Pro Monthly: $9/month
   - Pro Yearly: $90/year  
   - Teams Monthly: $19/user/month
   - Teams Yearly: $190/user/year
3. **Configure Webhook** in Stripe pointing to the `stripe-webhook` edge function
4. **Add Price IDs** as secrets:
   - `STRIPE_PRICE_PRO_MONTHLY`
   - `STRIPE_PRICE_PRO_YEARLY`
   - `STRIPE_PRICE_TEAMS_MONTHLY`
   - `STRIPE_PRICE_TEAMS_YEARLY`
   - `STRIPE_WEBHOOK_SECRET`

---

## Implementation Order

1. **Database migrations** (profiles columns + teams table)
2. **Pricing constants** (`src/lib/pricing.ts`)
3. **usePricing hook** (fetches plan data)
4. **PaywallModal + UpgradeNudge** components
5. **Pricing page** (`/pricing` route)
6. **Dashboard integration** (paywall checks)
7. **Stripe Edge Functions** (checkout, webhook, portal)
8. **Settings page** (subscription management)
9. **Navbar updates** (upgrade button, plan badge)

---

## Summary

This implementation adds a complete monetization layer to PitchVoid:

- **Free tier**: 3 pitches, slides only, 4-slide max, watermarked
- **Pro tier**: $9/mo, unlimited pitches, all formats, 12 slides, no watermark
- **Teams tier**: $19/user/mo, everything in Pro + workspace features

The system uses soft nudges for gentle conversion and hard paywalls only when limits are exceeded, maintaining the "convenience on-the-go" UX philosophy.
