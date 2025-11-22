import { supabase } from "@/integrations/supabase/client";

export interface TrackingEvent {
  status: string;
  status_code: number;
  status_description: string;
  timestamp: string;
  location: string;
}

export interface TrackingStatus {
  tracking_number: string;
  status: string;
  status_code: number;
  status_description: string;
  current_status: string;
  current_status_code: number;
  current_status_description: string;
  estimated_delivery_date: string;
  pickup_date: string;
  delivered_date: string;
  tracking_events: TrackingEvent[];
}

export interface CreateShipmentRequest {
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

export interface CreateShipmentResponse {
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

class ShipmentService {
  private authToken: string | null = null;
  private tokenExpiry: number = 0;

  /**
   * Authenticate with Shiprocket API
   */
  private async authenticate(): Promise<string> {
    // Check if we have a valid token
    if (this.authToken && Date.now() < this.tokenExpiry) {
      return this.authToken;
    }

    try {
      const response = await supabase.functions.invoke("shiprocket-auth");

      if (response.error) {
        throw new Error(`Authentication failed: ${response.error.message}`);
      }

      const authData = response.data as { token: string; expires_in: number };
      this.authToken = authData.token;
      this.tokenExpiry = Date.now() + authData.expires_in * 1000 - 60000; // 1 minute buffer

      return this.authToken;
    } catch (error) {
      console.error("Shiprocket authentication error:", error);
      throw new Error("Failed to authenticate with shipping service");
    }
  }

  /**
   * Create shipment for an order
   */
  async createShipment(
    request: CreateShipmentRequest
  ): Promise<CreateShipmentResponse> {
    try {
      // Authenticate first to get token
      const token = await this.authenticate();

      // Call the create-shipment function with auth token
      const response = await supabase.functions.invoke("create-shipment", {
        body: request,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.error) {
        throw new Error(`Shipment creation failed: ${response.error.message}`);
      }

      return response.data as CreateShipmentResponse;
    } catch (error) {
      console.error("Shipment creation error:", error);
      throw new Error("Failed to create shipment");
    }
  }

  /**
   * Get tracking status for a shipment
   */
  async getTrackingStatus(
    trackingNumber: string,
    orderId?: string
  ): Promise<TrackingStatus> {
    try {
      // Authenticate first to get token
      const token = await this.authenticate();

      // Call the get-tracking-status function with auth token
      const response = await supabase.functions.invoke("get-tracking-status", {
        body: {
          tracking_number: trackingNumber,
          order_id: orderId,
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.error) {
        throw new Error(`Tracking status failed: ${response.error.message}`);
      }

      return response.data.data as TrackingStatus;
    } catch (error) {
      console.error("Tracking status error:", error);
      throw new Error("Failed to get tracking status");
    }
  }

  /**
   * Get tracking events for an order
   */
  async getTrackingEvents(orderId: string): Promise<TrackingEvent[]> {
    try {
      const { data, error } = await supabase
        .from("shipment_tracking_events")
        .select("*")
        .eq("order_id", orderId)
        .order("timestamp", { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch tracking events: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error("Error fetching tracking events:", error);
      throw new Error("Failed to fetch tracking events");
    }
  }

  /**
   * Format tracking status for display
   */
  formatTrackingStatus(status: string): {
    text: string;
    color: string;
    icon: string;
  } {
    switch (status.toLowerCase()) {
      case "created":
      case "pending":
        return {
          text: "Shipment Created",
          color: "text-blue-600",
          icon: "📦",
        };
      case "picked_up":
      case "in_transit":
        return {
          text: "In Transit",
          color: "text-yellow-600",
          icon: "🚚",
        };
      case "out_for_delivery":
        return {
          text: "Out for Delivery",
          color: "text-orange-600",
          icon: "🚛",
        };
      case "delivered":
        return {
          text: "Delivered",
          color: "text-green-600",
          icon: "✅",
        };
      case "failed":
      case "exception":
        return {
          text: "Delivery Failed",
          color: "text-red-600",
          icon: "❌",
        };
      default:
        return {
          text: status.charAt(0).toUpperCase() + status.slice(1),
          color: "text-gray-600",
          icon: "📋",
        };
    }
  }

  /**
   * Get estimated delivery date
   */
  getEstimatedDeliveryDate(estimatedDate: string): string {
    if (!estimatedDate) return "Not available";

    const date = new Date(estimatedDate);
    return date.toLocaleDateString("en-IN", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  /**
   * Check if shipment is delivered
   */
  isDelivered(status: string): boolean {
    return status.toLowerCase() === "delivered";
  }

  /**
   * Check if shipment is in transit
   */
  isInTransit(status: string): boolean {
    const transitStatuses = ["picked_up", "in_transit", "out_for_delivery"];
    return transitStatuses.includes(status.toLowerCase());
  }
}

export const shipmentService = new ShipmentService();
