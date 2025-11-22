import { useState, useEffect } from "react";
import { Loader2, Truck, Clock, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { formatPrice } from "@/lib/utils";
import { shippingService, CourierOption } from "@/services/shippingService";
import { CartItem, Address } from "@/contexts/CartContext";

interface ShippingOptionsProps {
  cartItems: CartItem[];
  deliveryAddress: Address | null;
  selectedCourier: CourierOption | null;
  onCourierSelect: (courier: CourierOption) => void;
  isLoading?: boolean;
  onLoadingChange?: (loading: boolean) => void;
}

const ShippingOptions = ({
  cartItems,
  deliveryAddress,
  selectedCourier,
  onCourierSelect,
  isLoading = false,
  onLoadingChange,
}: ShippingOptionsProps) => {
  const [courierOptions, setCourierOptions] = useState<CourierOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasFetched, setHasFetched] = useState(false);

  useEffect(() => {
    if (deliveryAddress && cartItems.length > 0 && !hasFetched) {
      fetchShippingOptions();
    }
  }, [deliveryAddress, cartItems, hasFetched]);

  const fetchShippingOptions = async () => {
    if (!deliveryAddress || hasFetched) return;

    try {
      setLoading(true);
      setError(null);
      onLoadingChange?.(true);

      const options = await shippingService.getShippingCharges(
        cartItems,
        deliveryAddress
      );

      setCourierOptions(options);
      setHasFetched(true);

      // Auto-select the first option if none selected
      if (options.length > 0 && !selectedCourier) {
        onCourierSelect(options[0]);
      }
    } catch (err) {
      console.error("Error fetching shipping options:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load shipping options"
      );
      setHasFetched(true);
    } finally {
      setLoading(false);
      onLoadingChange?.(false);
    }
  };

  const formatDeliveryDate = (deliveryDays: string) => {
    const days = parseInt(deliveryDays) || 3;
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + days);

    return deliveryDate.toLocaleDateString("en-IN", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  const getDeliverySpeed = (days: string) => {
    const dayCount = parseInt(days) || 3;
    if (dayCount <= 2) return "Fast";
    if (dayCount <= 4) return "Standard";
    return "Economy";
  };

  const getDeliverySpeedColor = (days: string) => {
    const dayCount = parseInt(days) || 3;
    if (dayCount <= 2) return "text-green-600";
    if (dayCount <= 4) return "text-blue-600";
    return "text-orange-600";
  };

  if (!deliveryAddress) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Shipping Options
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>
              Please select a delivery address to see shipping options.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (loading || isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Shipping Options
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span>Calculating shipping charges...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Shipping Options
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button
            variant="outline"
            onClick={() => {
              setHasFetched(false);
              setError(null);
              fetchShippingOptions();
            }}
            className="mt-4 w-full"
          >
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (courierOptions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Shipping Options
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>
              No shipping options available for this address. Please try a
              different address.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Truck className="h-5 w-5" />
          Shipping Options
        </CardTitle>
      </CardHeader>
      <CardContent>
        <RadioGroup
          value={selectedCourier?.courier_id.toString() || ""}
          onValueChange={(value) => {
            const courier = courierOptions.find(
              (option) => option.courier_id.toString() === value
            );
            if (courier) {
              onCourierSelect(courier);
            }
          }}
          className="space-y-4"
        >
          {courierOptions.map((option) => (
            <div key={option.courier_id} className="relative">
              <Label
                htmlFor={`courier-${option.courier_id}`}
                className="flex items-start space-x-2 sm:space-x-3 p-3 sm:p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
              >
                <RadioGroupItem
                  value={option.courier_id.toString()}
                  id={`courier-${option.courier_id}`}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
                    <div className="flex items-center gap-2 sm:gap-3">
                      {option.courier_logo && (
                        <img
                          src={option.courier_logo}
                          alt={option.courier_name}
                          className="h-6 w-6 sm:h-8 sm:w-8 object-contain"
                        />
                      )}
                      <div className="min-w-0 flex-1">
                        <h3 className="font-medium text-gray-900 text-sm sm:text-base">
                          {option.courier_name}
                        </h3>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-xs sm:text-sm text-gray-500">
                          <span
                            className={`font-medium ${getDeliverySpeedColor(
                              option.estimated_delivery_days
                            )}`}
                          >
                            {getDeliverySpeed(option.estimated_delivery_days)}{" "}
                            Delivery
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {option.estimated_delivery_days} days
                          </span>
                          <span className="truncate">
                            Est. delivery:{" "}
                            {formatDeliveryDate(option.estimated_delivery_days)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between sm:block sm:text-right">
                      <div className="font-semibold text-base sm:text-lg">
                        {formatPrice(option.rate)}
                      </div>
                    </div>
                  </div>
                </div>
              </Label>
            </div>
          ))}
        </RadioGroup>

        {selectedCourier && (
          <div className="mt-3 sm:mt-4 p-2 sm:p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2 text-blue-800">
              <CheckCircle className="h-4 w-4 flex-shrink-0" />
              <span className="font-medium text-sm sm:text-base">
                Selected: {selectedCourier.courier_name}
              </span>
            </div>
            <div className="text-xs sm:text-sm text-blue-700 mt-1">
              Delivery in {selectedCourier.estimated_delivery_days} days • Est.
              delivery:{" "}
              {formatDeliveryDate(selectedCourier.estimated_delivery_days)}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ShippingOptions;
