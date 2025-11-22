import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS, PUT, DELETE",
};

interface ShippingRequest {
  pickup_pincode: string;
  delivery_pincode: string;
  weight: number;
  length: number;
  breadth: number;
  height: number;
}

interface CourierOption {
  courier_id: number;
  courier_name: string;
  courier_logo: string;
  rate: number;
  estimated_delivery_days: string;
  estimated_delivery_date: string;
  cod_available: boolean;
  pickup_pincode: string;
  delivery_pincode: string;
}

serve(async (req) => {
  try {
    // Handle CORS preflight requests
    if (req.method === "OPTIONS") {
      return new Response("ok", { headers: corsHeaders });
    }

    const {
      pickup_pincode,
      delivery_pincode,
      weight,
      length,
      breadth,
      height,
    }: ShippingRequest = await req.json();

    if (
      !pickup_pincode ||
      !delivery_pincode ||
      !weight ||
      !length ||
      !breadth ||
      !height
    ) {
      throw new Error("Missing required shipping parameters");
    }

    // Get Shiprocket token from request headers or authenticate
    const authToken =
      req.headers.get("authorization")?.replace("Bearer ", "") ||
      req.headers.get("Authorization")?.replace("Bearer ", "");

    if (!authToken) {
      throw new Error("No authentication token provided");
    }

    // Optional: Decode and check token expiration
    try {
      const tokenPayload = JSON.parse(atob(authToken.split(".")[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      const tokenExpiry = tokenPayload.exp;

      if (currentTime >= tokenExpiry) {
        throw new Error("Token has expired");
      }
    } catch (decodeError) {
      // Token decode failed, but continue with the request
    }

    // Prepare shipment data for Shiprocket API
    const shipmentData = {
      pickup_pincode,
      delivery_pincode,
      weight,
      length,
      breadth,
      height,
    };

    // Call Shiprocket shipping rate API
    const shippingResponse = await fetch(
      "https://apiv2.shiprocket.in/v1/external/courier/serviceability/",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(shipmentData),
      }
    );

    if (!shippingResponse.ok) {
      const errorText = await shippingResponse.text();
      throw new Error(
        `Shipping calculation failed: ${shippingResponse.statusText} - ${errorText}`
      );
    }

    const shippingData = await shippingResponse.json();

    // Transform Shiprocket response to our format
    const courierOptions: CourierOption[] = [];

    if (shippingData.data && shippingData.data.available_courier_companies) {
      shippingData.data.available_courier_companies.forEach((courier: any) => {
        courierOptions.push({
          courier_id: courier.courier_id,
          courier_name: courier.courier_name,
          courier_logo: courier.courier_logo || "",
          rate: courier.rate,
          estimated_delivery_days:
            courier.estimated_delivery_days?.toString() || "3",
          estimated_delivery_date: courier.estimated_delivery_date || "",
          cod_available: courier.cod_available || false,
          pickup_pincode,
          delivery_pincode,
        });
      });
    }

    // If no couriers available, provide fallback options
    if (courierOptions.length === 0) {
      courierOptions.push({
        courier_id: 1,
        courier_name: "Standard Delivery",
        courier_logo: "",
        rate: 50,
        estimated_delivery_days: "5",
        estimated_delivery_date: new Date(
          Date.now() + 5 * 24 * 60 * 60 * 1000
        ).toISOString(),
        cod_available: true,
        pickup_pincode,
        delivery_pincode,
      });
    }

    return new Response(
      JSON.stringify({
        status: 200,
        message: "Shipping charges calculated successfully",
        data: {
          available_courier_companies: courierOptions,
        },
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Shipping calculation error:", error);

    return new Response(
      JSON.stringify({
        status: 500,
        message: error.message || "Failed to calculate shipping charges",
        data: {
          available_courier_companies: [],
        },
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
