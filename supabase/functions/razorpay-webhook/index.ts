import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { crypto } from "https://deno.land/std@0.168.0/crypto/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-razorpay-signature",
};

// Rate limiting store (in production, use Redis or database)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Rate limiting: max 10 requests per minute per IP
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute

// Helper function to create shipment for order
async function createShipmentForOrder(supabase: any, orderId: string) {
  try {
    // Get order details with shipping info
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select(
        `
        *,
        order_items (
          product_id,
          quantity,
          price
        )
      `
      )
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      throw new Error(`Order not found: ${orderError?.message}`);
    }

    // Check if order has shipping info
    if (!order.shipping_info || !order.shipping_address) {
      console.log(
        "Order missing shipping information, skipping shipment creation"
      );
      return;
    }

    // Get Shiprocket auth token
    const { data: authData, error: authError } =
      await supabase.functions.invoke("shiprocket-auth");
    if (authError || !authData?.token) {
      throw new Error(`Shiprocket auth failed: ${authError?.message}`);
    }

    // Prepare shipment data
    const shipmentData = {
      order_id: orderId,
      courier_id: order.shipping_info.courier_id,
      pickup_pincode: order.shipping_info.pickup_pincode || "110001", // Default to Delhi
      delivery_pincode: order.shipping_address.postal_code,
      weight: 1.0, // Default weight, should be calculated from products
      length: 10,
      breadth: 10,
      height: 5,
      customer_name: order.shipping_address.name,
      customer_phone: order.shipping_address.phone,
      customer_address: order.shipping_address.line1,
      customer_city: order.shipping_address.city,
      customer_state: order.shipping_address.state,
      customer_pincode: order.shipping_address.postal_code,
      customer_country: order.shipping_address.country || "India",
    };

    // Create shipment
    const { data: shipmentResult, error: shipmentError } =
      await supabase.functions.invoke("create-shipment", {
        body: shipmentData,
        headers: {
          Authorization: `Bearer ${authData.token}`,
        },
      });

    if (shipmentError) {
      throw new Error(`Shipment creation failed: ${shipmentError.message}`);
    }

    console.log("Shipment created successfully:", shipmentResult);
  } catch (error) {
    console.error("Error in createShipmentForOrder:", error);
    throw error;
  }
}

// Helper to compute HMAC SHA256 and return base64 string (matches Razorpay webhook header)
async function hmacSHA256Base64(key: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    enc.encode(key),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    cryptoKey,
    enc.encode(message)
  );
  const bytes = new Uint8Array(signature);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Rate limiting check
function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const key = `rate_limit_${ip}`;
  const current = rateLimitStore.get(key);

  if (!current || now > current.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (current.count >= RATE_LIMIT_MAX) {
    return false;
  }

  current.count++;
  return true;
}

// Type definitions for webhook payloads
interface WebhookPayload {
  order?: {
    entity?: {
      notes?: { orderId?: string };
      receipt?: string;
    };
  };
  payment?: {
    entity?: {
      id?: string;
      notes?: { orderId?: string };
      order_id?: string;
    };
  };
  refund?: {
    entity?: {
      payment_id?: string;
      notes?: { orderId?: string };
    };
  };
}

interface SupabaseClient {
  from: (table: string) => {
    select: (columns: string) => {
      eq: (
        column: string,
        value: string
      ) => {
        single: () => Promise<{ data: any; error: any }>;
      };
    };
    update: (data: Record<string, any>) => {
      eq: (column: string, value: string) => Promise<{ error: any }>;
    };
  };
}

// Helper to extract order ID from different event types
function extractOrderId(payload: WebhookPayload, eventType: string): string {
  const sources = [
    payload?.order?.entity?.notes?.orderId,
    payload?.payment?.entity?.notes?.orderId,
    payload?.order?.entity?.receipt?.replace(/^order_/, ""),
    payload?.payment?.entity?.order_id,
    payload?.refund?.entity?.notes?.orderId,
  ];

  const orderId = sources.find(
    (id) => id && typeof id === "string" && id.trim().length > 0
  );

  if (!orderId) {
    throw new Error(
      `Could not extract order ID from ${eventType} event. Payload: ${JSON.stringify(
        payload
      )}`
    );
  }

  return orderId.trim();
}

// Helper to extract payment ID from different event types
function extractPaymentId(payload: WebhookPayload, eventType: string): string {
  const sources = [
    payload?.payment?.entity?.id,
    payload?.refund?.entity?.payment_id,
  ];

  const paymentId = sources.find(
    (id) => id && typeof id === "string" && id.trim().length > 0
  );

  if (!paymentId) {
    throw new Error(
      `Could not extract payment ID from ${eventType} event. Payload: ${JSON.stringify(
        payload
      )}`
    );
  }

  return paymentId.trim();
}

// Helper to check if payment was already processed
async function isPaymentAlreadyProcessed(
  supabase: SupabaseClient,
  orderId: string,
  paymentId: string
): Promise<boolean> {
  const { data: order } = await supabase
    .from("orders")
    .select("payment_id, status")
    .eq("id", orderId)
    .single();

  return order?.payment_id === paymentId && order?.status === "paid";
}

serve(async (req) => {
  const startTime = Date.now();
  const clientIP =
    req.headers.get("x-forwarded-for") ||
    req.headers.get("x-real-ip") ||
    "unknown";

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", {
      status: 405,
      headers: corsHeaders,
    });
  }

  // Rate limiting check
  if (!checkRateLimit(clientIP)) {
    console.warn(`Rate limit exceeded for IP: ${clientIP}`);
    return new Response(
      JSON.stringify({ success: false, message: "Rate limit exceeded" }),
      {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  try {
    // Validate environment variables
    const webhookSecret = Deno.env.get("RAZORPAY_KEY_SECRET");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!webhookSecret || !supabaseUrl || !supabaseServiceKey) {
      console.error("Missing required environment variables");
      return new Response(
        JSON.stringify({
          success: false,
          message: "Server configuration error",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Raw body is required to compute signature
    const rawBody = await req.text();
    const receivedSignature = req.headers.get("x-razorpay-signature") || "";

    // Verify webhook signature
    const expected = await hmacSHA256Base64(webhookSecret, rawBody);
    const isValid = expected === receivedSignature;

    if (!isValid) {
      console.warn("Invalid webhook signature", {
        expected: expected.substring(0, 10) + "...",
        received: receivedSignature.substring(0, 10) + "...",
        clientIP,
      });
      return new Response(
        JSON.stringify({ success: false, message: "Invalid signature" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Parse webhook event
    let event: { event: string; payload: WebhookPayload };
    try {
      event = JSON.parse(rawBody);
    } catch (parseError) {
      console.error("Failed to parse webhook payload:", parseError);
      return new Response(
        JSON.stringify({ success: false, message: "Invalid JSON payload" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const eventType: string = event.event;
    const payload = event.payload || {};

    console.log("Processing webhook event:", {
      eventType,
      clientIP,
      timestamp: new Date().toISOString(),
    });

    // Create Supabase client with service role key only
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Extract order and payment IDs
    let orderId: string;
    let paymentId: string;

    try {
      orderId = extractOrderId(payload, eventType);
      paymentId = extractPaymentId(payload, eventType);
    } catch (extractError) {
      console.error("Failed to extract IDs:", extractError);
      return new Response(
        JSON.stringify({
          success: false,
          message: "Could not extract order/payment information",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Check if payment was already processed (idempotency)
    if (eventType === "payment.captured" || eventType === "order.paid") {
      const alreadyProcessed = await isPaymentAlreadyProcessed(
        supabase,
        orderId,
        paymentId
      );
      if (alreadyProcessed) {
        console.log("Payment already processed:", { orderId, paymentId });
        return new Response(
          JSON.stringify({
            success: true,
            message: "Payment already processed",
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    // Handle different event types
    const updateData: Record<string, string> = {
      updated_at: new Date().toISOString(),
    };

    switch (eventType) {
      case "order.created": {
        console.log("Order created event");
        updateData.status = "pending";
        break;
      }

      case "payment.authorized": {
        console.log("Payment authorized event");
        updateData.status = "pending";
        updateData.payment_id = paymentId;
        break;
      }

      case "payment.captured":
      case "order.paid": {
        console.log("Payment captured/paid event");
        updateData.status = "paid";
        updateData.payment_id = paymentId;

        // Create shipment after successful payment
        try {
          await createShipmentForOrder(supabase, orderId);
        } catch (error) {
          console.error("Error creating shipment:", error);
          // Don't fail the webhook if shipment creation fails
        }
        break;
      }

      case "payment.failed":
      case "order.payment_failed": {
        console.log("Payment failed event");
        updateData.status = "cancelled";
        updateData.payment_id = paymentId;
        break;
      }

      case "payment.captured.failed": {
        console.log("Payment capture failed event");
        updateData.status = "cancelled";
        updateData.payment_id = paymentId;
        break;
      }

      case "refund.created": {
        console.log("Refund created event");
        updateData.status = "refunded";
        updateData.payment_id = paymentId;
        break;
      }

      case "refund.processed": {
        console.log("Refund processed event");
        updateData.status = "refunded";
        updateData.payment_id = paymentId;
        break;
      }

      default: {
        console.log(`Unhandled event type: ${eventType}`);
        return new Response(
          JSON.stringify({
            success: true,
            message: "Event type not handled",
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    // Update order status
    const { error: updateError } = await supabase
      .from("orders")
      .update(updateData)
      .eq("id", orderId);

    if (updateError) {
      console.error("Failed to update order:", updateError);
      return new Response(
        JSON.stringify({
          success: false,
          message: "Failed to update order status",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("Webhook processed successfully:", {
      eventType,
      orderId,
      paymentId,
      status: updateData.status,
      processingTime: Date.now() - startTime,
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: "Webhook processed successfully",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Webhook processing error:", {
      error: error.message,
      stack: error.stack,
      clientIP,
      processingTime: Date.now() - startTime,
    });

    return new Response(
      JSON.stringify({
        success: false,
        message: "Internal server error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
