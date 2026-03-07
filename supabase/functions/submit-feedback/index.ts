import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const VALID_ISSUES = [
  "too_formal",
  "too_vague",
  "wrong_tone",
  "missing_detail",
  "too_long",
  "hallucinated",
] as const;

serve(async (req) => {
  console.log("submit-feedback function started");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Authentication required" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { project_id, rating, issues, format, output_json, comment } = body;

    // Validate project_id
    if (!project_id || typeof project_id !== "string" || project_id.length > 100) {
      return new Response(JSON.stringify({ error: "Valid project_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate rating
    if (rating !== 1 && rating !== 5) {
      return new Response(JSON.stringify({ error: "rating must be 1 or 5" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Map numeric rating to DB enum values
    const ratingValue = rating === 5 ? "up" : "down";

    // Validate format
    if (format && format !== "one-pager" && format !== "script") {
      return new Response(JSON.stringify({ error: "format must be 'one-pager' or 'script'" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate issues
    let validatedIssues: string[] = [];
    if (rating === 1 && Array.isArray(issues)) {
      validatedIssues = issues.filter(
        (i: unknown) => typeof i === "string" && VALID_ISSUES.includes(i as typeof VALID_ISSUES[number])
      );
    }

    // Validate comment
    const validatedComment = typeof comment === "string" ? comment.trim().slice(0, 1000) : null;

    // Save to ai_feedback
    const { error: insertError } = await supabase.from("ai_feedback").insert({
      project_id,
      user_id: userData.user.id,
      rating: ratingValue,
      issues: validatedIssues,
      generated_output: output_json || null,
      comment: validatedComment || null,
    });

    if (insertError) {
      console.error("Insert error:", insertError);
      return new Response(JSON.stringify({ error: "Failed to save feedback" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("submit-feedback error:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
