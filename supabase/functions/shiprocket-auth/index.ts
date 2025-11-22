import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS, PUT, DELETE",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Get environment variables
    const shiprocketEmail = Deno.env.get("SHIPROCKET_EMAIL");
    const shiprocketPassword = Deno.env.get("SHIPROCKET_PASSWORD");

    if (!shiprocketEmail || !shiprocketPassword) {
      throw new Error("Shiprocket credentials not configured");
    }

    // Authenticate with Shiprocket
    const authResponse = await fetch(
      "https://apiv2.shiprocket.in/v1/external/auth/login",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: shiprocketEmail,
          password: shiprocketPassword,
        }),
      }
    );

    if (!authResponse.ok) {
      throw new Error(
        `Shiprocket authentication failed: ${authResponse.statusText}`
      );
    }

    const authData = await authResponse.json();

    if (!authData.token) {
      throw new Error("No token received from Shiprocket");
    }

    return new Response(
      JSON.stringify({
        token: authData.token,
        expires_in: 3600, // 1 hour
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Shiprocket auth error:", error);

    return new Response(
      JSON.stringify({
        error: error.message || "Authentication failed",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
