import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { crypto } from "https://deno.land/std@0.168.0/crypto/mod.ts";

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
    const {
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
      order_id,
    } = await req.json();

    // Validate required fields
    if (
      !razorpay_payment_id ||
      !razorpay_order_id ||
      !razorpay_signature ||
      !order_id
    ) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Validate UUID format for order_id
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(order_id)) {
      return new Response(
        JSON.stringify({ error: "Invalid order ID format" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Check if order exists and is in pending status
    const { data: existingOrder, error: orderError } = await supabaseClient
      .from("orders")
      .select("id, status, user_id, total")
      .eq("id", order_id)
      .single();

    if (orderError || !existingOrder) {
      return new Response(JSON.stringify({ error: "Order not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (existingOrder.status !== "pending") {
      return new Response(
        JSON.stringify({
          error: `Order already processed. Current status: ${existingOrder.status}`,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("Verifying payment:", {
      razorpay_payment_id,
      razorpay_order_id,
      order_id,
    });

    // Verify payment signature
    const text = `${razorpay_order_id}|${razorpay_payment_id}`;
    const secret = Deno.env.get("RAZORPAY_KEY_SECRET");

    if (!secret) {
      console.error("RAZORPAY_KEY_SECRET not found in environment variables");
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Create HMAC SHA256 signature
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const messageData = encoder.encode(text);

    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      keyData,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );

    const signature = await crypto.subtle.sign("HMAC", cryptoKey, messageData);
    const expectedSignature = Array.from(new Uint8Array(signature))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    // Compare signatures (hex)
    const isValidSignature = expectedSignature === razorpay_signature;

    console.log("Signature verification:", {
      expected: expectedSignature,
      received: razorpay_signature,
      isValid: isValidSignature,
    });

    if (!isValidSignature) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Invalid payment signature",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Verify payment status with Razorpay
    const paymentResponse = await fetch(
      `https://api.razorpay.com/v1/payments/${razorpay_payment_id}`,
      {
        method: "GET",
        headers: {
          Authorization: `Basic ${btoa(
            `${Deno.env.get("RAZORPAY_KEY_ID")}:${Deno.env.get(
              "RAZORPAY_KEY_SECRET"
            )}`
          )}`,
        },
      }
    );

    if (!paymentResponse.ok) {
      const errorData = await paymentResponse.json();
      console.error("Razorpay payment verification error:", errorData);
      return new Response(
        JSON.stringify({
          success: false,
          message: "Failed to verify payment with Razorpay",
        }),
        {
          status: paymentResponse.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const paymentData = await paymentResponse.json();
    console.log("Payment data from Razorpay:", paymentData);

    // Check if payment is successful
    if (paymentData.status !== "captured") {
      return new Response(
        JSON.stringify({
          success: false,
          message: `Payment not captured. Status: ${paymentData.status}`,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Validate payment amount matches order total
    const paymentAmount = paymentData.amount; // Amount in paise
    const orderAmount = Math.round(existingOrder.total * 100); // Convert to paise

    if (paymentAmount !== orderAmount) {
      console.error("Payment amount mismatch:", {
        paymentAmount,
        orderAmount,
        orderId: order_id,
      });

      return new Response(
        JSON.stringify({
          success: false,
          message: "Payment amount does not match order total",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Update order status in database with transaction-like approach
    const { error: updateError } = await supabaseClient
      .from("orders")
      .update({
        status: "paid",
        payment_id: razorpay_payment_id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", order_id)
      .eq("status", "pending"); // Only update if still pending (prevent double processing)

    if (updateError) {
      console.error("Error updating order status:", updateError);
      return new Response(
        JSON.stringify({
          success: false,
          message: "Payment verified but failed to update order status",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Check if order was actually updated (prevent race conditions)
    const { data: updatedOrder, error: checkError } = await supabaseClient
      .from("orders")
      .select("status")
      .eq("id", order_id)
      .single();

    if (checkError || !updatedOrder || updatedOrder.status !== "paid") {
      console.error("Order status update verification failed:", checkError);
      return new Response(
        JSON.stringify({
          success: false,
          message: "Order status update verification failed",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Decrement inventory for each order item
    console.log("Starting inventory decrement for order:", order_id);

    try {
      const { data: items, error: itemsErr } = await supabaseClient
        .from("order_items")
        .select("product_id, quantity")
        .eq("order_id", order_id);

      if (itemsErr) {
        console.error("Error fetching order items:", itemsErr);
        // Don't fail the payment, just log the error
      } else if (items && items.length > 0) {
        console.log(
          `Processing ${items.length} order items for inventory update`
        );

        for (const item of items) {
          if (!item.product_id || !item.quantity || item.quantity <= 0) {
            console.warn("Skipping invalid order item:", item);
            continue;
          }

          try {
            // Get current inventory
            const { data: product, error: productErr } = await supabaseClient
              .from("products")
              .select("id, inventory, name")
              .eq("id", item.product_id)
              .single();

            if (productErr) {
              console.error(
                `Error fetching product ${item.product_id}:`,
                productErr
              );
              continue;
            }

            const currentInventory =
              typeof product?.inventory === "number" ? product.inventory : 0;
            const newInventory = Math.max(0, currentInventory - item.quantity);

            console.log(
              `Updating inventory for product ${product.name}: ${currentInventory} -> ${newInventory} (decrement: ${item.quantity})`
            );

            // Update inventory
            const { error: updateInventoryError } = await supabaseClient
              .from("products")
              .update({
                inventory: newInventory,
                updated_at: new Date().toISOString(),
              })
              .eq("id", item.product_id);

            if (updateInventoryError) {
              console.error(
                `Error updating inventory for product ${item.product_id}:`,
                updateInventoryError
              );
            } else {
              console.log(
                `Successfully updated inventory for product ${item.product_id}`
              );
            }
          } catch (itemError) {
            console.error(
              `Error processing item ${item.product_id}:`,
              itemError
            );
            // Continue with other items
          }
        }
      } else {
        console.log("No order items found for inventory update");
      }
    } catch (inventoryError) {
      console.error("Error during inventory update process:", inventoryError);
      // Don't fail the payment verification, inventory can be updated manually
    }

    console.log(
      "Payment verified, order updated, and inventory processed successfully"
    );

    return new Response(
      JSON.stringify({
        success: true,
        message: "Payment verified successfully",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error verifying payment:", error);
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
