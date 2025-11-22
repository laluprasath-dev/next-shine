import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS, PUT, DELETE",
};

interface CreateShipmentRequest {
  order_id: string;
  courier_id: number;
  pickup_pincode: string;
  delivery_pincode: string;
  weight: number;
  length: number;
  breadth: number;
  height: number;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  customer_city: string;
  customer_state: string;
  customer_pincode: string;
  customer_country: string;
}

interface ShipmentResponse {
  status: number;
  message: string;
  data?: {
    shipment_id: string;
    tracking_number: string;
    awb_number: string;
    courier_name: string;
    status: string;
  };
}

serve(async (req) => {
  try {
    // Handle CORS preflight requests
    if (req.method === "OPTIONS") {
      return new Response("ok", { headers: corsHeaders });
    }

    const {
      order_id,
      courier_id,
      pickup_pincode,
      delivery_pincode,
      weight,
      length,
      breadth,
      height,
      customer_name,
      customer_phone,
      customer_address,
      customer_city,
      customer_state,
      customer_pincode,
      customer_country,
    }: CreateShipmentRequest = await req.json();

    if (!order_id || !courier_id) {
      throw new Error("Missing required shipment parameters");
    }

    // Get Shiprocket token from request headers
    const authToken =
      req.headers.get("authorization")?.replace("Bearer ", "") ||
      req.headers.get("Authorization")?.replace("Bearer ", "");

    if (!authToken) {
      throw new Error("No authentication token provided");
    }

    // Prepare shipment data for Shiprocket API
    const shipmentData = {
      order_id,
      courier_id,
      pickup_pincode,
      delivery_pincode,
      weight,
      length,
      breadth,
      height,
      customer_name,
      customer_phone,
      customer_address,
      customer_city,
      customer_state,
      customer_pincode,
      customer_country,
    };

    // Call Shiprocket create shipment API
    const shipmentResponse = await fetch(
      "https://apiv2.shiprocket.in/v1/external/orders/create/adhoc-shipment",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(shipmentData),
      }
    );

    if (!shipmentResponse.ok) {
      const errorText = await shipmentResponse.text();
      throw new Error(
        `Shipment creation failed: ${shipmentResponse.statusText} - ${errorText}`
      );
    }

    const shipmentData = await shipmentResponse.json();

    // Update order with tracking information
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
        tracking_number: shipmentData.tracking_number,
        awb_number: shipmentData.awb_number,
        shipment_id: shipmentData.shipment_id,
        shipment_status: "created",
        updated_at: new Date().toISOString(),
      })
      .eq("id", order_id);

    if (updateError) {
      console.error("Error updating order with tracking info:", updateError);
    }

    return new Response(
      JSON.stringify({
        status: 200,
        message: "Shipment created successfully",
        data: {
          shipment_id: shipmentData.shipment_id,
          tracking_number: shipmentData.tracking_number,
          awb_number: shipmentData.awb_number,
          courier_name: shipmentData.courier_name,
          status: "created",
        },
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Shipment creation error:", error);

    return new Response(
      JSON.stringify({
        status: 500,
        message: error.message || "Failed to create shipment",
        data: null,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
