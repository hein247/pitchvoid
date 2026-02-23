import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Webhook received");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const stripeWebhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    if (!stripeWebhookSecret) {
      console.error("CRITICAL: STRIPE_WEBHOOK_SECRET not configured");
      return new Response(
        JSON.stringify({ error: "Webhook endpoint not properly configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    if (!signature) {
      return new Response(
        JSON.stringify({ error: "Missing stripe-signature header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, stripeWebhookSecret);
      logStep("Webhook signature verified");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logStep("Webhook signature verification failed", { error: errorMessage });
      return new Response(
        JSON.stringify({ error: "Invalid webhook signature" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    logStep("Event parsed", { type: event.type, id: event.id });

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        logStep("Checkout completed", {
          customerId: session.customer,
          mode: session.mode,
          metadata: session.metadata,
        });

        const userId = session.metadata?.user_id;
        if (!userId) {
          logStep("No user_id in metadata, skipping");
          break;
        }

        if (session.mode === "payment") {
          // One-time credit pack purchase
          const creditsToAdd = parseInt(session.metadata?.credits || "0", 10);
          if (creditsToAdd <= 0) {
            logStep("Invalid credits value", { credits: session.metadata?.credits });
            break;
          }

          // Get current credits first
          const { data: profile, error: fetchError } = await supabaseAdmin
            .from("profiles")
            .select("credits, stripe_customer_id")
            .eq("id", userId)
            .single();

          if (fetchError) {
            logStep("Error fetching profile", { error: fetchError.message });
            break;
          }

          const currentCredits = profile?.credits ?? 0;
          const newCredits = currentCredits + creditsToAdd;

          const { error: updateError } = await supabaseAdmin
            .from("profiles")
            .update({
              credits: newCredits,
              stripe_customer_id: (session.customer as string) || profile?.stripe_customer_id,
              updated_at: new Date().toISOString(),
            })
            .eq("id", userId);

          if (updateError) {
            logStep("Error adding credits", { error: updateError.message });
          } else {
            logStep("Credits added successfully", { userId, added: creditsToAdd, total: newCredits });
          }
        } else if (session.mode === "subscription") {
          // Legacy subscription handling
          const planType = session.metadata?.plan_type || "pro";
          const isYearly = session.metadata?.is_yearly === "true";

          const { error } = await supabaseAdmin
            .from("profiles")
            .update({
              plan: planType,
              plan_interval: isYearly ? "year" : "month",
              stripe_customer_id: session.customer as string,
              stripe_subscription_id: session.subscription as string,
              subscription_status: "active",
              updated_at: new Date().toISOString(),
            })
            .eq("id", userId);

          if (error) {
            logStep("Error updating profile", { error: error.message });
          } else {
            logStep("Profile updated successfully", { userId, planType });
          }
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.user_id;
        if (userId) {
          const currentPeriodEnd = new Date(subscription.current_period_end * 1000).toISOString();
          await supabaseAdmin
            .from("profiles")
            .update({
              subscription_status: subscription.status,
              current_period_end: currentPeriodEnd,
              updated_at: new Date().toISOString(),
            })
            .eq("id", userId);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.user_id;
        if (userId) {
          await supabaseAdmin
            .from("profiles")
            .update({
              plan: "free",
              plan_interval: null,
              subscription_status: "cancelled",
              stripe_subscription_id: null,
              updated_at: new Date().toISOString(),
            })
            .eq("id", userId);
        }
        break;
      }

      default:
        logStep("Unhandled event type", { type: event.type });
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: "Webhook processing failed" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
