import { supabase } from "@/integrations/supabase/client";
import { CartItem } from "@/contexts/CartContext";
import { Address } from "@/contexts/CartContext";

export interface CourierOption {
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

export interface ShippingChargeResponse {
  status: number;
  message: string;
  data: {
    available_courier_companies: CourierOption[];
  };
}

export interface ShiprocketAuthResponse {
  token: string;
  expires_in: number;
}

class ShippingService {
  private authToken: string | null = null;
  private tokenExpiry: number = 0;
  private isDeployed: boolean = false;
  private deploymentChecked: boolean = false;

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

      const authData = response.data as ShiprocketAuthResponse;
      this.authToken = authData.token;
      this.tokenExpiry = Date.now() + authData.expires_in * 1000 - 60000; // 1 minute buffer

      return this.authToken;
    } catch (error) {
      console.error("Shiprocket authentication error:", error);
      throw new Error("Failed to authenticate with shipping service");
    }
  }

  /**
   * Check if Edge Functions are deployed
   */
  private async checkDeployment(): Promise<boolean> {
    if (this.deploymentChecked) {
      return this.isDeployed;
    }

    try {
      // Try to call a simple function to check if it exists
      const response = await supabase.functions.invoke("shiprocket-auth", {
        body: {},
      });

      // Check if we got a valid response (not a 404 or method not allowed)
      if (response.error) {
        this.isDeployed = false;
      } else {
        this.isDeployed = true;
      }
    } catch (error) {
      // Any error means functions aren't deployed
      this.isDeployed = false;
    }

    this.deploymentChecked = true;
    return this.isDeployed;
  }

  /**
   * Get shipping charges for cart items
   */
  async getShippingCharges(
    cartItems: CartItem[],
    deliveryAddress: Address
  ): Promise<CourierOption[]> {
    // Check if Edge Functions are deployed first
    const isDeployed = await this.checkDeployment();

    if (!isDeployed) {
      return this.getFallbackShippingOptions(cartItems, deliveryAddress);
    }

    try {
      // Authenticate first to get token
      const token = await this.authenticate();

      // Prepare shipment data
      const shipmentData = this.prepareShipmentData(cartItems, deliveryAddress);

      // Call the get-shipping-charge function with auth token
      const response = await supabase.functions.invoke("get-shipping-charge", {
        body: shipmentData,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.error) {
        throw new Error(
          `Shipping calculation failed: ${response.error.message}`
        );
      }

      const shippingData = response.data as ShippingChargeResponse;

      if (shippingData.status !== 200) {
        throw new Error(
          shippingData.message || "Failed to calculate shipping charges"
        );
      }

      return shippingData.data.available_courier_companies || [];
    } catch (error) {
      console.error("Shipping charges error:", error);

      // Fallback to mock shipping options if API fails
      return this.getFallbackShippingOptions(cartItems, deliveryAddress);
    }
  }

  /**
   * Get fallback shipping options when API is not available
   */
  private getFallbackShippingOptions(
    cartItems: CartItem[],
    deliveryAddress: Address
  ): CourierOption[] {
    const totalWeight = cartItems.reduce((sum, item) => {
      return sum + (item.weight || 0.5) * item.quantity;
    }, 0);

    // Calculate base shipping cost based on weight and distance
    const baseRate = Math.max(50, totalWeight * 20);
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + 3);

    return [
      {
        courier_id: 1,
        courier_name: "Fast Delivery",
        courier_logo: "",
        rate: Math.round(baseRate * 1.5),
        estimated_delivery_days: "2",
        estimated_delivery_date: new Date(
          Date.now() + 2 * 24 * 60 * 60 * 1000
        ).toISOString(),
        cod_available: true,
        pickup_pincode: cartItems[0]?.pickup_postcode || "110001",
        delivery_pincode: deliveryAddress.postal_code,
      },
      {
        courier_id: 2,
        courier_name: "Standard Delivery",
        courier_logo: "",
        rate: Math.round(baseRate),
        estimated_delivery_days: "4",
        estimated_delivery_date: new Date(
          Date.now() + 4 * 24 * 60 * 60 * 1000
        ).toISOString(),
        cod_available: true,
        pickup_pincode: cartItems[0]?.pickup_postcode || "110001",
        delivery_pincode: deliveryAddress.postal_code,
      },
      {
        courier_id: 3,
        courier_name: "Economy Delivery",
        courier_logo: "",
        rate: Math.round(baseRate * 0.7),
        estimated_delivery_days: "7",
        estimated_delivery_date: new Date(
          Date.now() + 7 * 24 * 60 * 60 * 1000
        ).toISOString(),
        cod_available: false,
        pickup_pincode: cartItems[0]?.pickup_postcode || "110001",
        delivery_pincode: deliveryAddress.postal_code,
      },
    ];
  }

  /**
   * Prepare shipment data for the API call
   */
  private prepareShipmentData(cartItems: CartItem[], deliveryAddress: Address) {
    // Get pickup pincode from the first item (assuming all items ship from same location)
    const pickupPincode = cartItems[0]?.pickup_postcode || "110001"; // Default to Delhi

    // Calculate total weight and dimensions
    let totalWeight = 0;
    let maxLength = 0;
    let maxBreadth = 0;
    let totalHeight = 0;

    cartItems.forEach((item) => {
      // Get product details with shipping properties
      const weight = item.weight || 0.5; // Default weight if not specified
      const length = item.length || 10; // Default dimensions if not specified
      const breadth = item.breadth || 10;
      const height = item.height || 5;

      totalWeight += weight * item.quantity;
      maxLength = Math.max(maxLength, length);
      maxBreadth = Math.max(maxBreadth, breadth);
      totalHeight += height * item.quantity;
    });

    return {
      pickup_pincode: pickupPincode,
      delivery_pincode: deliveryAddress.postal_code,
      weight: Math.max(totalWeight, 0.1), // Minimum 100g
      length: Math.max(maxLength, 1), // Minimum 1cm
      breadth: Math.max(maxBreadth, 1), // Minimum 1cm
      height: Math.max(totalHeight, 1), // Minimum 1cm
    };
  }

  /**
   * Format courier options for display
   */
  formatCourierOptions(courierOptions: CourierOption[]): {
    fastDelivery: CourierOption | null;
    normalDelivery: CourierOption | null;
    allOptions: CourierOption[];
  } {
    if (courierOptions.length === 0) {
      return {
        fastDelivery: null,
        normalDelivery: null,
        allOptions: [],
      };
    }

    // Sort by delivery days (ascending) and then by rate (ascending)
    const sortedOptions = [...courierOptions].sort((a, b) => {
      const daysA = parseInt(a.estimated_delivery_days) || 7;
      const daysB = parseInt(b.estimated_delivery_days) || 7;

      if (daysA !== daysB) {
        return daysA - daysB;
      }
      return a.rate - b.rate;
    });

    // Fast delivery: 1-2 days
    const fastDelivery =
      sortedOptions.find(
        (option) => parseInt(option.estimated_delivery_days) <= 2
      ) || sortedOptions[0]; // Fallback to fastest available

    // Normal delivery: 3+ days or cheapest option
    const normalDelivery =
      sortedOptions.find(
        (option) => parseInt(option.estimated_delivery_days) >= 3
      ) || sortedOptions[sortedOptions.length - 1]; // Fallback to cheapest

    return {
      fastDelivery,
      normalDelivery,
      allOptions: sortedOptions,
    };
  }

  /**
   * Get estimated delivery date
   */
  getEstimatedDeliveryDate(deliveryDays: string): string {
    const days = parseInt(deliveryDays) || 3;
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + days);

    return deliveryDate.toLocaleDateString("en-IN", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }
}

export const shippingService = new ShippingService();
