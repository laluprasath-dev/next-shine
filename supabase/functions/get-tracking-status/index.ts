import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS, PUT, DELETE",
};

interface TrackingRequest {
  tracking_number: string;
  order_id?: string;
}

interface TrackingStatus {
  status: string;
  status_code: number;
  status_description: string;
  current_status: string;
  current_status_code: number;
  current_status_description: string;
  estimated_delivery_date: string;
  pickup_date: string;
  delivered_date: string;
  tracking_events: Array<{
    status: string;
    status_code: number;
    status_description: string;
    timestamp: string;
    location: string;
  }>;
}

serve(async (req) => {
  try {
    // Handle CORS preflight requests
    if (req.method === "OPTIONS") {
      return new Response("ok", { headers: corsHeaders });
    }

    const { tracking_number, order_id }: TrackingRequest = await req.json();

    if (!tracking_number) {
      throw new Error("Tracking number is required");
    }

    // Get Shiprocket token from request headers
    const authToken =
      req.headers.get("authorization")?.replace("Bearer ", "") ||
      req.headers.get("Authorization")?.replace("Bearer ", "");

    if (!authToken) {
      throw new Error("No authentication token provided");
    }

    // Call Shiprocket tracking API
    const trackingResponse = await fetch(
      `https://apiv2.shiprocket.in/v1/external/courier/track/awb/${tracking_number}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
      }
    );

    if (!trackingResponse.ok) {
      const errorText = await trackingResponse.text();
      throw new Error(
        `Tracking failed: ${trackingResponse.statusText} - ${errorText}`
      );
    }

    const trackingData = await trackingResponse.json();

    // Update order status in database if order_id is provided
    if (order_id) {
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_ANON_KEY") ?? "",
        {
          global: {
            headers: { Authorization: req.headers.get("Authorization")! },
          },
        }
      );

      const { error: updateError } = await supabase
        .from("orders")
        .update({
          shipment_status: trackingData.current_status,
          shipment_status_description: trackingData.current_status_description,
          updated_at: new Date().toISOString(),
        })
        .eq("id", order_id);

      if (updateError) {
        console.error("Error updating order status:", updateError);
      }
    }

    return new Response(
      JSON.stringify({
        status: 200,
        message: "Tracking status retrieved successfully",
        data: {
          tracking_number,
          status: trackingData.status,
          status_code: trackingData.status_code,
          status_description: trackingData.status_description,
          current_status: trackingData.current_status,
          current_status_code: trackingData.current_status_code,
          current_status_description: trackingData.current_status_description,
          estimated_delivery_date: trackingData.estimated_delivery_date,
          pickup_date: trackingData.pickup_date,
          delivered_date: trackingData.delivered_date,
          tracking_events: trackingData.tracking_events || [],
        },
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Tracking status error:", error);

    return new Response(
      JSON.stringify({
        status: 500,
        message: error.message || "Failed to get tracking status",
        data: null,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
