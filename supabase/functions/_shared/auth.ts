import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

export interface UserProfile {
  id: string;
  plan: string | null;
  pitch_count: number | null;
  credits: number | null;
  subscription_status: string | null;
}

export interface AuthResult {
  user: { id: string; email: string };
  profile: UserProfile;
}

export interface PaywallResult {
  allowed: boolean;
  error?: string;
  statusCode?: number;
}

const PLAN_LIMITS = {
  free: { maxPitches: 3, formats: ['slides'], maxSlides: 4 },
  pro: { maxPitches: Infinity, formats: ['slides', 'one-pager', 'script'], maxSlides: 12 },
  teams: { maxPitches: Infinity, formats: ['slides', 'one-pager', 'script'], maxSlides: 12 },
};

/**
 * Authenticates the request and returns user info with profile
 */
export async function authenticateRequest(
  req: Request
): Promise<{ result: AuthResult | null; error: Response | null }> {
  const authHeader = req.headers.get("Authorization");
  
  if (!authHeader) {
    return {
      result: null,
      error: new Response(
        JSON.stringify({ error: "Authentication required" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      ),
    };
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  const token = authHeader.replace("Bearer ", "");
  const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);

  if (userError || !userData.user) {
    return {
      result: null,
      error: new Response(
        JSON.stringify({ error: "Invalid or expired authentication token" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      ),
    };
  }

  const user = userData.user;

  // Fetch user profile for paywall checks
  const { data: profile, error: profileError } = await supabaseClient
    .from("profiles")
    .select("id, plan, pitch_count, credits, subscription_status")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    console.error("Failed to fetch profile:", profileError);
    return {
      result: null,
      error: new Response(
        JSON.stringify({ error: "User profile not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      ),
    };
  }

  return {
    result: {
      user: { id: user.id, email: user.email || "" },
      profile: profile as UserProfile,
    },
    error: null,
  };
}

/**
 * Checks if user can create a pitch based on their plan
 */
export function checkPitchLimit(profile: UserProfile): PaywallResult {
  const plan = profile.plan || "free";
  const limits = PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS] || PLAN_LIMITS.free;
  const pitchCount = profile.pitch_count || 0;

  if (pitchCount >= limits.maxPitches) {
    return {
      allowed: false,
      error: `Pitch limit reached. Upgrade to Pro for unlimited pitches.`,
      statusCode: 402,
    };
  }

  return { allowed: true };
}

/**
 * Checks if user can use a specific format
 */
export function checkFormatAccess(profile: UserProfile, format: string): PaywallResult {
  const plan = profile.plan || "free";
  const limits = PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS] || PLAN_LIMITS.free;

  if (!limits.formats.includes(format)) {
    return {
      allowed: false,
      error: `Format '${format}' requires Pro plan.`,
      statusCode: 402,
    };
  }

  return { allowed: true };
}

/**
 * Increments the user's pitch count after successful generation
 */
export async function incrementPitchCount(userId: string): Promise<void> {
  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  // First fetch the current pitch count
  const { data: profile } = await supabaseClient
    .from("profiles")
    .select("pitch_count")
    .eq("id", userId)
    .single();

  const currentCount = profile?.pitch_count || 0;

  // Update with incremented count
  await supabaseClient
    .from("profiles")
    .update({ 
      pitch_count: currentCount + 1,
      last_pitch_at: new Date().toISOString() 
    })
    .eq("id", userId);
}
