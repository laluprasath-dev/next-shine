import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    // Parse request body
    const { amount, currency, receipt, notes } = await req.json();

    // Validate required fields
    if (!amount || !currency || !receipt) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Prepare Razorpay order data
    const orderData = {
      amount: amount,
      currency: currency,
      receipt: receipt,
      notes: notes || {},
    };

    console.log("Creating Razorpay order with data:", orderData);

    // Make request to Razorpay API
    const razorpayResponse = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${btoa(
          `${Deno.env.get("RAZORPAY_KEY_ID")}:${Deno.env.get(
            "RAZORPAY_KEY_SECRET"
          )}`
        )}`,
      },
      body: JSON.stringify(orderData),
    });

    if (!razorpayResponse.ok) {
      const errorData = await razorpayResponse.json();
      console.error("Razorpay API error:", errorData);
      return new Response(
        JSON.stringify({
          error: errorData.error?.description || "Failed to create order",
        }),
        {
          status: razorpayResponse.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const order = await razorpayResponse.json();
    console.log("Razorpay order created successfully:", order);

    // Return the order in a consistent format
    const response = {
      id: order.id,
      entity: order.entity,
      amount: order.amount,
      amount_paid: order.amount_paid,
      amount_due: order.amount_due,
      currency: order.currency,
      receipt: order.receipt,
      status: order.status,
      created_at: order.created_at,
      // Also include the original fields for backward compatibility
      razorpayOrderId: order.id,
      key: Deno.env.get("RAZORPAY_KEY_ID"),
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error creating Razorpay order:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
