import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Package, Search, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Layout from "@/components/Layout";
import ShipmentTracking from "@/components/shop/ShipmentTracking";
import { shipmentService } from "@/services/shipmentService";

const TrackShipment = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [trackingNumber, setTrackingNumber] = useState(
    searchParams.get("tracking") || ""
  );
  const [orderId, setOrderId] = useState(searchParams.get("order") || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trackingData, setTrackingData] = useState<any>(null);

  const handleTrack = async () => {
    if (!trackingNumber.trim()) {
      setError("Please enter a tracking number");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const status = await shipmentService.getTrackingStatus(
        trackingNumber,
        orderId || undefined
      );
      setTrackingData(status);

      // Update URL with tracking number
      const newParams = new URLSearchParams();
      newParams.set("tracking", trackingNumber);
      if (orderId) newParams.set("order", orderId);
      setSearchParams(newParams);
    } catch (err) {
      console.error("Error tracking shipment:", err);
      setError(err instanceof Error ? err.message : "Failed to track shipment");
      setTrackingData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleTrack();
    }
  };

  return (
    <Layout>
      <div className="container mx-auto py-10">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-4">Track Your Shipment</h1>
            <p className="text-gray-600">
              Enter your tracking number to get real-time updates on your
              shipment
            </p>
          </div>

          {/* Tracking Input */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Search className="h-5 w-5" />
                <span>Enter Tracking Details</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="tracking"
                    className="block text-sm font-medium mb-2"
                  >
                    Tracking Number
                  </label>
                  <Input
                    id="tracking"
                    type="text"
                    placeholder="Enter your tracking number"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="w-full"
                  />
                </div>

                <div>
                  <label
                    htmlFor="order"
                    className="block text-sm font-medium mb-2"
                  >
                    Order ID (Optional)
                  </label>
                  <Input
                    id="order"
                    type="text"
                    placeholder="Enter your order ID"
                    value={orderId}
                    onChange={(e) => setOrderId(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="w-full"
                  />
                </div>

                <Button
                  onClick={handleTrack}
                  disabled={loading || !trackingNumber.trim()}
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Tracking...
                    </>
                  ) : (
                    <>
                      <Search className="h-4 w-4 mr-2" />
                      Track Shipment
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Error Display */}
          {error && (
            <Alert className="mb-6 border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {/* Tracking Results */}
          {trackingData && (
            <ShipmentTracking
              orderId={orderId}
              trackingNumber={trackingNumber}
              shipmentStatus={trackingData.current_status}
              courierName={trackingData.courier_name}
              estimatedDeliveryDate={trackingData.estimated_delivery_date}
            />
          )}

          {/* No tracking data yet */}
          {!trackingData && !loading && !error && trackingNumber && (
            <Card>
              <CardContent className="text-center py-8">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No Results Found</h3>
                <p className="text-gray-500">
                  We couldn't find any tracking information for this number.
                  Please check the tracking number and try again.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Help Section */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Need Help?</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm text-gray-600">
                <p>
                  <strong>Where to find your tracking number:</strong>
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Check your order confirmation email</li>
                  <li>Look in your order history</li>
                  <li>Contact customer support if you can't find it</li>
                </ul>
                <p>
                  <strong>Tracking updates:</strong> Shipment status is updated
                  in real-time. If you don't see recent updates, the package
                  might be in transit between facilities.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default TrackShipment;
